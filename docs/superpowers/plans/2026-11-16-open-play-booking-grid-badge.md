# Open Play Badge on Booking Grid Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Detect Open Play hold reservations in the booking grid data and render a clickable emerald "OPEN PLAY" badge on `/book` that redirects players to join the session.

**Architecture:** Extend `GridCell` with `"open_play"` status and optional session metadata (`openPlay`). In `booking-grid.service.ts`, detect bookings with `payment_method === OPEN_PLAY_HOLD_LABEL` and match with `open_play_sessions` on that date. In `BookingGrid.tsx`, render an interactive emerald button for `"open_play"` slots with a router push to `/#open-play`.

**Tech Stack:** Next.js (App Router), TypeScript, Tailwind CSS, Lucide React, Vitest.

**Spec:** [docs/superpowers/specs/2026-11-16-open-play-booking-grid-badge-design.md](file:///c:/Users/jedrik/Projects/pickle-wb/docs/superpowers/specs/2026-11-16-open-play-booking-grid-badge-design.md)

## Global Constraints
- Strictly operate in ponytail mode (full): minimal diffs, idiomatic code, zero unnecessary dependencies.
- 100% type-safe with clean `npx tsc --noEmit`.
- All automated tests must pass (`npm test -- --run`).

## Review Focus
- Open Play sessions that fall into the past on the current day must still render as `"passed"` and not active clickable buttons.
- Open Play slots must never be selectable as part of standard multi-hour private booking cart checkouts.
- When `open_play_sessions` record fails to fetch or is missing, the cell still gracefully falls back to `"open_play"` with default ₱150 rate.
- Cancelled open play sessions (`status === 'cancelled'`) must not render as `"open_play"`.

---

### Task 1: Extend GridCell Types & Service Detection for Open Play

**Files:**
- Modify: `src/lib/services/booking-grid.service.ts`
- Test: `src/lib/services/booking-grid.service.test.ts`

**Interfaces:**
- Consumes: `OPEN_PLAY_HOLD_LABEL` from `@/lib/utils/open-play`.
- Produces: `GridCell` status union including `"open_play"` and optional `openPlay: { sessionId?: string; pricePerPlayer?: number }`.

- [ ] **Step 1: Write the failing unit test**

In `src/lib/services/booking-grid.service.test.ts`, add a test for Open Play hold detection:
```ts
it("assigns status: 'open_play' and openPlay details when booking has OPEN_PLAY_HOLD_LABEL", async () => {
    const gridData = await getBookingGridForDate("2099-01-01");
    const openPlaySlot = gridData!.grid.find((row) => row[0].hour === "18:00")?.[0];
    expect(openPlaySlot?.status).toBe("open_play");
    expect(openPlaySlot?.openPlay?.pricePerPlayer).toBe(200);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/services/booking-grid.service.test.ts`
Expected: FAIL (status is not 'open_play')

- [ ] **Step 3: Update `src/lib/services/booking-grid.service.ts`**

1. Import `OPEN_PLAY_HOLD_LABEL` from `@/lib/utils/open-play`.
2. Add `"open_play"` to `GridCell['status']`.
3. Add `openPlay?: { sessionId?: string; pricePerPlayer?: number }` to `GridCell`.
4. In `getBookingGridForDate`, query `open_play_sessions` for the target date (`status != 'cancelled'`) along with `payment_method` in the `bookings` select.
5. In current/future booking checks, if `booking.payment_method === OPEN_PLAY_HOLD_LABEL`, return `status: "open_play"` with matching session price/id.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/services/booking-grid.service.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/services/booking-grid.service.ts src/lib/services/booking-grid.service.test.ts
git commit -m "feat(booking-grid): detect open play hold bookings and set cell status to open_play"
```

---

### Task 2: Render Interactive OPEN PLAY Badge on BookingGrid Component

**Files:**
- Modify: `src/components/booking/BookingGrid.tsx`
- Test: `src/components/booking/BookingGrid.test.tsx`

**Interfaces:**
- Consumes: `cell.status === "open_play"`, `cell.openPlay`, `Users` icon from `lucide-react`, `useRouter` from `next/navigation`.
- Produces: Interactive button navigating to `/#open-play`.

- [ ] **Step 1: Write the failing unit test**

In `src/components/booking/BookingGrid.test.tsx`, add a test verifying the `"open_play"` cell renders with "OPEN PLAY" text and redirect capability:
```tsx
it("renders OPEN PLAY button with price and links to /#open-play", () => {
    const openPlayGridData: BookingGridData = {
        date: "2026-11-04",
        isClosed: false,
        operatingOpen: "09:00",
        operatingClose: "10:00",
        courts: [{ id: "court-1", name: "Court 1", status: "Available", hourly_rate: 300 }],
        hours: ["09:00"],
        grid: [[{
            courtId: "court-1",
            courtName: "Court 1",
            hour: "09:00",
            status: "open_play",
            isPeak: false,
            openPlay: { sessionId: "op-1", pricePerPlayer: 150 },
        }]],
    };

    const html = renderToStaticMarkup(
        <BookingGrid data={openPlayGridData} />
    );
    expect(html).toContain("OPEN PLAY");
    expect(html).toContain("₱150/player");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/booking/BookingGrid.test.tsx`
Expected: FAIL (no "OPEN PLAY" text)

- [ ] **Step 3: Update `src/components/booking/BookingGrid.tsx`**

1. Import `Users` from `lucide-react` (if not already imported).
2. Inside `GridSlotCell`, add a `case "open_play":` branch:
   - Render a button with emerald styling (`bg-emerald-500/15 dark:bg-emerald-950/50 hover:bg-emerald-500/25 dark:hover:bg-emerald-900/60 border border-emerald-500/40 dark:border-emerald-600/50 text-emerald-800 dark:text-emerald-300`).
   - Display `Users` icon, bold `"OPEN PLAY"` badge label, and `₱{price}/player`.
   - On click, execute `router.push("/#open-play")`.
3. In cart selection logic, ensure `"open_play"` cells cannot be clicked into the private booking cart.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/booking/BookingGrid.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/booking/BookingGrid.tsx src/components/booking/BookingGrid.test.tsx
git commit -m "feat(booking-grid): render interactive emerald open play slot linking to open play section"
```

---

### Task 3: Full Test Suite & TypeScript Verification

**Files:**
- Verification only across repository.

- [ ] **Step 1: Run complete test suite**

Run: `npm test -- --run`
Expected: All 21 test files pass.

- [ ] **Step 2: Run TypeScript typecheck**

Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 3: Final commit and verify working tree clean**

```bash
git status
```
Expected: working tree clean.
