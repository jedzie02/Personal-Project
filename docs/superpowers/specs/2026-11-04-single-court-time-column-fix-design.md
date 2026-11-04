# Single-Court View Time Column Clipping Fix Design

## Intent & Why
When users select an individual court filter (e.g. "Court 1", "Court 2", etc.) in the booking grid on the landing page, the start time in the Time column (e.g., `09`, `10`, `11`) is clipped on the left edge (`:00 AM – 10:00 AM`). This happens because the single-court grid definition is hardcoded to `grid-cols-[105px_1fr]` on all breakpoints without a desktop `sm:` override. On desktop screens, the time label switches to horizontal (`sm:flex-row`), requiring ~160px width; inside a centered 105px column, the text overflows by ~28px to the left and gets clipped by the card container's `overflow-hidden` boundary.

## Goals, Non-Goals, & Anti-Goals
- **Goals:**
  - Update `src/components/booking/BookingGrid.tsx` so that when `activeCourts.length === 1`, the grid definition uses `grid-cols-[115px_1fr] sm:grid-cols-[180px_1fr]`.
  - Ensure the time text is completely visible with no clipping or overlapping into adjacent cells across all screen sizes.
  - Maintain the existing behavior and dimensions of the "All Courts" view.
- **Non-Goals:**
  - Changing slot booking logic, pricing calculations, or cart behaviors.
  - Redesigning the court status badges or schedule fetching.
- **Anti-Goals:**
  - Breaking mobile responsiveness or introducing unexpected horizontal scrolling in single-court view.

## Constraints
- Must work within Tailwind CSS v4 and React 19 Client Component conventions in `BookingGrid.tsx`.
- Must pass all existing automated tests and lint checks.

## Approaches Considered
1. **Responsive Grid Columns (`grid-cols-[115px_1fr] sm:grid-cols-[180px_1fr]`) (Selected):**
   - Provide 180px on desktop (matching the All Courts view) and 115px on mobile with stacked times.
   - *Tradeoffs:* 100% layout consistency between All Courts and single-court views with zero clipping.
2. **Content-Based Auto Width (`grid-cols-[auto_1fr]`):**
   - Let column auto-size with `max-content`.
   - *Tradeoffs:* Flexible, but width could jitter between dates or single/double digit hours.
3. **Stack Time Vertically on All Screen Sizes:**
   - Keep compact width by forcing vertical time display on desktop.
   - *Tradeoffs:* Inconsistent with the All Courts horizontal time format.

*Selection:* The user selected **Approach 1** for complete visual consistency and robust responsive layout.

## The Decided "How"
In `src/components/booking/BookingGrid.tsx`:
1. In the court table header (around line 402):
   - Replace `activeCourts.length === 1 ? "grid-cols-[105px_1fr]" : "..."` with:
     `activeCourts.length === 1 ? "grid-cols-[115px_1fr] sm:grid-cols-[180px_1fr]" : "grid-cols-[105px_repeat(4,minmax(140px,1fr))] sm:grid-cols-[170px_repeat(4,1fr)]"`
2. In the time table row container (around line 448):
   - Replace `activeCourts.length === 1 ? "grid-cols-[105px_1fr]" : "..."` with:
     `activeCourts.length === 1 ? "grid-cols-[115px_1fr] sm:grid-cols-[180px_1fr]" : "grid-cols-[105px_repeat(4,minmax(140px,1fr))] sm:grid-cols-[170px_repeat(4,1fr)]"`
3. Verify the sticky time label styling:
   - Ensure the padding and flex alignment (`px-2 sm:px-3 py-3 sm:py-4`) allow comfortable spacing for time display.

## What's Left to the Builder
- Verifying the change with a targeted test covering single-court view grid class generation and rendering.
- Checking that "All Courts" view remains completely unaffected.

