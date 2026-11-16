# Open Play QR Ph Payment Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align Open Play payment with Court Booking by introducing a dedicated `/open-play/payment` QR Ph screen that auto-confirms spots via "I've Completed Payment" without manual reference number entry.

**Architecture:** A dedicated Next.js App Router page `/open-play/payment` renders a QR Ph Standee with download option and "I've Completed Payment" button. Server actions claim the spot hold upon join, transition it to `paid` upon completion, and display the finalized ticket at `/open-play/confirmation`.

**Tech Stack:** Next.js (App Router, Server Actions), Supabase (PostgreSQL), Lucide React, Tailwind CSS, Vitest.

**Spec:** `docs/superpowers/specs/2026-11-16-open-play-qrph-payment-design.md`

## Global Constraints
- Operating in ponytail mode (full): minimal diffs, zero unnecessary abstractions or extra dependencies.
- No kicker/eyebrows above headings, tabular numerals (`tabular-nums`) for currency (`₱`), `text-xs` minimum size step on type ramp.
- All tests must pass: `npm test -- --run` and TypeScript type check `npx tsc --noEmit`.

## Review Focus
- Unauthenticated user navigating to `/open-play/payment`: redirects to `/login`.
- Invalid or expired entryId: renders friendly "Entry Not Found" state with back button to `/open-play`.
- Duplicate payment completion: handles already paid entries idempotently without error.
- Image download failure fallback: opens image in new tab if blob fetch fails.
- Mobile responsiveness: QR code and details stack vertically without horizontal overflow.

---

### Task 1: Backend Service & Server Actions

**Files:**
- Modify: `src/lib/services/open-play.service.ts`
- Modify: `src/app/open-play/actions.ts`
- Modify: `src/lib/services/open-play.service.test.ts`
- Create: `src/app/open-play/payment/actions.test.ts`

**Interfaces:**
- Produces:
  - `completeOpenPlayPayment(entryId: string, customerId: string): Promise<{ ok: boolean; error?: string }>` in `open-play.service.ts`
  - `completeOpenPlayPaymentAction(entryId: string): Promise<{ success: boolean; error?: string }>` in `src/app/open-play/payment/actions.ts` (or `src/app/open-play/actions.ts`)
  - Updated `startOpenPlayJoin(sessionId, customerId, customerEmail, paymentMethod = "QR Ph")` returning `url: /open-play/payment?entryId=${entryId}`.

- [x] **Step 1: Write the failing tests**

```typescript
// in src/lib/services/open-play.service.test.ts
it("parseEntryPaymentMeta recognizes QR Ph payment tokens", () => {
    expect(parseEntryPaymentMeta("QR Ph")).toEqual({
        paymentMethod: "QR Ph",
        paymentReference: null,
        isRefunded: false,
    });
    expect(parseEntryPaymentMeta("QRPH-12345678")).toEqual({
        paymentMethod: "QR Ph",
        paymentReference: "QRPH-12345678",
        isRefunded: false,
    });
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/services/open-play.service.test.ts`
Expected: FAIL if QR Ph parser is not matching or returning correct defaults.

- [x] **Step 3: Implement `completeOpenPlayPayment` and update `startOpenPlayJoin`**

In `src/lib/services/open-play.service.ts`:
- Update `parseEntryPaymentMeta` to support `"QR Ph"` and `"QRPH-"` prefixes.
- Update `startOpenPlayJoin` to route to `/open-play/payment?entryId=${encodeURIComponent(entryId)}` and default to `"QR Ph"`.
- Implement `completeOpenPlayPayment(entryId: string, customerId: string)`:
  - Updates entry in `open_play_entries`:
    `status: "paid"`, `stripe_checkout_session_id: "QRPH-" + entryId.slice(0, 8).toUpperCase()`.
  - Returns `{ ok: true }`.

