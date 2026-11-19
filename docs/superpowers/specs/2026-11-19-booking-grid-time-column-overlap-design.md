# Booking Grid Time Column Overlap Fix (5+ Courts) — Design Doc

**Date:** 2026-11-19  
**Size:** Small change  
**Target Files:** `apps/dinksync/src/components/booking/BookingGrid.tsx`, `src/components/booking/BookingGrid.tsx`, `apps/paddle-hub/src/components/booking/BookingGrid.tsx`

## 1. Intent & Why
When 5 or more courts are active (`isCompact = true`), the desktop Time column shrinks to `140px` (`sm:[--time-col-w:140px]`), while the time range (`10:00 AM – 11:00 AM`) still renders on a single horizontal line at `sm:text-sm` bold (~`170px` wide). Because the text is wider than the `140px` sticky column and lacks `overflow-hidden`, it overflows the column boundary and overlaps into the first court column.

## 2. Goals, Non-Goals, Anti-Goals
- **Goals:** Prevent the single-line time label from overflowing or overlapping with Court 1 when 5+ courts are displayed, while keeping rows compact.
- **Non-Goals:** Changing how time slots or operating hours are generated or how 1–4 courts render.
- **Anti-Goals:** Do not allow text to bleed across sticky column borders or misalign the header and row columns.

## 3. Constraints
- Must keep `apps/dinksync`, root `src/`, and `apps/paddle-hub` synchronized.
- Must maintain sticky left-column positioning and exact grid column alignment between the header row and time slot rows.

## 4. Approaches Considered
1. **Approach 1 (Selected): Compact Font (`text-xs`) + `150px` Time Column** — In compact mode (`isCompact`), render the desktop time label at `text-xs` (instead of `sm:text-sm`), widen the desktop compact Time column from `140px` to `150px` (`sm:[--time-col-w:150px]`), and add `overflow-hidden` to the sticky time cell. Keeps the single-line layout slim with clear padding and zero overlap.
2. **Approach 2: Stacked Two-Line Time Label (`flex-col`) in a `115px` Column** — Stack start and end times vertically on desktop in compact mode. Rejected because it increases vertical visual density on desktop rows.
3. **Approach 3: Full `170px` Time Column at All Court Counts** — Keep `--time-col-w` at `170px` regardless of court count. Rejected because it takes unnecessary horizontal space away from 5+ court columns.

## 5. Decision Details
- Update `getGridColsClass` for `count >= 5` to use `sm:grid-cols-[150px_repeat(...,minmax(96px,1fr))]`.
- Update the CSS variable container in `BookingGrid.tsx` when `isCompact` is true to `sm:[--time-col-w:150px]`.
- In the sticky Time cell (`BookingGrid.tsx`), add `overflow-hidden` and use `isCompact ? "text-xs" : "text-xs sm:text-sm"` on the start/end time spans and tighter gap (`sm:mx-0.5` when compact) so `10:00 AM – 11:00 AM` (~`128px` wide at `text-xs`) fits comfortably inside `150px`.

## 6. Left to the Builder
- Update and run unit tests in `BookingGrid.test.tsx` to verify compact time column classes and no regressions.
