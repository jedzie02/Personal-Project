# Hide Passed Time Slots with Toggle in Booking Grid Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hide earlier passed time rows by default on the booking grid and provide a toggle button directly beneath the court headers to reveal or re-hide them.

**Architecture:** Add `showPassed` boolean state to `BookingGrid.tsx`, compute which hour rows are fully passed, render a toggle bar directly below the sticky column headers when passed hours exist, and filter the displayed hour rows based on `showPassed`.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS, Lucide icons, Vitest.

**Spec:** `docs/superpowers/specs/2026-11-15-hide-passed-time-slots-design.md`

## Global Constraints

- Position the toggle bar directly below the column headers (`Time`, `Court 1`...`Court 4`) and above the first time row.
- If 0 hours have passed, the toggle bar must not render.
- If all hours on the selected date have passed (past date), default to showing all rows.
- Retain all mobile responsive grid column definitions.

## Review Focus

1. **Clean collapse:** Passed rows must be omitted from rendering when `showPassed` is `false`.
2. **Toggle expansion:** Clicking "Show passed times" must reveal the passed rows, and the button changes to "Hide passed times".
3. **Toggle bar placement:** Must sit directly below the court header row and span the grid width.
4. **Future dates / zero passed:** On future dates where no slots are passed, the toggle bar must not appear.
5. **No impact on cart:** Toggling passed hours must not affect any active slot selection in the cart bar.

---

### Task 1: Implement `showPassed` toggle bar and row filtering in `BookingGrid.tsx`

**Files:**
- Modify: `src/components/booking/BookingGrid.tsx`
- Test: `src/components/booking/BookingGrid.test.tsx`

**Interfaces:**
- Consumes: `hours`, `grid` from `data: BookingGridData`
- Produces: Collapsed view by default with toggle bar below court headers.

- [x] **Step 1: Write the failing test in `src/components/booking/BookingGrid.test.tsx`**

```tsx
// Add test verifying that passed rows are hidden by default and toggle bar appears
it("hides passed hours by default and renders 'Show passed times' toggle bar below court headers", () => {
    // Assert passed rows are not rendered and toggle button is rendered
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/booking/BookingGrid.test.tsx`  
Expected: FAIL.

- [x] **Step 3: Implement toggle bar and filtering in `BookingGrid.tsx`**

1. Calculate passed hours:
   - Identify index of passed hours: `const isRowPassed = (hourIdx: number) => grid[hourIdx]?.every((c) => c.status === "passed");`
   - Calculate `passedHoursCount`.
2. State:
   - `const [showPassed, setShowPassed] = useState(false);`
3. Render toggle bar directly below the court header:
   - When `passedHoursCount > 0` and not all hours are passed:
     - Render full-width bar with clock icon, text `{passedHoursCount} earlier hours passed`, and button to toggle `showPassed`.
4. Filter rendered rows:
   - When `!showPassed`, skip rows where `isRowPassed(hourIdx)` is true.

- [x] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/booking/BookingGrid.test.tsx`  
Expected: PASS.

---

### Task 2: Full test suite verification

- [x] **Step 1: Run complete test suite**

Run: `npm test -- --run`  
Expected: All tests pass (0 failures).