In `src/app/open-play/actions.ts`:
- Add `completeOpenPlayPaymentAction(entryId: string)` verifying `getCurrentProfile()` and revalidating `/open-play`, `/open-play/confirmation`, `/bookings`, and `/admin/open-play`.

- [x] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/services/open-play.service.test.ts`
Expected: PASS

- [x] **Step 5: Commit**

```bash
git add src/lib/services/open-play.service.ts src/app/open-play/actions.ts src/lib/services/open-play.service.test.ts
git commit -m "feat(open-play): add completeOpenPlayPayment service and action"
```

---

### Task 2: OpenPlayPaymentClient Component

**Files:**
- Create: `src/app/open-play/payment/OpenPlayPaymentClient.tsx`
- Create: `src/app/open-play/payment/OpenPlayPaymentClient.test.tsx`

**Interfaces:**
- Consumes: `completeOpenPlayPaymentAction` from `src/app/open-play/actions.ts`
- Produces: `OpenPlayPaymentClient({ entryId, totalPrice, courtName, sessionDate, startTime, endTime, qrImageUrl, gcashName, gcashNumber, completeAction })`

- [x] **Step 1: Write the failing test**

```typescript
// in src/app/open-play/payment/OpenPlayPaymentClient.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { OpenPlayPaymentClient } from "./OpenPlayPaymentClient";

