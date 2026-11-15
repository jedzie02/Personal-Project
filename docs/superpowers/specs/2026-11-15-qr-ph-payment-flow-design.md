# Design Doc: QR Ph Dedicated Payment Flow

**Date:** 2026-11-15  
**Topic:** Streamline Court Booking Payment with Dedicated QR Ph Screen

---

## 1. Intent and Why
Currently, court checkout at `/confirm-booking` offers both Card and GCash options, and confirming sends the user directly to `/book/confirmation`, where a reference number entry form and QR standee are embedded. 

To improve the mobile payment experience for players in the Philippines, the payment step is being separated into its own dedicated screen. The user experience will be simplified by removing card selection from the interface, displaying a direct action button (**[QR icon] ₱300 with QR Ph**), presenting the QR Ph code on its own page with a "Save QR to photos" feature, and replacing manual reference number entry with a single **"I've Completed Payment"** button that navigates to the confirmation page.

---

## 2. Goals, Non-Goals, and Anti-Goals

### Goals
- **Single Payment Path in UI:** Hide the credit card choice in the booking interface so QR Ph is the sole displayed payment method.
- **Clear Action Button:** Show `[QR icon] ₱{rate} with QR Ph` as the primary CTA on `/confirm-booking`.
- **Dedicated Payment Page (`/book/payment`):** Dedicated step showing the QR Ph image, the exact amount (e.g. `₱300.00`) directly below it, and a "Save QR to photos" action.
- **Frictionless Completion:** Remove the reference number input. Players advance by tapping **"I've Completed Payment"**.
- **Slot Reservation Protection:** Create the booking record when transitioning to the payment page so the court slot cannot be poached while the player is paying.

### Non-Goals
- Do not delete the underlying credit card / Stripe backend infrastructure or database columns; only hide the card option from the booking review UI.
- Do not implement automated bank webhook callbacks for static QR Ph (verification remains at counter check-in or via admin dashboard).

### Anti-Goals
- Avoid delaying slot reservation until after the user leaves their banking app (prevents double-booking / lost slots).
- Avoid modal or multi-step wizard overlays on `/confirm-booking`; keep each step on a distinct URL route for clean navigation and bookmarking.

---

## 3. Constraints
- Must work seamlessly on mobile browsers where users save the QR code and switch to GCash, Maya, or banking apps.
- Must support multi-slot court jump bookings (dynamically calculating the correct total rate).
- Must adhere to the existing Next.js App Router, Tailwind CSS, and dark mode conventions.

---

## 4. Approaches Considered

### Approach 1: Reserve slot first, route to `/book/payment?bookingId=...` (Selected)
- **Flow:** `/confirm-booking` creates booking record in `pending` state with method `QR Ph`, then redirects to `/book/payment?bookingId=...`. After the user scans/saves QR and clicks "I've Completed Payment", the booking payment status is updated to submitted/completed and redirected to `/book/confirmation?bookingId=...`.
- **Why Selected:** Protects the court slot while the user is actively paying in another app. Avoids race conditions where a second user books the court during the payment window.

### Approach 2: Delay reservation until "I've Completed Payment" is clicked
- **Flow:** Pass parameters to `/book/payment` without inserting a booking row. Insert the booking only when "I've Completed Payment" is clicked.
- **Trade-off:** Zero abandoned pending rows, but high risk of race condition where someone else reserves the slot while the user is in their banking app, leaving the player having sent money without an available court.

---

## 5. Detailed Design & Screen Flow

### Screen 1: Booking Review (`/confirm-booking`)
- **Payment Method Selection:** Remove the Credit Card toggle button. Present QR Ph as the standard payment method.
- **CTA Button:**
  - Displays: `<QrCodeIcon /> ₱{rate} with QR Ph` (e.g. `₱300 with QR Ph` or `₱600 with QR Ph` for 2 hours).
- **Behavior:**
  - Invokes `submitConfirmBooking` setting `paymentMethod: "QR Ph"`.
  - On success, redirects to `/book/payment?bookingId=${bookingId}` instead of `/book/confirmation`.

### Screen 2: Dedicated Payment Page (`/book/payment`)
- **Route:** `src/app/book/payment/page.tsx` + `loading.tsx`.
- **Components & Layout:**
  1. **Reservation Header / Chip:** Court name, date, and time slot.
  2. **QR Code Standee:**
     - Displays venue QR Ph image (loaded from settings / assets).
     - Clean high-contrast border and rounded styling.
  3. **Amount Display:**
     - Positioned directly below the QR code: `₱{rate.toFixed(2)}` in prominent bold font.
  4. **"Save QR to photos" Button:**
     - Positioned directly under the amount.
     - Downloads the QR image file (or uses the Web Share API on supported mobile browsers to save to photos).
  5. **"I've Completed Payment" Button:**
     - Prominent green/primary action button.
     - No reference number input field.
     - Calls server action `completePaymentAction(bookingId)` to mark payment state as submitted.
     - Redirects to `/book/confirmation?bookingId=${bookingId}`.
  6. **Cancel / Back Link:** Returns to `/confirm-booking` or schedule.

### Screen 3: Booking Confirmed (`/book/confirmation`)
- **Updates:**
  - Remove the GCash reference number submission card (`GCashPaymentCard` reference form).
  - Display a clear confirmation banner: "Booking Confirmed!" and "Paid via QR Ph / Present confirmation at counter upon arrival".
  - Retain reservation breakdown, schedule times, and navigation links ("Return to Home Schedule" & "View My Bookings").

---

## 6. What's Left to the Builder
- Implement `completePaymentAction` in server actions.
- Implement the "Save QR to photos" download trigger.
- Add unit/integration tests for the new page and updated button text.
- Verify dark mode contrast and mobile responsiveness across all three screens.
