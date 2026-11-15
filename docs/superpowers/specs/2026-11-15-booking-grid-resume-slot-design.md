# Design Doc: Booking Grid "Resume" Slot for Unfinished Payments

**Date:** 2026-11-15  
**Topic:** Allow Players to Resume Unfinished QR Payments from the Booking Grid

---

## 1. Intent and Why
When a player initiates a court booking and lands on the dedicated QR payment screen (`/book/payment`), they might accidentally refresh, click back, or navigate to other pages before completing payment. Previously, the booking was prematurely marked `confirmed`, showing a disabled "Booked" lock cell on the schedule grid and confusing the user.

This feature ensures that unfinalized reservations remain in `pending` status. On the schedule grid (`BookingGrid`), the slot button for that specific reservation displays **"Resume"** (replacing "Available") exclusively for the logged-in player who owns it. Clicking **"Resume"** returns them directly to `/book/payment?bookingId=...` to finish their payment. Other visitors see the slot as "Held" so no one else can double-book it.

---

## 2. Goals, Non-Goals, and Anti-Goals

### Goals
- Keep reservations in `status: "pending"` until "I've Completed Payment" is clicked.
- On `BookingGrid`, if a slot has a pending reservation belonging to the logged-in user, render an active button reading **"Resume"**.
- Clicking "Resume" navigates directly to `/book/payment?bookingId={id}`.
- For other visitors, display the slot as "Held" (locked), preventing concurrent bookings.
- Automatically expire pending holds after 15 minutes if abandoned, returning the slot to "Available".
- On the customer's `/bookings` page, display a direct "Resume Payment" button pointing to `/book/payment?bookingId={id}` for any pending booking.

### Non-Goals
- Do not create background polling daemons or WebSocket subscriptions; rely on existing session auth and grid generation timestamps.

### Anti-Goals
- Avoid leaving the slot looking "Available" to everyone (which causes race conditions).
- Avoid showing "Booked" to the owner when payment was never finished.

---

## 3. Approaches Considered

### Approach A: Database `status: "pending"` with Client-Side User Match (Selected)
- The grid cell carries `booking: { id, customerId, status, createdAt }`. `BookingGrid` compares `cell.booking.customerId === currentUserId`. If matching and pending, displays "Resume". Other visitors see "Held".
- **Why Selected:** Fully synchronized with Supabase, prevents race conditions, and works across device refreshes.

### Approach B: Local Storage Draft Only
- Keep drafts in browser `localStorage`.
- **Trade-off:** Does not reserve the slot on the server, leaving the court vulnerable to being snatched by other users while the player scans their QR code.

---

## 4. Detailed Specification

### 1. Booking Creation (`src/app/confirm-booking/actions.ts`)
- In `submitConfirmBooking`, pass `markAsConfirmed: false` when creating the booking record.
- The booking is inserted with `status: "pending"` and `paymentStatus: "pending"`.

### 2. Grid Data Service (`src/lib/services/booking-grid.service.ts`)
- Include `customer_id`, `created_at`, and `status` in the booking query.
- For pending bookings:
  - Check if `created_at` is older than 15 minutes (`HOLD_DURATION_MINUTES = 15`). If expired, treat the slot as available.
  - If within 15 minutes, attach `booking: { id, customerId, status, startTime, endTime, durationHours, customerName }` to the grid cell.

### 3. Schedule Component (`src/components/booking/BookingGrid.tsx`)
- Detect current user ID from Supabase auth session (`userId`).
- In `CellContent`:
  - If cell has `booking?.status === "pending"`:
    - If `booking.customerId === currentUserId`: render amber/blue **"Resume"** button with a play/resume icon. Clicking it triggers `router.push('/book/payment?bookingId=' + booking.id)`.
    - If `booking.customerId !== currentUserId`: render locked cell marked **"Held"** (with lock icon).
  - If cell has `booking?.status === "confirmed"`: render standard locked "Booked" cell.

### 4. Payment Completion Action (`src/app/book/payment/actions.ts`)
- When `completePaymentAction(bookingId)` is called:
  - Update `status: "confirmed"` and `payment_reference: "QRPH-..."`.
  - Revalidate paths (`/`, `/book/payment`, `/book/confirmation`, `/bookings`).

### 5. My Bookings Page (`src/app/bookings/page.tsx`)
- For bookings where `status === "pending"`, the primary button displays **"Resume Payment"** and links to `/book/payment?bookingId={id}` instead of `/book/confirmation`.