describe("OpenPlayPaymentClient", () => {
    it("renders session info, amount, and payment button", () => {
        render(
            <OpenPlayPaymentClient
                entryId="entry-1"
                totalPrice={100}
                courtName="Court 1"
                sessionDate="2026-11-20"
                startTime="18:00"
                endTime="20:00"
                completeAction={vi.fn().mockResolvedValue({ success: true })}
            />
        );
        expect(screen.getByText("Scan QR Ph to Pay")).toBeDefined();
        expect(screen.getByText("₱100.00")).toBeDefined();
        expect(screen.getByText("I've Completed Payment")).toBeDefined();
    });
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/app/open-play/payment/OpenPlayPaymentClient.test.tsx`
Expected: FAIL (file doesn't exist).

- [x] **Step 3: Implement `OpenPlayPaymentClient.tsx`**

Build client component patterned off `PaymentClient.tsx`:
- Header with QR icon and "Scan QR Ph to Pay".
- Chip displaying `courtName`, `sessionDate`, and formatted `startTime – endTime`.
- QR Code Image with fallback to `/gcash-qr.jpg`.
- Bold tabular amount `₱{totalPrice.toFixed(2)}` and optional account info.
- "Save QR to photos" button downloading the image.
- "I've Completed Payment" button with `Loader2` transition and navigation to `/open-play/confirmation?entryId=${entryId}`.
- "Cancel" button linking back to `/open-play`.

- [x] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/app/open-play/payment/OpenPlayPaymentClient.test.tsx`
Expected: PASS.

- [x] **Step 5: Commit**

```bash
git add src/app/open-play/payment/OpenPlayPaymentClient.tsx src/app/open-play/payment/OpenPlayPaymentClient.test.tsx
git commit -m "feat(open-play): create OpenPlayPaymentClient component"
```

---

### Task 3: Payment Page Route & Loading Skeleton

**Files:**
- Create: `src/app/open-play/payment/page.tsx`
- Create: `src/app/open-play/payment/loading.tsx`
- Create: `src/app/open-play/payment/page.test.tsx`

**Interfaces:**
- Consumes:
  - `getCurrentProfile()` from `@/lib/services/auth.server`
  - `getEntryForCustomer(entryId, customerId)` from `@/lib/services/open-play.service`
  - `getGCashSettings()` from `@/lib/services/settings.service`
  - `OpenPlayPaymentClient` from `./OpenPlayPaymentClient`

- [x] **Step 1: Write the failing test**

```typescript
// in src/app/open-play/payment/page.test.tsx
import { describe, it, expect, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import OpenPlayPaymentPage from "./page";

vi.mock("@/lib/services/auth.server", () => ({
    getCurrentProfile: vi.fn().mockResolvedValue({ id: "user-1", email: "user@test.com" }),
}));

vi.mock("@/lib/services/open-play.service", () => ({
    getEntryForCustomer: vi.fn().mockResolvedValue({
        id: "entry-1",
        amount: 100,
        status: "pending",
        session: {
            courtName: "Court 1",
            date: "2026-11-20",
            startTime: "18:00",
            endTime: "20:00",
        },
    }),
}));

vi.mock("@/lib/services/settings.service", () => ({
    getGCashSettings: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/components/Navbar", () => ({
    Navbar: () => <nav>Navbar</nav>,
}));

describe("OpenPlayPaymentPage", () => {
    it("renders payment page with session details", async () => {
        const jsx = await OpenPlayPaymentPage({ searchParams: Promise.resolve({ entryId: "entry-1" }) });
        const html = renderToStaticMarkup(jsx);
        expect(html).toContain("Scan QR Ph to Pay");
        expect(html).toContain("Court 1");
    });
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/app/open-play/payment/page.test.tsx`
Expected: FAIL.

- [x] **Step 3: Implement `src/app/open-play/payment/page.tsx` and `loading.tsx`**

Implement page:
- Verifies user authentication; redirects to `/login` if not signed in.
- Loads entry via `getEntryForCustomer(entryId, profile.id)`.
- If entry not found or cancelled, renders friendly empty card with button to `/open-play`.
- If entry is already `paid`, redirects straight to `/open-play/confirmation?entryId=${entryId}`.
- Otherwise fetches `getGCashSettings()` and renders `OpenPlayPaymentClient`.
- Implement matching `loading.tsx` skeleton.

- [x] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/app/open-play/payment/page.test.tsx`
Expected: PASS.

- [x] **Step 5: Commit**

```bash
git add src/app/open-play/payment/page.tsx src/app/open-play/payment/loading.tsx src/app/open-play/payment/page.test.tsx
git commit -m "feat(open-play): add /open-play/payment route and loading skeleton"
```

---

### Task 4: Streamline Confirmation Page

**Files:**
- Modify: `src/app/open-play/confirmation/page.tsx`
- Modify: `src/components/booking/OpenPlaySection.tsx` (verify explainer)

**Interfaces:**
- Consumes: `open_play_entries` with status `'paid'` or `'pending'`
- Produces: Streamlined receipt UI without manual 13-digit reference number form.

- [x] **Step 1: Update `src/app/open-play/confirmation/page.tsx`**

- Remove `GCashPaymentCard` reference input form.
- For confirmed entries (`isPaid` or status `paid`), render the green checkmark "Spot Reserved & Paid", reference number tag (`Ref: QRPH-...`), court, date, time, and link to `/open-play`.
- If an entry is somehow still pending, display a polite "Payment Processing / Present confirmation at counter" notice rather than demanding a 13-digit manual reference input.

- [x] **Step 2: Run unit test suite to verify no regressions**

Run: `npm test -- --run`
Expected: All tests pass.

- [x] **Step 3: Commit**

```bash
git add src/app/open-play/confirmation/page.tsx
git commit -m "refactor(open-play): streamline confirmation page to show verified ticket receipt"
```

---

### Task 5: End-to-End Verification & Mechanical Lint

**Files:**
- All touched files

- [x] **Step 1: Run mechanical detector**

Run: `.agent/skills/impeccable/scripts/impeccable.cmd detect --json src/app/open-play/payment/page.tsx src/app/open-play/payment/OpenPlayPaymentClient.tsx src/app/open-play/confirmation/page.tsx`
Expected: `[]` (0 issues).

- [x] **Step 2: Run full TypeScript check**

Run: `npx tsc --noEmit`
Expected: 0 errors.

- [x] **Step 3: Run full test suite**

Run: `npm test -- --run`
Expected: 100% pass across all test files.

- [x] **Step 4: Push to origin**

```bash
git push origin main
```
