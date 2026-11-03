# Email Payment Receipt Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Send a Paddlix HTML/text payment receipt email via Gmail SMTP whenever a Card (Stripe) payment succeeds or an admin marks a GCash QR booking as paid.

**Architecture:** A pure receipt-formatting helper (`buildReceiptEmailContent`) builds the subject, plain-text, and HTML payload and gates eligibility (`isOnlineReceiptEligible`), while `sendPaymentReceiptEmail(bookingId)` in `src/lib/services/email.service.ts` fetches the booking + profile data and dispatches via `nodemailer` using `GMAIL_USER` and `GMAIL_APP_PASSWORD`. Both `markPaymentSucceeded` and `markPaymentPaidInCash` (reused by `markBookingPaidInCashAction`) call `sendPaymentReceiptEmail(bookingId)` non-blockingly.

**Tech Stack:** Next.js App Router, TypeScript, Supabase, `nodemailer`, Vitest.

**Spec:** `docs/superpowers/specs/2026-11-03-email-receipt-design.md`

## Global Constraints

- Uses `nodemailer` with Gmail SMTP (`GMAIL_USER` and `GMAIL_APP_PASSWORD` environment variables in `.env.local`).
- If `GMAIL_USER` or `GMAIL_APP_PASSWORD` is missing, log a clear warning and skip sending without throwing an error.
- Never send receipts for **Cash walk-in** bookings (`isOnlineReceiptEligible` returns `false` for Cash walk-in).
- Currency amounts formatted in Philippine Pesos (`₱`) with 12-hour AM/PM time slots (`formatTime`).

## Review Focus

- Cash walk-in bookings marked paid by an admin must NOT trigger an email (`isOnlineReceiptEligible("Cash walk in") === false`).
- Bookings with no customer email on record (`customerEmail: null`) must return `{ sent: false, skippedReason: "no-email" }` without throwing.
- Missing `GMAIL_USER` or `GMAIL_APP_PASSWORD` env vars must return `{ sent: false, skippedReason: "missing-smtp-config" }` without throwing.
- Multi-segment court-jump bookings sharing a `payment_reference` must sum the total across all segments and list each segment in the receipt itinerary.
- `/admin/bookings` "Mark as Paid" (`markBookingPaidInCashAction`) and `/admin/payments` "Mark as Paid" (`markPaymentPaidInCash`) must both preserve `payment_method` and trigger the receipt for GCash QR.

---

### Task 1: Receipt Eligibility & Email Template Service (`email.service.ts`)

**Files:**
- Modify: `package.json` (install `nodemailer` and `@types/nodemailer`)
- Create: `src/lib/services/email.service.ts`
- Test: `src/lib/services/email.service.test.ts`

**Interfaces:**
- Consumes: `formatTime(time: string): string` from `@/lib/utils/date`
- Produces:
  - `isOnlineReceiptEligible(paymentMethod?: string | null): boolean`
  - `buildReceiptEmailContent(input: ReceiptTemplateInput): { subject: string; text: string; html: string }`
  - `sendPaymentReceiptEmail(bookingId: string): Promise<{ sent: boolean; skippedReason?: string }>`

- [ ] **Step 1: Install `nodemailer` and `@types/nodemailer`**

Run: `npm install nodemailer && npm install -D @types/nodemailer`
Expected: Packages added to `package.json` with 0 errors.

