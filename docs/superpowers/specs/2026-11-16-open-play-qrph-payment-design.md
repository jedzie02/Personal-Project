# Design Doc: Open Play Dedicated QR Ph Payment Flow

**Date:** 2026-11-16  
**Topic:** Align Open Play Payment with Court Booking QR Ph Screen

---

## 1. Intent and Why
Currently, when a player joins an Open Play session from `/open-play`, they are routed directly to `/open-play/confirmation`, which displays a form requiring them to manually submit a 13-digit GCash reference number before their spot is confirmed.

In contrast, regular court booking provides a dedicated `/book/payment` screen featuring a QR Ph standee, "Save QR to photos", exact fee display, and a single **"I've Completed Payment"** button that immediately confirms the reservation.

This design aligns Open Play with the court booking flow by introducing a dedicated `/open-play/payment` page, removing the manual 13-digit reference form, and immediately confirming the Open Play spot upon payment completion.

---

## 2. Goals, Non-Goals, and Anti-Goals

### Goals
- **Dedicated Payment Route (`/open-play/payment`):** Provide a dedicated payment screen matching `/book/payment` with session details (Court, Date, Time), QR Ph code image, exact fee (e.g. `₱100.00`), and account details.
- **Save QR Feature:** Offer a "Save QR to photos" button allowing players to easily download the venue QR image to their phone or device.
- **Frictionless Spot Confirmation:** Replace manual 13-digit reference number entry with a single **"I've Completed Payment"** button.
- **Auto-Confirm on Tap:** Transition the open play entry status to `paid` and assign a reference code (e.g. `QRPH-XXXXXX`).
- **Clean Finalized Receipt (`/open-play/confirmation`):** Display verified ticket status ("Spot Reserved & Paid") with green checkmark, reference code, session details, and return button to `/open-play`.

### Non-Goals
- Automated bank API webhooks (verification remains via admin dashboard or counter presentation upon check-in).
- Modifying private court booking logic or changing existing database schemas.

### Anti-Goals
- Do not mix the pending payment UI and the finalized receipt on the same route.
- Do not require users to remember or type a 13-digit GCash reference string.

---

## 3. Approaches Considered

### Approach 1: Dedicated `/open-play/payment` page (Selected)
- **Flow:** `/open-play` -> `startOpenPlayJoin` creates hold -> redirects to `/open-play/payment?entryId=...`. Clicking "I've Completed Payment" updates entry status to `paid` and redirects to `/open-play/confirmation?entryId=...`.
- **Why Selected:** Matches `/book/payment` 1:1, keeps payment distinct from ticket receipt, and gives players a permanent link to their verified spot.

### Approach 2: In-place payment on `/open-play/confirmation`
- **Flow:** Keep `/open-play/confirmation` and swap the reference form with the QR Standee.
- **Why Rejected:** Conflates pending payment and receipt on the same URL, inconsistent with court booking.

---

## 4. Screen Flow & Architecture

### Screen 1: Open Play Directory (`/open-play`)
- Clicking **Join Session** calls `joinOpenPlayAction(sessionId, "QR Ph")`.
- `joinOpenPlayAction` calls `startOpenPlayJoin(sessionId, customerId, customerEmail, "QR Ph")`.
- Returns `{ url: "/open-play/payment?entryId=" + entryId }`.

### Screen 2: Dedicated Payment Page (`/open-play/payment`)
- **Route:** `src/app/open-play/payment/page.tsx`, `loading.tsx`, `OpenPlayPaymentClient.tsx`.
- **Features:**
  - Session details chip: Court name, date, time slot (`18:00 – 20:00`).
  - QR Code Standee with venue QR Ph image.
  - Exact Amount to Pay (`₱{price.toFixed(2)}`).
  - "Save QR to photos" button (fetches image and triggers download).
  - Primary CTA button: **"I've Completed Payment"** (with spinner state).
  - Cancel / Back to Open Play button.
- **Action:**
  - Invokes `completeOpenPlayPaymentAction(entryId)`.
  - Sets entry `status = 'paid'` and `stripe_checkout_session_id = 'QRPH-' + entryId.slice(0, 8).toUpperCase()`.
  - Redirects to `/open-play/confirmation?entryId=${entryId}`.

### Screen 3: Finalized Receipt (`/open-play/confirmation`)
- Removed `GCashPaymentCard` reference submission form.
- Shows green checkmark with "Spot Reserved & Paid".
- Details: Court, Date, Time, Payment Method (`QR Ph`), Ref #, Entry Fee.
- "Back to Open Play Sessions" button linking to `/open-play`.
