# Admin Schedule: Multi-Hour Booking Unified Row Span Design

## Intent & The Why
In the administrative schedule timeline (`/admin/schedule`), the grid is divided into 1-hour rows (09:00 AM – 11:00 PM). Previously, when a customer or staff booked a multi-hour court reservation (e.g., 6:00 PM – 9:00 PM for 3 hours), the schedule evaluated each 1-hour row independently, rendering duplicate identical booking cards in every single hour cell.

This design consolidates multi-hour court bookings into a **single continuous visual block** that spans across the booked hours, eliminating redundant cards while preserving timeline accuracy and full drawer interactions.

---

## Goals
1. **Unified Multi-Hour Cards**: When a court reservation spans 2, 3, or 4 hours, it renders as a single continuous block spanning the full time window.
2. **Open Play Session Parity**: Venue-hosted Open Play sessions (which reserve a court for a 2-to-4-hour block) also render as a unified continuous block.
3. **No Duplicate Information**: Player name, status badge, time window, and total price appear once per reservation rather than repeating every hour.
4. **Preserved Interactivity**: Clicking the unified card opens the reservation details drawer (`activeBookingSlot`) exactly as before.
5. **Timeline Integrity**: Unbooked hours and other courts remain properly aligned with the sticky time axis.

---

## Non-Goals & Anti-Goals
- **Non-Goals**:
  - Modifying the database schema or booking service logic.
  - Altering the tabular list view in `/admin/bookings`.
  - Changing how booking durations or rates are calculated.
- **Anti-Goals**:
  - Desynchronizing time labels from court availability.
  - Disjointed card seams or flickering hover states.

---

## Approaches Considered
- **Approach 1 (Selected): Unified Master CSS Grid**  
  Refactor the schedule body from nested row-by-row wrappers into a single unified CSS grid where time slots define row tracks, and courts define columns. Available slots occupy `grid-row: span 1`, while multi-hour bookings occupy `grid-row: [hour-start] / span [durationHours]`.  
  *Why selected*: Native browser grid mechanics, true single DOM node per booking, seamless hover/click behavior, and zero pixel-math fragility.
- **Approach 2: Visual Segment Suppression (Rejected)**  
  Keep row-by-row wrappers and suppress text in subsequent hours while stripping borders. Rejected because it leaves separate DOM elements that feel disconnected on hover and click.
- **Approach 3: Absolute Overlay Time-Blocks (Rejected)**  
  Render bookings as absolutely positioned overlays on top of a static grid canvas. Rejected because responsive text scaling and dynamic padding can lead to vertical alignment drift.

---

## Detailed Implementation

### 1. Data Processing
Before rendering the grid, group or index bookings per court:
- For each court and each operating time slot:
  - If a booking **starts** at this hour (`b.startTime.slice(0, 5) === slot.start`):
    - Calculate duration: `durationHours = (endHour - startHour)`.
    - Mark this slot as the **primary booking cell** with `span: durationHours`.
  - If an hour falls **within** an active booking that started earlier:
    - Omit rendering a cell for this hour on this court, since the primary cell’s CSS `grid-row: span N` covers the track.
  - If no booking occupies this hour:
    - Render the normal Available / Maintenance / Inactive / Passed cell with `grid-row: span 1`.

### 2. CSS Grid Structure
The schedule matrix container uses CSS Grid:
```tsx
<div
  className="grid"
  style={{
    gridTemplateColumns: visibleCourts.length === 1
      ? "165px 1fr"
      : `165px repeat(${visibleCourts.length}, minmax(170px, 1fr))`,
    gridTemplateRows: `repeat(${timeSlots.length}, minmax(58px, auto))`,
  }}
>
```
- Sticky time column labels occupy column 1, row `i + 1`.
- Court cells occupy column `courtIndex + 2`, row `startSlotIndex + 1 / span durationHours`.

### 3. Visual Styling
- Unified cards carry:
  - Customer name (bold, truncate).
  - Status badge (Paid / Pending).
  - Time span label (e.g., `6:00 PM – 9:00 PM (3 hrs)`).
  - Total price in Philippine Pesos (`₱900`).
  - Subtle vertical padding and flex layout adapting gracefully whether 1, 2, 3, or 4 hours high.

---

## Verification Plan
1. **Unit Tests**:
   - Verify timeline renders multi-hour bookings with correct grid-row span.
   - Verify unbooked hours and adjacent courts remain interactive.
   - Run existing suite (`npm test -- --run`).
2. **Type Check**:
   - Run `npx tsc --noEmit` with zero errors.
3. **Impeccable Design Audit**:
   - Run Impeccable detector script to ensure contrast, type scale, and accessibility compliance.
