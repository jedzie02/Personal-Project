# Design Doc: Multi-Hour Booking with Smart Court Jumping

**Date:** 2026-11-02  
**Status:** Pending Approval  
**Author:** Pair programming session (Antigravity + Jedrik)  

---

## 1. Intent & The Why

Today, the public booking grid only permits players to reserve a single 1-hour slot at a time. In sports facilities (pickleball, tennis, badminton), players routinely play 2 to 4 consecutive hours (doubles matches, mini-tournaments, training). If a player's starting court is booked in a later hour, players are often willing to "jump courts" to keep playing rather than abandoning their session.

This feature enables players to select **1 to 4 hours** in a single reservation session directly from the booking modal, automatically finding and assigning the next open court if their initial court is reserved in subsequent hours.

---

## 2. Goals, Non-Goals, and Anti-Goals

### Goals
- **Duration Selection:** Allow players to choose **1, 2, 3, or 4 hours** starting from any clicked slot.
- **Smart Court Allocation:**
  - Prioritize keeping the player on the **same court** for all selected hours whenever available.
  - If the initial court is booked in hour 2, 3, or 4, automatically assign the next available active court for that hour.
- **Clear Itinerary Display:** The booking modal and confirmation page clearly show the court schedule (e.g., `Hour 1: Court 1 (9–10 AM) • Hour 2: Court 2 (10–11 AM)`).
- **Single Checkout / Receipt:** Single total price calculation (`₱300/hr` × hours, e.g. 2 hrs = ₱600) and single GCash / Cash walk-in confirmation.
- **Respect Operating Hours:** Disallow selecting durations that would extend past the venue closing time (11:00 PM).

### Non-Goals
- Cart for disconnected or non-consecutive times (e.g. 9 AM and 5 PM on the same day).
- Player manual re-ordering of courts (the system automatically assigns the next available court in natural order: Court 1 -> Court 2 -> Court 3 -> Court 4).

### Anti-Goals
- Do not modify or migrate the database schema (no new tables).
- Do not break existing single-hour bookings or the admin booking workflow.

---

## 3. Constraints

- **Operating Hours:** Venue operates from 9:00 AM to 11:00 PM daily. A booking starting at 9:00 PM can only select up to 2 hours (finishing at 11:00 PM).
- **Zero Schema Changes:** Uses existing `bookings` table columns. If courts jump, segments are created as linked booking records sharing customer, date, and payment reference.
- **Ponytail Full Mode:** Smallest complete implementation that satisfies all requirements cleanly.
- **Verification:** `npx tsc --noEmit` and `npm run test` must pass.

---

## 4. Approaches Considered

### Approach A: Segmented Booking Rows with Shared Reference (Picked)
- Same-court multi-hour bookings are saved as 1 booking record with `start_time` and `end_time` covering the range.
- Court-jumping sessions are saved as connected booking records for each continuous court segment, tied together under the user profile and checkout reference.
- **Pros:** 100% compatible with existing `bookings` schema, admin schedule timeline, and payment ledger without migrations or regressions.
- **Cons:** None significant.

### Approach B: Parent-Child Booking Schema
- Create `parent_bookings` and `booking_slots` tables.
- **Trade-offs:** Requires extensive schema migration and rewrites across 6 backend services with high risk of regressions. Declined.

---

## 5. System Specification

### A. Auto-Jump Court Resolution Algorithm
Given `initialCourtId`, `startHour` (e.g. `"09:00"`), `durationHours` (1–4), and the date's grid data:
For each hour `h` from `0` to `durationHours - 1`:
1. Calculate slot start time: `timeToMinutes(startHour) + h * 60`.
2. Check if the initial court is free at that hour.
   - If **yes**: assign `initialCourtId`.
   - If **no**: find the first active court that is available (`status === 'available'`) at that hour.
   - If **no court at all is available**: mark this duration as **Unavailable** (disable the duration button in the modal).
3. If the slot exceeds closing time (`"23:00"` / 11:00 PM): disable that duration option.

### B. Booking Modal UI (`src/components/booking/BookingGrid.tsx`)
- In the slot preview modal, render a **Duration** segment control:
  - Buttons: `1 hr`, `2 hrs`, `3 hrs`, `4 hrs`.
  - For each duration button: show price and disabled state if venue is closed or no courts are available.
- When duration > 1 hr:
  - If staying on same court: show total time (e.g. `9:00 AM – 11:00 AM (2 hrs) on Court 1`).
  - If jumping courts: render an **Itinerary Box**:
    - `Hour 1 (9:00 AM – 10:00 AM): Court 1`
    - `Hour 2 (10:00 AM – 11:00 AM): Court 2 (Court switch)`
  - Total Price: `₱{durationHours * hourlyRate}`.
- Passing data to `/confirm-booking`:
  - Pass segments encoded in query params or itinerary string (e.g. `segments=court1:09:00:10:00,court2:10:00:11:00`).

### C. Confirmation Page (`src/app/confirm-booking/`)
- Display the reservation breakdown with the full itinerary:
  - If single court: standard Court Name and Time Slot.
  - If multi-court: Court Itinerary listing each hour and court switch.
  - Total Fee updated accordingly.
- Submission action (`submitConfirmBooking`):
  - Creates the booking record(s) in a single atomic flow and redirects to `/book/confirmation`.

### D. Booking Confirmation Page (`src/app/book/confirmation/page.tsx`)
- Displays the match schedule and court itinerary on the receipt.
- GCash payment card displays the combined total amount.

---

## 6. What's Left to the Builder
- Implementing the resolution helper function (`resolveContinuousSlots`).
- Wiring the duration picker buttons into `BookingGrid.tsx`.
- Updating `submitConfirmBooking` to insert multi-segment reservations.
- Visual polish of the itinerary badge and modal states.

