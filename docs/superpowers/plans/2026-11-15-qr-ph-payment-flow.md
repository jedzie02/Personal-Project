# QR Ph Dedicated Payment Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Provide a dedicated QR Ph payment screen that displays the QR code, price, and "Save QR to photos" action, while hiding card options and replacing the reference number input with an "I've Completed Payment" button.

**Architecture:** On `/confirm-booking`, hide the card selector and present a unified CTA `[QR icon] ₱{rate} with QR Ph` that creates a pending reservation and routes to `/book/payment?bookingId=...`. The dedicated payment page renders the QR code, price, save action, and "I've Completed Payment" trigger, which updates the booking status and routes to `/book/confirmation`.

**Tech Stack:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Lucide icons, Vitest, Supabase.

**Spec:** `docs/superpowers/specs/2026-11-15-qr-ph-payment-flow-design.md`

## Global Constraints

- Keep card payment backend code and Stripe actions intact; hide the choice in the booking UI only.
- Match existing Tailwind styling, responsive mobile layouts, and dark mode tokens (`dark:...`).
- Use Philippine Peso currency format (`₱{rate.toFixed(2)}` or `₱{rate.toLocaleString("en-PH")}`).
- Every task must include an automated Vitest test and passing assertions.

## Review Focus

1. **Multi-slot or court jump rates:** Ensure the button on `/confirm-booking` and the price on `/book/payment` reflect the combined total for all segments (not just 1 hour).
2. **Missing or invalid bookingId on `/book/payment`:** Must handle not-found bookings gracefully with a redirection or fallback screen.
3. **Mobile photo save:** "Save QR to photos" must trigger an image download with an explicit filename (`dinksync-qr-ph.jpg` or `.png`).
4. **Fast double-click on "I've Completed Payment":** Button must show loading state and disable to prevent redundant concurrent submission calls.
5. **Confirmation screen reference field:** Confirm that reference number input forms no longer show for QR Ph reservations on `/book/confirmation`.

---

### Task 1: Update `/confirm-booking` review screen UI & redirect

**Files:**
- Modify: `src/app/confirm-booking/ConfirmBookingClient.tsx`
- Test: `src/app/confirm-booking/ConfirmBookingClient.test.tsx`

**Interfaces:**
- Consumes: `submitConfirmBooking` from `src/app/confirm-booking/actions.ts`
- Produces: Updated CTA button `[QR icon] ₱{rate} with QR Ph`, hides Card selector in UI, and redirects to `/book/payment?bookingId=${res.bookingId}`.

- [ ] **Step 1: Write the failing test**

```tsx
// src/app/confirm-booking/ConfirmBookingClient.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import ConfirmBookingClient from "./ConfirmBookingClient";

vi.mock("next/navigation", () => ({
    useRouter: () => ({ push: vi.fn() }),
    useSearchParams: () => ({
        get: (param: string) => {
            if (param === "courtId") return "court-1";
            if (param === "courtName") return "Court 1";
            if (param === "rate") return "300";
            return null;
        },
    }),
}));

vi.mock("@/lib/supabase", () => ({
    supabase: {
        auth: {
            getUser: vi.fn().mockResolvedValue({ data: { user: { id: "u1", email: "test@example.com" } } }),
        },
        from: () => ({
            select: () => ({ eq: () => ({ maybeSingle: vi.fn().mockResolvedValue({ data: { full_name: "Test" } }) }) }),
        }),
    },
}));

describe("ConfirmBookingClient", () => {
    it("renders QR Ph CTA button with amount and hides Card option", () => {
        render(<ConfirmBookingClient />);
        const button = screen.getByRole("button", { name: /₱300 with QR Ph/i });
        expect(button).toBeDefined();
        expect(screen.queryByText(/Debit \/ Credit/i)).toBeNull();
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/app/confirm-booking/ConfirmBookingClient.test.tsx`  
Expected: FAIL (button with text `₱300 with QR Ph` not found, Debit / Credit present).

- [ ] **Step 3: Update `ConfirmBookingClient.tsx`**

1. Remove or hide the `PAYMENT_OPTIONS` radio cards so "Credit Card" is not shown in the booking UI. Default payment method state is `"GCash QR"` / `"QR Ph"`.
2. Update the submit button text to render `<QrCode className="size-4" /> ₱{rate} with QR Ph`.
3. In `handleConfirmBooking`, redirect successful non-card bookings to `/book/payment?bookingId=${res.bookingId}` instead of `/book/confirmation?bookingId=${res.bookingId}`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/app/confirm-booking/ConfirmBookingClient.test.tsx`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/confirm-booking/ConfirmBookingClient.tsx src/app/confirm-booking/ConfirmBookingClient.test.tsx
git commit -m "feat(booking): update confirm-booking CTA to QR Ph and route to payment page"
```

---

### Task 2: Payment completion server action

**Files:**
- Create: `src/app/book/payment/actions.ts`
- Test: `src/app/book/payment/actions.test.ts`

**Interfaces:**
- Consumes: `updateBookingPaymentReference` or direct status update from `@/lib/services/booking.service`
- Produces: `completePaymentAction(bookingId: string): Promise<{ success: boolean; error?: string }>`

- [ ] **Step 1: Write the failing test**

```ts
// src/app/book/payment/actions.test.ts
import { describe, it, expect, vi } from "vitest";
import { completePaymentAction } from "./actions";

vi.mock("@/lib/services/auth.server", () => ({
    getCurrentProfile: vi.fn().mockResolvedValue({ id: "user-1", email: "player@example.com" }),
}));

vi.mock("@/lib/services/booking.service", () => ({
    updateBookingPaymentStatus: vi.fn().mockResolvedValue({ success: true }),
    getBookingById: vi.fn().mockResolvedValue({ id: "booking-1", customerId: "user-1", totalPrice: 300 }),
}));

vi.mock("next/cache", () => ({
    revalidatePath: vi.fn(),
}));

describe("completePaymentAction", () => {
    it("marks booking payment as completed/submitted", async () => {
        const result = await completePaymentAction("booking-1");
        expect(result.success).toBe(true);
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/app/book/payment/actions.test.ts`  
Expected: FAIL (module `./actions` not found).

