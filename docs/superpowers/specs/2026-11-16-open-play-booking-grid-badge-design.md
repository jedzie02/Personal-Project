# Design: Open Play Badge on Booking Grid (Approach 1)

- **Date:** 2026-11-16
- **Scope:** Small change
- **Target Route:** `/book` (BookingGrid component & service)

---

## 1. Intent & Why
When an admin schedules an Open Play session from the admin panel, the backend reserves the court using a hold booking (`payment_method = "Open Play hold"`). Currently, the public booking grid treats this identically to a private booking and displays generic "BOOKED" with a lock icon. 

Displaying a distinct, interactive **"OPEN PLAY"** badge informs players that the court is hosting a community game and invites them to tap the slot to jump directly to the Open Play registration section on the landing page (`/#open-play`).

---

## 2. Goals, Non-Goals, & Anti-Goals

### Goals
- Detect when a reserved slot on the booking grid is held for an Open Play session.
- Render an emerald-themed interactive slot showing a `Users` icon, **"OPEN PLAY"**, and the session rate (e.g. `₱150/player` or `Open Play`).
- Clicking or tapping the slot redirects the user to `/#open-play` where they can register for the session.
- Keep the slot unavailable for standard full-court private bookings.

### Non-Goals
- Changing the admin schedule page or admin open-play creation logic.
- In-place modal registration inside the booking grid (redirecting to `/#open-play` reuses the existing, tested checkout flow).

### Anti-Goals
- Breaking private court booking selection or existing slot states (`available`, `booked`, `fulfilled`, `passed`, `maintenance`).
- Allowing players to add Open Play slots to their private booking cart.

---

## 3. Constraints
- Strict adherence to Ponytail mode (full): minimal code diffs, zero unnecessary dependencies, clean TypeScript types.
- Maintain existing test coverage (`npm test -- --run`).

---

## 4. Approaches Considered
1. **Approach 1: Clickable Open Play Slot (Selected by User)**
   - Display an emerald-styled interactive slot with a `Users` icon, "OPEN PLAY", and price indicator.
   - Clicking routes directly to `/#open-play`.
   - *Why chosen:* High engagement, converts blocked slots into open play sign-ups with minimal new code.
2. **Approach 2: View-Only Open Play Badge**
   - Static non-clickable badge informing users of Open Play.
   - *Rejected:* Acts as a dead end for players who want to join.

---

## 5. Technical Specification

### A. Data Layer (`src/lib/services/booking-grid.service.ts`)
- Include `payment_method` in the `bookings` query select.
- Fetch active `open_play_sessions` for the date (to extract `price_per_player` and `session_id`).
- When a booking covers an hour and has `payment_method === OPEN_PLAY_HOLD_LABEL`:
  - Return cell with `status: "open_play"`.
  - Attach `openPlay: { sessionId: string; pricePerPlayer: number }` (or default rate if session record not found).

### B. UI Component (`src/components/booking/BookingGrid.tsx`)
- In `GridSlotCell`, handle `effectiveStatus === "open_play"`:
  - Render an emerald-accented button (`bg-emerald-950/40 border-emerald-800/80 hover:bg-emerald-900/50 text-emerald-400`).
  - Content: `Users` icon, bold `"OPEN PLAY"` label, and small price tag (e.g., `₱{price}/player`).
  - `onClick`: calls `router.push("/#open-play")`.
- Exclude `open_play` cells from normal cart multi-select.

### C. Type Definitions
- Add `"open_play"` to `GridCell['status']` union.

---

## 6. What's Left to the Builder
- Exact responsive padding / font sizing to match `BookingGrid` cell rhythm.
- Unit tests updating `BookingGrid.test.tsx` and `booking-grid.service.test.ts`.
