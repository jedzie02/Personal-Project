# Design Spec: Multi-Court & Multi-Slot Booking ("Shopping Cart" Selection)

**Date**: 2026-11-02  
**Status**: Proposed  
**Author**: Antigravity & User  

---

## 1. Intent & Context
Players, organizers, and coaches frequently need to book **more than one court at the same time** (e.g. Court 1 and Court 2 simultaneously from 9:00 AM to 10:00 AM for group play, drills, or mini-tournaments), or select multiple distinct time slots across courts in a single reservation.

Currently, clicking a slot in `BookingGrid.tsx` immediately opens a single-court modal. We need to transition the grid into a **direct multi-selection model** with an intuitive floating cart summary bar.

---

## 2. Goals & Non-Goals

### Goals
- **Multi-Slot Selection**: Clicking an available cell in the grid toggles selection (select/unselect).
- **Parallel Courts**: Allow booking multiple courts for the exact same hour (e.g. Court 1 + Court 2 at 09:00–10:00).
- **Staggered / Multi-Hour**: Allow booking continuous or disjoint slots across any combination of courts and hours for the selected date.
- **Visual Feedback**: Selected cells turn distinctly active (blue highlight, checkmark, rate badge).
- **Floating Cart Bar**: A sleek bottom sticky bar appears whenever `selectedSlots.length > 0`, displaying slot count, court summaries, total amount at **₱300/hr**, a "Clear" button, and a "Review & Book" action button.
- **Seamless Confirmation**: Passes the selected slots directly into the existing multi-segment confirmation and server action pipeline (`submitConfirmBooking`), generating discrete booking records that block each court schedule under a shared payment reference.

### Non-Goals
- Multi-day cart (selecting slots across different calendar dates in one checkout; date selector remains the top-level filter).
- Split bill / multi-payer checkout (one authenticated user pays for the entire reserved block).

---

## 3. Approaches Considered

### Approach 1: Multi-Select Grid with Bottom Cart Bar *(Selected)*
- **Description**: Clicking any available green slot highlights it and adds it to the selection set. A sticky summary bar at the bottom provides a live running total and checkout CTA.
- **Why Chosen**: Standard, intuitive UX (like seat picking). Solves parallel court booking, multi-hour booking, and multi-court jumping in a unified, visual way without modal popups interrupting every click.

### Approach 2: "Add Another Court" Inside the Current Modal *(Rejected)*
- **Description**: Keep the single-slot popup modal, but add checkboxes to add other courts for that specific hour.
- **Why Rejected**: Restricts parallel booking to the same hour only, doesn't visualize multiple selections across the grid, and introduces modal clutter.

---

## 4. User Experience & Flow

### 4.1 Grid Selection
1. Player navigates to the schedule grid on `/`.
2. Clicking **Court 1 at 9:00 AM – 10:00 AM** highlights it as Selected.
3. Clicking **Court 2 at 9:00 AM – 10:00 AM** highlights it as Selected.
4. Clicking an already-selected slot unselects it.
5. If an unauthenticated user clicks, they can still toggle slots; upon clicking "Proceed to Book", their pending selection is saved to `sessionStorage` and they are guided to log in.

### 4.2 Floating Cart Summary Bar
When `selectedSlots.length > 0`, a responsive sticky drawer floats at the bottom of the viewport:
- **Left**:
  - Badge with total slots: `2 Slots Selected`
  - Concise itemized pill list: `Court 1 (9–10 AM)`, `Court 2 (9–10 AM)`
- **Right**:
  - Total Fee: `₱600.00` (at ₱300/hour per court)
  - `Clear` button (resets selection)
  - `Book Selected (2) →` primary action button

### 4.3 Confirmation & Checkout (`/confirm-booking`)
- Displays all selected court slots with their respective time windows and court names.
- Shows total hours, rate breakdown, payment method (GCash QR, Credit Card, Cash walk-in).
- Invokes `submitConfirmBooking({ segments, ... })`.
- Shared payment reference (e.g. `REF-XXXX`) links all booked courts together.

### 4.4 Confirmation Receipt (`/book/confirmation`)
- Renders the full multi-court itinerary breakdown.
- GCash QR card reflects the combined total amount.

---

## 5. Technical Design

### 5.1 Grid State (`src/components/booking/BookingGrid.tsx`)
```typescript
interface SelectedGridSlot {
  courtId: string;
  courtName: string;
  hour: string;       // "09:00"
  endHour: string;    // "10:00"
  hourlyRate: number; // 300
}

const [selectedSlots, setSelectedSlots] = useState<SelectedGridSlot[]>([]);
```

### 5.2 Toggle Handler
- If slot `(courtId, hour)` is in `selectedSlots`, filter it out.
- If not, append it with its court rate (₱300).
- Max slot cap: e.g. up to 8 slots per single booking to prevent spam.

### 5.3 Checkout Transition
On clicking "Book Selected":
- Converts `selectedSlots` into sorted `BookingSegment[]`.
- Navigates to `/confirm-booking?date=...&rate=...&segments=...`.
- If not logged in, persists `paddlix_pending_cart` in `sessionStorage` and routes to login/signup.

### 5.4 Backend Handling (`src/app/confirm-booking/actions.ts`)
- Existing `submitConfirmBooking` already supports `segments: BookingSegment[]`.
- Groups contiguous hours on the same court into single booking spans, while creating separate records for parallel or jumping courts sharing a single transaction reference.
- All selected courts are blocked in Supabase immediately.

---

## 6. Verification Plan
- **Unit Tests**:
  - Verify cart slot grouping and segment mapping for parallel courts.
  - Test pricing calculation for multi-court same-hour reservations.
- **Type Safety**: `npx tsc --noEmit` must pass with 0 errors.
- **Regression**: Existing `npm run test` (18 tests) must pass.

