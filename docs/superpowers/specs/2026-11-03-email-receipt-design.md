# Email Payment Receipt Design

## Intent & Why
Players who pay online via **Card (Stripe)** or **GCash QR** need a payment receipt delivered to their Gmail inbox once their payment is confirmed, giving them verifiable proof of payment to present at the Paddlix front desk without needing to log back into the web app.

## Goals, Non-Goals & Anti-Goals
- **Goals**:
  - Send a clean HTML + plain-text receipt email to the customer's email address when:
    1. A **Card** payment succeeds via Stripe (`markPaymentSucceeded` in `src/lib/services/payment.service.ts`).
    2. An admin clicks **Mark as Paid** on a **GCash QR** booking in `/admin/bookings` (`src/app/admin/bookings/actions.ts`) or `/admin/payments` (`markPaymentPaidInCash` in `src/lib/services/payment.service.ts`).
  - Include court itinerary (including multi-court / court-jump segments linked by `payment_reference`), date, 12-hour time slot, payment method, reference ID, and total paid in Philippine Pesos (`₱`).
- **Non-Goals**:
  - Sending receipts for **Cash walk-in** bookings.
  - Sending an email before an admin verifies a GCash QR transfer.
- **Anti-Goals**:
  - Blocking or failing a payment/admin action if SMTP credentials are not configured yet or if the email server has a transient error (email sending must fail gracefully and log a warning).

## Constraints
- Uses `nodemailer` with Gmail SMTP (`GMAIL_USER` and `GMAIL_APP_PASSWORD` environment variables in `.env.local`).
- If `GMAIL_USER` or `GMAIL_APP_PASSWORD` is missing, log a clear warning and skip sending without throwing an error.

## Approaches Considered
1. **Approach 1: Gmail SMTP with App Password via `nodemailer` (Chosen)**
   - *Pros*: Free up to 500 emails/day; delivers to any customer Gmail address immediately without purchasing or configuring a custom domain.
   - *Tradeoffs*: Adds `nodemailer` dependency and requires a 16-character Google App Password in `.env.local`.
2. **Approach 2: Resend REST API via `fetch`**
   - *Pros*: Zero npm dependencies.
   - *Tradeoffs*: Resend blocks sending to arbitrary customer Gmail addresses on the free tier unless a custom DNS domain is purchased and verified.

## Decided Design
- **New service**: `src/lib/services/email.service.ts` exporting `sendPaymentReceiptEmail(bookingId: string)`.
- **Data resolution (builder call)**: `sendPaymentReceiptEmail` looks up the booking (and any sibling segments sharing `payment_reference`), resolves the customer's name and email from `profiles` (falling back to auth user if needed), checks that the payment method is **Card** or **GCash QR** (skipping Cash walk-ins), and sends the formatted Paddlix receipt email.
- **Trigger points**:
  1. `markPaymentSucceeded` in `src/lib/services/payment.service.ts` (for Stripe Card payments).
  2. `markPaymentPaidInCash` in `src/lib/services/payment.service.ts` and `markBookingPaidInCashAction` in `src/app/admin/bookings/actions.ts` (unified so both admin "Mark as Paid" buttons call `markPaymentPaidInCash`, which triggers `sendPaymentReceiptEmail` when the method is GCash QR or Card).