- [ ] **Step 2: Write the failing unit tests in `src/lib/services/email.service.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { isOnlineReceiptEligible, buildReceiptEmailContent } from "./email.service";

describe("email.service", () => {
  it("gates eligibility to Card and GCash QR only, rejecting Cash walk-in", () => {
    expect(isOnlineReceiptEligible("Credit Card")).toBe(true);
    expect(isOnlineReceiptEligible("Card")).toBe(true);
    expect(isOnlineReceiptEligible("GCash QR")).toBe(true);
    expect(isOnlineReceiptEligible("GCash QR (Ref: 1234567890)")).toBe(true);
    expect(isOnlineReceiptEligible("Cash walk in")).toBe(false);
    expect(isOnlineReceiptEligible("Cash (Paid at Counter)")).toBe(false);
    expect(isOnlineReceiptEligible(null)).toBe(false);
  });

  it("builds receipt email subject, text, and HTML with PHP amount and itinerary", () => {
    const out = buildReceiptEmailContent({
      bookingId: "abcd1234-5678-90ef",
      customerName: "Juan Dela Cruz",
      bookingDate: "2026-11-03",
      paymentMethod: "GCash QR",
      paymentReference: "1029384756102",
      totalPrice: 600,
      segments: [
        { courtName: "Court 1", startTime: "09:00", endTime: "10:00", price: 300 },
        { courtName: "Court 2", startTime: "10:00", endTime: "11:00", price: 300 },
      ],
    });

    expect(out.subject).toContain("#ABCD1234");
    expect(out.text).toContain("₱600.00");
    expect(out.text).toContain("09:00 AM – 10:00 AM");
    expect(out.html).toContain("Juan Dela Cruz");
    expect(out.html).toContain("1029384756102");
    expect(out.html).toContain("Court 1");
    expect(out.html).toContain("Court 2");
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run src/lib/services/email.service.test.ts`
Expected: FAIL (`Cannot find module './email.service'`)

- [ ] **Step 4: Implement `src/lib/services/email.service.ts`**

Implement `isOnlineReceiptEligible`, `buildReceiptEmailContent`, and `sendPaymentReceiptEmail(bookingId: string)` in `src/lib/services/email.service.ts`:
- `isOnlineReceiptEligible(paymentMethod)` returns `true` when `paymentMethod` (lowercased) contains `"card"`, `"stripe"`, `"gcash"`, or `"qr"`, and `false` otherwise.
- `sendPaymentReceiptEmail(bookingId)` queries `bookings` (plus sibling rows if `payment_reference` starts with `REF-`) and `profiles` via `createAdminClient()` (falling back to `createClient()`), verifies `isOnlineReceiptEligible(booking.payment_method)`, checks `process.env.GMAIL_USER` and `process.env.GMAIL_APP_PASSWORD`, and sends via `nodemailer.createTransport({ service: "gmail", auth: { user, pass } })` wrapped in `try/catch` so failures log a warning and return `{ sent: false, skippedReason }`.

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run`
Expected: PASS (all test files green)

---

### Task 2: Wire Receipt Trigger into Stripe Webhook & Admin "Mark as Paid"

**Files:**
- Modify: `src/lib/services/payment.service.ts`
- Modify: `src/app/admin/bookings/actions.ts`

**Interfaces:**
- Consumes: `sendPaymentReceiptEmail(bookingId: string)` from `@/lib/services/email.service`
- Produces: Updated `markPaymentSucceeded` and `markPaymentPaidInCash` in `src/lib/services/payment.service.ts`, and unified `markBookingPaidInCashAction` in `src/app/admin/bookings/actions.ts`.

- [ ] **Step 1: Call `sendPaymentReceiptEmail` in `src/lib/services/payment.service.ts`**

- In `markPaymentSucceeded(checkoutSessionId, paymentIntentId)`: after updating `bookings` to `payment_status: "succeeded"`, call `await sendPaymentReceiptEmail(payment.booking_id);`.
- In `markPaymentPaidInCash(paymentId, bookingId)`: after updating `bookings` and `payments` to `"succeeded"`, call `await sendPaymentReceiptEmail(targetBookingId);` (which automatically checks `isOnlineReceiptEligible` so GCash QR sends an email and Cash walk-in is skipped).

- [ ] **Step 2: Unify `markBookingPaidInCashAction` in `src/app/admin/bookings/actions.ts`**

- Delegate `markBookingPaidInCashAction(bookingId: string)` to `markPaymentPaidInCash(bookingId, bookingId)` from `@/lib/services/payment.service` so marking a GCash QR booking paid from `/admin/bookings` preserves `payment_method` and sends the receipt email identically to `/admin/payments`.

- [ ] **Step 3: Verify TypeScript and unit tests**

Run: `npx tsc --noEmit && npx vitest run`
Expected: 0 TypeScript errors and all unit tests passing.

