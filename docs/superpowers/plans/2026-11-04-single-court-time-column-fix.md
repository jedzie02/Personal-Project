# Single-Court View Time Column Clipping Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the time column clipping bug in `BookingGrid.tsx` when filtering to an individual court by providing responsive desktop width (`sm:grid-cols-[180px_1fr]`).

**Architecture:** In `src/components/booking/BookingGrid.tsx`, update the CSS grid template classes for single-court view (`activeCourts.length === 1`) from `grid-cols-[105px_1fr]` to `grid-cols-[115px_1fr] sm:grid-cols-[180px_1fr]`, and add an optional `initialCourtFilter?: string` prop for testability and deep linking.

**Tech Stack:** React 19, Next.js 16, Tailwind CSS v4, Vitest, `react-dom/server`.

**Spec:** [`docs/superpowers/specs/2026-11-04-single-court-time-column-fix-design.md`](file:///c:/Users/jedrik/Projects/pickle-wb/docs/superpowers/specs/2026-11-04-single-court-time-column-fix-design.md)

## Global Constraints
- Preserve "All Courts" view layout, widths, and behavior untouched (`sm:grid-cols-[170px_repeat(4,1fr)]`).
- Do not modify cart calculation, payment flow, or booking data structures.
- All 10 existing test suites must pass without regression.

## Review Focus
- **Desktop Time Column Sizing:** When an individual court is selected (e.g. Court 1), the time column must have `sm:grid-cols-[180px_1fr]` so that `"09:00 AM – 10:00 AM"` has zero left-edge clipping or text overlap.
- **Mobile Stacked Behavior:** On mobile screens (`< sm`), time strings must stack vertically (`flex-col`) within the 115px column width without spilling outside the card.
- **Header Alignment:** Both the court table header (`Time`) and time rows (`09:00 AM – 10:00 AM`) must share identical grid column definitions (`grid-cols-[115px_1fr] sm:grid-cols-[180px_1fr]`).
- **All Courts Continuity:** When "All Courts" is active, grid template must remain `grid-cols-[105px_repeat(4,minmax(140px,1fr))] sm:grid-cols-[170px_repeat(4,1fr)]`.

---

### Task 1: Fix Single-Court Grid Column Definition in `BookingGrid.tsx`

**Files:**
- Modify: `src/components/booking/BookingGrid.tsx`
- Test: `src/components/booking/BookingGrid.test.tsx`

**Interfaces:**
- Consumes: `BookingGridData` from `@/lib/services/booking-grid.service`
- Produces: `<BookingGrid data={...} initialCourtFilter="court-1" />`

- [ ] **Step 1: Write failing test in `src/components/booking/BookingGrid.test.tsx`**

Write test verifying that when `initialCourtFilter` is `"court-1"`, the grid rows and headers render with `sm:grid-cols-[180px_1fr]` instead of `grid-cols-[105px_1fr]`:
```tsx
import { describe, it, expect, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import BookingGrid from "./BookingGrid";
import type { BookingGridData } from "@/lib/services/booking-grid.service";

vi.mock("next/navigation", () => ({
    useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/lib/supabase", () => ({
    supabase: {
        auth: {
            getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
            onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
        },
    },
}));

const mockGridData: BookingGridData = {
    date: "2026-11-04",
    isClosed: false,
    operatingHours: { open: "09:00", close: "11:00" },
    courts: [
        { id: "court-1", name: "Court 1", status: "Available", hourly_rate: 300 },
        { id: "court-2", name: "Court 2", status: "Available", hourly_rate: 300 },
    ],
    hours: ["09:00", "10:00"],
    grid: [
        [
            { courtId: "court-1", courtName: "Court 1", hour: "09:00", status: "available", isPeak: false },
            { courtId: "court-2", courtName: "Court 2", hour: "09:00", status: "available", isPeak: false },
        ],
        [
            { courtId: "court-1", courtName: "Court 1", hour: "10:00", status: "available", isPeak: false },
            { courtId: "court-2", courtName: "Court 2", hour: "10:00", status: "available", isPeak: false },
        ],
    ],
};

describe("BookingGrid single-court layout", () => {
    it("renders responsive sm:grid-cols-[180px_1fr] when filtering to an individual court", () => {
        const html = renderToStaticMarkup(
            <BookingGrid data={mockGridData} initialCourtFilter="court-1" />
        );

        // Header and rows must have the responsive single-court grid definition
        expect(html).toContain("sm:grid-cols-[180px_1fr]");
        expect(html).toContain("grid-cols-[115px_1fr]");
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- "src/components/booking/BookingGrid.test.tsx" --run`
Expected: FAIL (missing `sm:grid-cols-[180px_1fr]`).

- [ ] **Step 3: Update `src/components/booking/BookingGrid.tsx`**

1. Add optional `initialCourtFilter?: string` to component props:
   ```tsx
   export default function BookingGrid({
       data,
       initialSelectCourt,
       initialSelectHour,
       initialCourtFilter,
   }: {
       data: BookingGridData;
       initialSelectCourt?: string;
       initialSelectHour?: string;
       initialCourtFilter?: string;
   })
   ```
2. Initialize state:
   ```tsx
   const [mobileCourtFilter, setMobileCourtFilter] = useState<string>(initialCourtFilter || "all");
   ```
3. Update header grid class:
   ```tsx
   className={`grid ${activeCourts.length === 1 ? "grid-cols-[115px_1fr] sm:grid-cols-[180px_1fr]" : "grid-cols-[105px_repeat(4,minmax(140px,1fr))] sm:grid-cols-[170px_repeat(4,1fr)]"} border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900`}
   ```
4. Update time rows grid class:
   ```tsx
   className={`grid ${activeCourts.length === 1 ? "grid-cols-[115px_1fr] sm:grid-cols-[180px_1fr]" : "grid-cols-[105px_repeat(4,minmax(140px,1fr))] sm:grid-cols-[170px_repeat(4,1fr)]"} min-h-[58px]`}
   ```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- "src/components/booking/BookingGrid.test.tsx" --run`
Expected: PASS.

- [ ] **Step 5: Run full test suite and linter**

Run: `npm test -- --run`
Run: `npx eslint "src/components/booking/BookingGrid.tsx" "src/components/booking/BookingGrid.test.tsx"`
Expected: All tests pass, 0 lint errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/booking/BookingGrid.tsx src/components/booking/BookingGrid.test.tsx docs/superpowers/specs/2026-11-04-single-court-time-column-fix-design.md docs/superpowers/plans/2026-11-04-single-court-time-column-fix.md
git commit -m "fix(booking): prevent time text clipping in single court view with responsive column width"
```

