# Live Hero & 1-Tap Prime Slot Strip Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the Paddlix landing page hero with a live open-slot counter, 4-player doubles cost split (`₱75/player/hr`), and 1-tap "Next Open Slots" cards that scroll down and auto-select the chosen slot in the booking grid cart.

**Architecture:** A pure utility (`src/lib/utils/quick-slots.ts`) scans `BookingGridData` to compute remaining open slots, per-player split pricing, and up to 3 upcoming available time blocks with contextual urgency badges (`Next Available`, `Prime Time`, `Only 1 Court Left!`). A client component (`src/components/booking/HeroQuickSlots.tsx`) renders the live status pill and quick-pick cards in the hero, dispatching a custom `paddlix:select-slot` browser event (or navigating with `?date=...&selectCourt=...&selectHour=...` when previewing tomorrow's schedule late at night) that `BookingGrid.tsx` consumes to highlight the slot and open the floating cart bar.

**Tech Stack:** Next.js 16 (App Router, Server & Client Components), TypeScript, Tailwind CSS, Vitest.

**Spec:** `docs/superpowers/specs/2026-11-03-live-hero-quick-slots-design.md`

## Global Constraints

- Follow `DESIGN.md` "Court Command" tokens: Matchpoint Blue (`#2563eb`), Court Turf Emerald (`#059669`), Caution Amber (`#f59e0b`), `tabular-nums` for rates and times, 12-hour AM/PM formatting (`06:00 PM – 07:00 PM`), and full light/dark theme parity.
- Keep `src/app/page.tsx` as a Server Component; only fetch tomorrow's grid as a fallback when `date === today` and `totalOpenSlots === 0`.
- Selecting an already-selected slot from the hero quick-pick strip must keep it selected (idempotent add) rather than toggling it off.
- Use relative imports inside files tested by Vitest (`src/lib/utils/quick-slots.ts`).

## Review Focus

1. **Null or completely passed/booked schedule (`gridData === null` or 0 available cells):** `extractQuickSlotsSummary` must return `totalOpenSlots: 0`, `slots: []`, `lowestHourlyRate: 300`, and `lowestSplitPerPlayer: 75` without throwing.
2. **Idempotent quick-slot tap:** Clicking the same quick-slot card twice in the hero must not deselect the slot in `BookingGrid.tsx`.
3. **Court-level Maintenance / Not Available override:** Courts with status `"Maintenance"` or `"Not Available"` must never be counted as open or offered in `QuickSlotCard[]`.
4. **Custom court hourly rates:** If a court has `hourly_rate: 400`, its `QuickSlotCard` must display `hourlyRate: 400` and `splitPerPlayer: 100`.
5. **Urgency badge priority:** When an hour between 5:00 PM and 9:00 PM has only 1 court open, `"Only 1 Court Left!"` (`rose`) must take precedence over `"Prime Time"` (`amber`).

---

### Task 1: Pure Quick-Slots & Availability Summary Utility

**Files:**
- Create: `src/lib/utils/quick-slots.ts`
- Test: `src/lib/utils/quick-slots.test.ts`

**Interfaces:**
- Consumes: `BookingGridData` from `../services/booking-grid.service`
- Produces:
  ```ts
  export interface QuickSlotCard {
      courtId: string;
      courtName: string;
      hour: string;
      endHour: string;
      timeLabel: string;
      hourlyRate: number;
      splitPerPlayer: number;
      openCourtsAtHour: number;
      badgeLabel: "Next Available" | "Prime Time" | "Only 1 Court Left!";
      badgeTone: "emerald" | "amber" | "rose";
      date: string;
  }

  export interface QuickSlotsSummary {
      date: string;
      totalOpenSlots: number;
      openCourtsCount: number;
      lowestHourlyRate: number;
      lowestSplitPerPlayer: number;
      slots: QuickSlotCard[];
  }

  export function extractQuickSlotsSummary(
      gridData: BookingGridData | null,
      maxCards?: number
  ): QuickSlotsSummary;
  ```

- [ ] **Step 1: Write the failing unit tests in `src/lib/utils/quick-slots.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { extractQuickSlotsSummary } from "./quick-slots";
import type { BookingGridData } from "../services/booking-grid.service";

function makeGridData(overrides?: Partial<BookingGridData>): BookingGridData {
    return {
        date: "2026-11-03",
        operatingOpen: "09:00",
        operatingClose: "23:00",
        courts: [
            { id: "c1", name: "Court 1", status: "Available", hourly_rate: 300 },
            { id: "c2", name: "Court 2", status: "Available", hourly_rate: 300 },
            { id: "c3", name: "Court 3", status: "Maintenance", hourly_rate: 300 },
            { id: "c4", name: "Court 4", status: "Available", hourly_rate: 400 },
        ],
        hours: ["16:00", "17:00", "18:00", "19:00"],
        grid: [
            // 16:00 -> 2 courts available (c1, c2) -> Next Available (emerald)
            [
                { courtId: "c1", courtName: "Court 1", hour: "16:00", status: "available", isPeak: false },
                { courtId: "c2", courtName: "Court 2", hour: "16:00", status: "available", isPeak: false },
                { courtId: "c3", courtName: "Court 3", hour: "16:00", status: "maintenance", isPeak: false },
                { courtId: "c4", courtName: "Court 4", hour: "16:00", status: "booked", isPeak: false },
            ],
            // 17:00 -> 2 courts available (c2, c4) -> Prime Time (amber)
            [
                { courtId: "c1", courtName: "Court 1", hour: "17:00", status: "booked", isPeak: false },
                { courtId: "c2", courtName: "Court 2", hour: "17:00", status: "available", isPeak: false },
                { courtId: "c3", courtName: "Court 3", hour: "17:00", status: "maintenance", isPeak: false },
                { courtId: "c4", courtName: "Court 4", hour: "17:00", status: "available", isPeak: false },
            ],
            // 18:00 -> 1 court available (c4 @ 400/hr) -> Only 1 Court Left! (rose) overrides Prime Time
            [
                { courtId: "c1", courtName: "Court 1", hour: "18:00", status: "booked", isPeak: true },
                { courtId: "c2", courtName: "Court 2", hour: "18:00", status: "booked", isPeak: true },
                { courtId: "c3", courtName: "Court 3", hour: "18:00", status: "maintenance", isPeak: true },
                { courtId: "c4", courtName: "Court 4", hour: "18:00", status: "available", isPeak: true },
            ],
            // 19:00 -> 1 court available (c1)
            [
                { courtId: "c1", courtName: "Court 1", hour: "19:00", status: "available", isPeak: true },
                { courtId: "c2", courtName: "Court 2", hour: "19:00", status: "booked", isPeak: true },
                { courtId: "c3", courtName: "Court 3", hour: "19:00", status: "maintenance", isPeak: true },
                { courtId: "c4", courtName: "Court 4", hour: "19:00", status: "booked", isPeak: true },
            ],
        ],
        ...overrides,
    };
}

describe("extractQuickSlotsSummary", () => {
    it("returns safe defaults when gridData is null", () => {
        const res = extractQuickSlotsSummary(null);
        expect(res.totalOpenSlots).toBe(0);
        expect(res.lowestHourlyRate).toBe(300);
        expect(res.lowestSplitPerPlayer).toBe(75);
        expect(res.slots).toEqual([]);
    });

    it("counts total open slots and extracts top 3 upcoming hours with badges and 4-player splits", () => {
        const res = extractQuickSlotsSummary(makeGridData());
        expect(res.totalOpenSlots).toBe(6);
        expect(res.openCourtsCount).toBe(3);
        expect(res.lowestHourlyRate).toBe(300);
        expect(res.lowestSplitPerPlayer).toBe(75);
        expect(res.slots).toHaveLength(3);

        expect(res.slots[0]).toMatchObject({
            courtId: "c1",
            courtName: "Court 1",
            hour: "16:00",
            endHour: "17:00",
            timeLabel: "04:00 PM – 05:00 PM",
            hourlyRate: 300,
            splitPerPlayer: 75,
            openCourtsAtHour: 2,
            badgeLabel: "Next Available",
            badgeTone: "emerald",
        });

        expect(res.slots[1]).toMatchObject({
            courtId: "c2",
            courtName: "Court 2",
            hour: "17:00",
            endHour: "18:00",
            timeLabel: "05:00 PM – 06:00 PM",
            badgeLabel: "Prime Time",
            badgeTone: "amber",
        });

        expect(res.slots[2]).toMatchObject({
            courtId: "c4",
            courtName: "Court 4",
            hour: "18:00",
            endHour: "19:00",
            timeLabel: "06:00 PM – 07:00 PM",
            hourlyRate: 400,
            splitPerPlayer: 100,
            openCourtsAtHour: 1,
            badgeLabel: "Only 1 Court Left!",
            badgeTone: "rose",
        });
    });
});
```

- [ ] **Step 2: Run Vitest to verify the test fails**

Run: `npx vitest run src/lib/utils/quick-slots.test.ts`
Expected: FAIL (`Cannot find module './quick-slots'`)

- [ ] **Step 3: Implement `extractQuickSlotsSummary` in `src/lib/utils/quick-slots.ts`**

Implement `extractQuickSlotsSummary(gridData, maxCards = 3)` so it filters out courts whose status in `gridData.courts` is not `"Available"`, counts all `"available"` cells across `gridData.grid`, computes `lowestHourlyRate` and `lowestSplitPerPlayer = Math.ceil(lowestHourlyRate / 4)`, and builds up to `maxCards` `QuickSlotCard` items (one per distinct upcoming hour row that has at least one available court). Prioritize `"Only 1 Court Left!"` (`rose`) when `openCourtsAtHour === 1`, then `"Prime Time"` (`amber`) when the hour is between `17` and `20` inclusive (`5:00 PM – 9:00 PM`), otherwise `"Next Available"` (`emerald`).

- [ ] **Step 4: Run Vitest to verify the tests pass**

Run: `npx vitest run src/lib/utils/quick-slots.test.ts`
Expected: PASS (2/2 tests passing)

---

### Task 2: Hero Quick-Slots Strip, BookingGrid Listener & Landing Page Wiring

**Files:**
- Create: `src/components/booking/HeroQuickSlots.tsx`
- Modify: `src/components/booking/BookingGrid.tsx`
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: `QuickSlotsSummary`, `QuickSlotCard` from `@/lib/utils/quick-slots`
- Produces:
  - `HeroQuickSlots` (`{ summary: QuickSlotsSummary; activeDate: string; todayISO: string }`)
  - Custom DOM event `"paddlix:select-slot"` with `detail: { courtId: string; courtName: string; hour: string }`
  - `BookingGrid` optional props `initialSelectCourt?: string`, `initialSelectHour?: string`

- [ ] **Step 1: Create `src/components/booking/HeroQuickSlots.tsx`**

Build the client component with two exported or combined parts:
1. **Top Status & Split Pill**: Displays a pulsing emerald dot, live open slot count (`"${summary.totalOpenSlots} Open Slots Today"` or `"Booking Open for Tomorrow · ${summary.totalOpenSlots} Slots"` when `summary.date > todayISO`), and `"₱${summary.lowestHourlyRate}/hr · Only ₱${summary.lowestSplitPerPlayer}/player (4-player split)"`.
2. **Next Open Slots Strip**: When `summary.slots.length > 0`, renders a crisp container (`bg-white/90 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-3.5 sm:p-4 shadow-xs`) with header `"Next Open Slots Today"` (or `"Tomorrow's Open Slots"` if `summary.date > todayISO`) and a 1-to-3 column responsive grid of interactive slot buttons.
   - Clicking a slot card when `summary.date === activeDate` dispatches `window.dispatchEvent(new CustomEvent("paddlix:select-slot", { detail: { courtId: slot.courtId, courtName: slot.courtName, hour: slot.hour } }))` and smoothly scrolls `#book-a-court` into view.
   - Clicking a slot card when `summary.date !== activeDate` navigates via `router.push(\`/?date=\${encodeURIComponent(slot.date)}&selectCourt=\${encodeURIComponent(slot.courtId)}&selectHour=\${encodeURIComponent(slot.hour)}#book-a-court\`)`.

- [ ] **Step 2: Update `src/components/booking/BookingGrid.tsx` to handle `"paddlix:select-slot"`, initial URL selection, and 4-player cart split**

In `src/components/booking/BookingGrid.tsx`:
1. Accept optional `initialSelectCourt?: string` and `initialSelectHour?: string` on `BookingGrid({ data, initialSelectCourt, initialSelectHour })`.
2. Add an idempotent `selectSlotInCart(slot: SelectedSlot)` helper that adds the slot to `selectedSlots` if not already present (and leaves it selected if already present) and resets `mobileCourtFilter` to `"all"` (or keeps it visible) so the user sees the selected cell.
3. Listen for `"paddlix:select-slot"` on `window` and call `selectSlotInCart`. Also invoke `selectSlotInCart` on mount when `initialSelectCourt` and `initialSelectHour` match an available court/hour in `data`.
4. In the Floating Cart Bar summary row (around line 451), display a subtle pill/label next to `cartTotal`: `₱{Math.ceil(cartTotal / 4).toLocaleString("en-PH")}/player (4 players)` so doubles groups see their per-person share live as they add hours.

- [ ] **Step 3: Wire `extractQuickSlotsSummary` and `HeroQuickSlots` into `src/app/page.tsx`**

In `src/app/page.tsx`:
1. Accept `selectCourt?: string; selectHour?: string` in `searchParams`.
2. Compute `let quickSummary = extractQuickSlotsSummary(gridData)`. If `date === today && quickSummary.totalOpenSlots === 0`, compute tomorrow's ISO date (`addDaysISO(today, 1)` or via `new Date`) and call `getBookingGridForDate(tomorrowISO)` to populate `quickSummary` so late-night visitors see tomorrow's open slots in the hero.
3. Render `<HeroQuickSlots summary={quickSummary} activeDate={date} todayISO={today} />` inside the hero section and pass `initialSelectCourt={selectCourt}` and `initialSelectHour={selectHour}` to `<BookingGrid />`.

- [ ] **Step 4: Run Vitest and TypeScript verification**

Run: `npx vitest run`
Expected: All test suites pass.
Run: `npx tsc --noEmit`
Expected: 0 TypeScript errors.

