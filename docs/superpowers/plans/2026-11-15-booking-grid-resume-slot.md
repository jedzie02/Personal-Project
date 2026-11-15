# Booking Grid "Resume" Slot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show an active "Resume" button on schedule grid slots for logged-in players who initiated an unfinished QR payment, while locking the slot as "Held" for other visitors.

**Architecture:** Create court bookings in `status: "pending"`, enrich grid cell data with customer ID and pending status in `booking-grid.service.ts`, render an active "Resume" cell button in `BookingGrid` for the booking owner, and transition the booking to `status: "confirmed"` once payment is completed.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS, Supabase, Vitest.

**Spec:** `docs/superpowers/specs/2026-11-15-booking-grid-resume-slot-design.md`

## Global Constraints

- Never show "Resume" to a different player or logged-out guest; other visitors must see "Held" with a lock icon.
- Holds older than 15 minutes without payment must be released back to "Available".
- Match existing Tailwind styling, dark mode tokens, and Vitest testing conventions.

## Review Focus

1. **Guest user view:** A logged-out user viewing a pending slot must see "Held" and cannot click "Resume".
2. **Correct user match:** Only the user whose `user.id === cell.booking.customerId` sees "Resume".
3. **Multi-hour booking blocks:** Multi-hour pending bookings must correctly mark each covered hour as "Resume" for the owner.
4. **Transition upon payment completion:** Once "I've Completed Payment" is clicked, the booking moves from `pending` to `confirmed` and shows "Booked".
5. **My Bookings list:** Pending reservations in `/bookings` must display "Resume Payment" linking to `/book/payment?bookingId={id}`.

---

### Task 1: Store `status: "pending"` on booking creation

**Files:**
- Modify: `src/app/confirm-booking/actions.ts`
- Test: `src/app/confirm-booking/confirm-actions.test.ts`

**Interfaces:**
- Consumes: `createBooking` from `@/lib/services/booking.service`
- Produces: Reservation created with `markAsConfirmed: false` (status `pending`).

- [ ] **Step 1: Write the failing test**

```ts
// src/app/confirm-booking/confirm-actions.test.ts
import { describe, it, expect, vi } from "vitest";
import { submitConfirmBooking } from "./actions";

vi.mock("@/lib/supabase/server", () => ({
    createClient: vi.fn().mockResolvedValue({
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-123", email: "test@example.com" } } }) },
        from: () => ({
            select: () => ({ eq: () => ({ maybeSingle: vi.fn().mockResolvedValue({ data: null }) }) }),
            insert: vi.fn().mockResolvedValue({}),
        }),
    }),
}));

vi.mock("@/lib/services/auth.server", () => ({
    getCurrentProfile: vi.fn().mockResolvedValue({ id: "user-123", email: "test@example.com", full_name: "Test User" }),
}));

const mockCreateBooking = vi.fn().mockResolvedValue({ success: true, bookingId: "bk-999" });
vi.mock("@/lib/services/booking.service", () => ({
    createBooking: (...args: any[]) => mockCreateBooking(...args),
    cancelBooking: vi.fn(),
}));

describe("submitConfirmBooking", () => {
    it("creates the booking with markAsConfirmed: false so it remains pending payment", async () => {
        await submitConfirmBooking({
            courtId: "court-1",
            rate: 300,
            paymentMethod: "QR Ph",
            date: "2026-11-15",
            start: "14:00",
            end: "15:00",
        });

        expect(mockCreateBooking).toHaveBeenCalledWith(
            expect.objectContaining({
                markAsConfirmed: false,
                paymentStatus: "pending",
            })
        );
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/app/confirm-booking/confirm-actions.test.ts`  
Expected: FAIL (`markAsConfirmed` received `true`).

- [ ] **Step 3: Modify `src/app/confirm-booking/actions.ts`**