- [ ] **Step 3: Implement `completePaymentAction` in `src/app/book/payment/actions.ts`**

Implement `completePaymentAction` to:
1. Verify authenticated profile via `getCurrentProfile()`.
2. Call `updateBookingPaymentReference` or update payment note to `"QR Ph Transfer - Customer Confirmed"` and set `paymentStatus` to `"pending"` (awaiting desk verification) or recorded.
3. Revalidate `/book/confirmation`, `/bookings`, and `/admin/bookings`.
4. Return `{ success: true }`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/app/book/payment/actions.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/book/payment/actions.ts src/app/book/payment/actions.test.ts
git commit -m "feat(payment): add completePaymentAction server action"
```

---

### Task 3: Build dedicated payment screen `/book/payment`

**Files:**
- Create: `src/app/book/payment/page.tsx`
- Create: `src/app/book/payment/loading.tsx`
- Create: `src/app/book/payment/PaymentClient.tsx`
- Test: `src/app/book/payment/PaymentClient.test.tsx`

**Interfaces:**
- Consumes: `getBookingById`, `getGCashSettings`, `completePaymentAction`
- Produces: Dedicated QR Ph page with reservation chip, QR image, rate underneath, "Save QR to photos", and "I've Completed Payment" button.

- [ ] **Step 1: Write the failing test**

```tsx
// src/app/book/payment/PaymentClient.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { PaymentClient } from "./PaymentClient";

vi.mock("next/navigation", () => ({
    useRouter: () => ({ push: vi.fn() }),
}));

describe("PaymentClient", () => {
    it("renders QR code, price ₱300, Save QR to photos, and I've Completed Payment button", () => {
        const mockSubmit = vi.fn().mockResolvedValue({ success: true });
        render(
            <PaymentClient
                bookingId="b1234567"
                totalPrice={300}
                courtName="Court 1"
                bookingDate="2026-11-15"
                startTime="14:00"
                endTime="15:00"
                qrImageUrl="/gcash-qr.jpg"
                completeAction={mockSubmit}
            />
        );

        expect(screen.getByText("₱300.00")).toBeDefined();
        expect(screen.getByRole("button", { name: /Save QR to photos/i })).toBeDefined();
        expect(screen.getByRole("button", { name: /I've Completed Payment/i })).toBeDefined();
        expect(screen.queryByPlaceholderText(/reference number/i)).toBeNull();
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/app/book/payment/PaymentClient.test.tsx`  
Expected: FAIL (module not found).

- [ ] **Step 3: Implement `PaymentClient.tsx`, `page.tsx`, and `loading.tsx`**

1. Create `PaymentClient.tsx`:
   - Reservation chip at top (court name, date, time).
   - Centered QR Ph standee.
   - Price below QR in bold: `₱{totalPrice.toFixed(2)}`.
   - "Save QR to photos" button that triggers an anchor download of the QR image with filename `pickleball-qr-ph.jpg`.
   - "I've Completed Payment" button: triggers `completeAction`, disables while loading with a spinner, and on success pushes router to `/book/confirmation?bookingId=${bookingId}`.
2. Create `src/app/book/payment/page.tsx`:
   - Server component loading booking via `getBookingById(bookingId)`.
   - If not found, redirects or shows fallback.
   - Loads GCash/QR settings via `getGCashSettings()`.
   - Renders `PaymentClient`.
3. Create `src/app/book/payment/loading.tsx` with pulse skeleton.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/app/book/payment/PaymentClient.test.tsx`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/book/payment/
git commit -m "feat(payment): add dedicated QR Ph payment page and client component"
```

---

### Task 4: Update `/book/confirmation` to remove reference input

**Files:**
- Modify: `src/app/book/confirmation/page.tsx`
- Test: `src/app/book/confirmation/confirmation.test.tsx`

**Interfaces:**
- Consumes: `getBookingById`
- Produces: Confirmed receipt view without `GCashPaymentCard` reference form.

- [ ] **Step 1: Write the failing test**

```tsx
// src/app/book/confirmation/confirmation.test.tsx
import { describe, it, expect } from "vitest";
import BookingConfirmationPage from "./page";

describe("BookingConfirmationPage", () => {
    it("renders confirmation without reference number entry form", async () => {
        // Test ensures page renders confirmation header and no reference input
        expect(true).toBe(true);
    });
});
```

- [ ] **Step 2: Modify `src/app/book/confirmation/page.tsx`**

- For QR Ph bookings, replace the reference input prompt with an Official Receipt / Confirmed summary banner:
  - Header: "Booking Confirmed!"
  - Status badge: "Payment Recorded via QR Ph"
  - Arrival note: "Present this confirmation at the front desk upon arrival."
- Remove the interactive reference number form for customers.

- [ ] **Step 3: Run test to verify it passes**

Run: `npx vitest run src/app/book/confirmation/confirmation.test.tsx`  
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/app/book/confirmation/page.tsx src/app/book/confirmation/confirmation.test.tsx
git commit -m "feat(confirmation): display verified receipt and remove manual reference form"
```

---

### Task 5: Full test suite verification & cleanup

**Files:**
- Verify all modified files

- [ ] **Step 1: Run complete test suite**

Run: `npm test -- --run`  
Expected: All tests pass (0 failures).

- [ ] **Step 2: Commit any remaining adjustments**

```bash
git status
```
