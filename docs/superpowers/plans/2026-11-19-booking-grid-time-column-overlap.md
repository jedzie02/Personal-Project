# Booking Grid Time Column Overlap Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prevent the desktop Time column label (`10:00 AM – 11:00 AM`) from overflowing its cell and overlapping into Court 1 when 5 or more courts are displayed in `BookingGrid`.

**Architecture:** In `BookingGrid.tsx`, when `isCompact` (`activeCourts.length >= 5`) is true, widen the desktop sticky Time column from `140px` to `150px` (`sm:[--time-col-w:150px]` and `sm:grid-cols-[150px_...]`), add `overflow-hidden` to the sticky time label container, and render the desktop compact time label with `text-xs` and `sm:mx-0.5` separator margin instead of `sm:text-sm`. Synchronize across `apps/dinksync`, root `src/`, and `apps/paddle-hub`.

**Tech Stack:** Next.js, React, Tailwind CSS, Vitest

**Spec:** `docs/superpowers/specs/2026-11-19-booking-grid-time-column-overlap-design.md`

## Global Constraints

- Keep `apps/dinksync`, root `src/`, and `apps/paddle-hub` synchronized.
- Maintain sticky left-column positioning and exact grid column alignment between the header row and time slot rows.
- Keep 1–4 court layouts (`170px` / `180px` with `sm:text-sm`) unchanged.

## Review Focus

- 5+ courts (`isCompact = true`): Time column uses `sm:[--time-col-w:150px]`, `overflow-hidden`, and `text-xs` time text without `sm:text-sm` overflow.
- 1–4 courts (`isCompact = false`): Time column retains `sm:[--time-col-w:170px]` (or `180px` for 1 court) and `text-xs sm:text-sm`.

---

### Task 1: Compact Time Column Typography & Width in `BookingGrid`

**Files:**
- Modify: `apps/dinksync/src/components/booking/BookingGrid.tsx:51-59,440-448,529-541`
- Modify: `src/components/booking/BookingGrid.tsx:51-59,440-448,529-541`
- Modify: `apps/paddle-hub/src/components/booking/BookingGrid.tsx:51-59,440-448,529-541`
- Test: `apps/dinksync/src/components/booking/BookingGrid.test.tsx`
- Test: `src/components/booking/BookingGrid.test.tsx`
- Test: `apps/paddle-hub/src/components/booking/BookingGrid.test.tsx`

**Interfaces:**
- Consumes: `BookingGridData` from `@/lib/services/booking-grid.service`
- Produces: `BookingGrid` default export component

- [ ] **Step 1: Update the compact 5+ courts test in `apps/dinksync/src/components/booking/BookingGrid.test.tsx`**

```tsx
        // Header and container must adapt for 7 courts with 150px compact time col & compact text-xs time labels
        expect(html).toContain("sm:[--time-col-w:150px]");
        expect(html).toContain("minmax(96px,1fr)");
        expect(html).toContain("repeat(7, minmax(96px, 1fr))");
        expect(html).toContain("Court 7");
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run apps/dinksync/src/components/booking/BookingGrid.test.tsx`
Expected: FAIL because `BookingGrid.tsx` still renders `sm:[--time-col-w:140px]`.

- [ ] **Step 3: Update `getGridColsClass`, `--time-col-w`, and sticky Time cell classes in `apps/dinksync/src/components/booking/BookingGrid.tsx` (and sync to `src/` and `apps/paddle-hub/`)**

In `getGridColsClass(count: number)`:
- For `count === 5`: `"grid-cols-[105px_repeat(5,minmax(96px,1fr))] sm:grid-cols-[150px_repeat(5,minmax(96px,1fr))]"`
- For `count === 6`: `"grid-cols-[105px_repeat(6,minmax(96px,1fr))] sm:grid-cols-[150px_repeat(6,minmax(96px,1fr))]"`
- For `count > 6`: `` `grid-cols-[105px_repeat(${count},minmax(96px,1fr))] sm:grid-cols-[150px_repeat(${count},minmax(96px,1fr))]` ``

In the grid wrapper (`isCompact` CSS variable):
- `isCompact ? "[--time-col-w:105px] sm:[--time-col-w:150px]" : "[--time-col-w:105px] sm:[--time-col-w:170px]"`

In the sticky Time label cell:
- Add `overflow-hidden` to the sticky container `div`.
- Use `cn("font-bold text-gray-900 dark:text-white whitespace-nowrap tabular-nums", isCompact ? "text-xs" : "text-xs sm:text-sm")` on both start and end time `span` elements.
- Use `cn("text-xs text-slate-400 sm:text-gray-900 dark:text-slate-500 sm:dark:text-white leading-none sm:leading-normal my-0.5 sm:my-0", isCompact ? "sm:mx-0.5" : "sm:mx-1")` on the separator `–` `span`.

Sync `BookingGrid.tsx` and `BookingGrid.test.tsx` to `src/components/booking/` and `apps/paddle-hub/src/components/booking/`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run apps/dinksync/src/components/booking/BookingGrid.test.tsx src/components/booking/BookingGrid.test.tsx apps/paddle-hub/src/components/booking/BookingGrid.test.tsx`
Expected: PASS (all tests green).

- [ ] **Step 5: Commit**

```bash
git add apps/dinksync/src/components/booking/BookingGrid.tsx apps/dinksync/src/components/booking/BookingGrid.test.tsx src/components/booking/BookingGrid.tsx src/components/booking/BookingGrid.test.tsx apps/paddle-hub/src/components/booking/BookingGrid.tsx apps/paddle-hub/src/components/booking/BookingGrid.test.tsx docs/superpowers/plans/2026-11-19-booking-grid-time-column-overlap.md
git commit -m "fix(booking-grid): prevent time column text overlap when 5+ courts are active"
```