Change `markAsConfirmed: true` to `markAsConfirmed: false` in `submitConfirmBooking` so the reservation is created in `status: "pending"`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/app/confirm-booking/confirm-actions.test.ts`  
Expected: PASS

---

### Task 2: Include customer ID, pending status, and hold expiration in `booking-grid.service.ts`

**Files:**
- Modify: `src/lib/services/booking-grid.service.ts`
- Test: `src/lib/services/booking-grid.service.test.ts`

**Interfaces:**
- Consumes: Supabase `bookings` table (`status`, `customer_id`, `created_at`)
- Produces: `GridCell.booking` containing `customerId`, `status`, and hold validity.

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/services/booking-grid.service.test.ts
import { describe, it, expect, vi } from "vitest";
import { getBookingGridForDate } from "./booking-grid.service";

// Verify that a pending booking has customerId and status: "pending" in the cell
describe("booking-grid.service pending holds", () => {
    it("attaches customerId and status to cell booking data", async () => {
        // Assert cell.booking has customerId and status
    });
});
```

- [ ] **Step 2: Update `booking-grid.service.ts`**

1. Update `GridCell.booking` interface:
```ts
booking?: {
    id: string;
    startTime: string;
    endTime: string;
    durationHours: number;
    customerName: string | null;
    customerId?: string;
    status?: string;
};
```
2. In `getBookingGridForDate`:
   - Fetch `created_at` in the booking query.
   - For `booking.status === "pending"`, check if `created_at` is older than 15 minutes. If expired, ignore it (slot remains "available").
   - If active, include `customerId: booking.customer_id`, `status: booking.status` in the cell's `booking` object.

- [ ] **Step 3: Run test to verify it passes**

Run: `npx vitest run src/lib/services/booking-grid.service.test.ts`  
Expected: PASS

---

### Task 3: Render "Resume" cell button on `BookingGrid` for owner and "Held" for others

**Files:**
- Modify: `src/components/booking/BookingGrid.tsx`
- Test: `src/components/booking/BookingGrid.test.tsx`

**Interfaces:**
- Consumes: `user?.id` from auth, `cell.booking`
- Produces: "Resume" button routing to `/book/payment?bookingId=${id}`, "Held" for others.

- [ ] **Step 1: Write the failing test in `BookingGrid.test.tsx`**

Test that when a cell has a pending booking matching `currentUserId`, the cell renders "Resume", and when `currentUserId` differs, it renders "Held".

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/booking/BookingGrid.test.tsx`  
Expected: FAIL.

- [ ] **Step 3: Update `BookingGrid.tsx`**

In `CellContent`:
```tsx
if (cell.booking && cell.booking.status === "pending") {
    const isOwner = isLoggedIn && currentUserId === cell.booking.customerId;
    if (isOwner) {
        return (
            <button
                type="button"
                onClick={() => router.push(`/book/payment?bookingId=${cell.booking!.id}`)}
                className="w-full h-full min-h-[44px] rounded-[14px] py-2 flex items-center justify-center bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs gap-1.5 shadow-xs cursor-pointer transition-colors"
            >
                <Play className="size-3 fill-current" />
                <span>Resume</span>
            </button>
        );
    }
    return (
        <div className="w-full h-full min-h-[44px] rounded-[14px] bg-slate-100 dark:bg-slate-800/70 flex flex-col items-center justify-center gap-0.5 py-2 cursor-not-allowed">
            <Lock className="size-3.5 text-slate-400 dark:text-slate-500" />
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase">Held</span>
        </div>
    );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/booking/BookingGrid.test.tsx`  
Expected: PASS

---

### Task 4: Complete payment transition and My Bookings resume link

**Files:**
- Modify: `src/app/book/payment/actions.ts`
- Modify: `src/app/bookings/page.tsx`
- Test: `src/app/book/payment/actions.test.ts`

**Interfaces:**
- Consumes: `completePaymentAction`
- Produces: Sets `status: "confirmed"` in Supabase; `/bookings` renders "Resume Payment" button for pending bookings.

- [ ] **Step 1: Update `completePaymentAction` in `src/app/book/payment/actions.ts`**

Update `completePaymentAction` to set `status: "confirmed"` when the user clicks "I've Completed Payment" (in addition to setting the payment reference).

- [ ] **Step 2: Update `src/app/bookings/page.tsx`**

For any booking where `booking.status === "pending"`, the card button links to `/book/payment?bookingId=${booking.id}` with label "Resume Payment".

- [ ] **Step 3: Run tests to verify**

Run: `npx vitest run src/app/book/payment/actions.test.ts`  
Expected: PASS

---

### Task 5: Full test suite verification

- [ ] **Step 1: Run complete test suite**

Run: `npm test -- --run`  
Expected: All tests pass (0 failures).
