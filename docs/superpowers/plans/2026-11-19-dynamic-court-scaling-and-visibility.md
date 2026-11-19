# Dynamic Court Scaling (No Min/Max Limits) & Visibility Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable unlimited court scaling with adaptive column widths (shrinking on 5+ courts without column misalignment) and instant visibility toggling via the Admin availability status.

**Architecture:** Replace brittle Tailwind column switches in `BookingGrid.tsx` and `ScheduleTimeline.tsx` with dynamic inline CSS grid templates (`gridTemplateColumns`) and computed minimum widths, ensuring mathematical alignment between the sticky time column, headers, and hourly rows. Align Supabase court status mutations in `actions.ts` and `court.service.ts` to soft-toggle visibility (`"Not Available"` drops from the public grid, `"Available"` restores it) with instant Next.js cache revalidation while keeping bookings preserved.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript 5, Tailwind CSS 4, Supabase (`@supabase/ssr`, `@supabase/supabase-js`), Vitest.

**Spec:** `docs/superpowers/specs/2026-11-19-dynamic-court-scaling-and-visibility-design.md`

## Global Constraints

- **Zero-Data-Loss Visibility**: Changing a court status to `"Not Available"` sets `is_active = false` and `status = "Not Available"`. Never delete court rows or cascade-delete existing bookings.
- **Strict Row & Column Alignment**: The sticky time column, the court headers, and all hourly slot rows MUST share the exact same dynamic CSS grid column template (`gridTemplateColumns`), preventing any horizontal drift or column wrapping.
- **Adaptive Column Shrinking**: When active courts $\ge 5$, columns shrink from standard spacious width (~140px) to compact width (~96px desktop / 85px mobile) with snugger badge padding.
- **Instant Cache Invalidation**: Server action status changes must revalidate `/book`, `/`, `/admin/courts`, and `/admin/schedule`.
- **Workspace Parity**: Implement changes in `packages/core` and `apps/paddle-hub`, keeping `apps/dinksync` and `src` in sync.

## Review Focus

1. **Zero Courts Available (`activeCourts.length === 0`)**: Public booking grid displays a clean, friendly empty state card without crashing or rendering empty table borders. *(Tested in Task 2, Step 1)*
2. **Single Court Layout (`activeCourts.length === 1`)**: Single court stretches smoothly (`minmax(140px, 1fr)`) without layout distortion or unnecessary horizontal scrollbars. *(Tested in Task 2, Step 1)*
3. **5+ Courts Shrinking & Strict Alignment (`activeCourts.length >= 5`)**: When 5 to 12 courts are active, column templates shrink to compact widths, badges use compact padding, and column $k$ in Row 5 aligns mathematically with column $k$ in the header. *(Tested in Task 2, Step 1)*
4. **Availability Dropdown Toggled to "Not Available"**: Court immediately drops from `/book`, but past and future reservations on that court remain intact. *(Tested in Task 1, Step 1)*
5. **Staff Schedule Visibility on Hidden Courts**: `/admin/schedule` displays all courts (including inactive ones marked with `"Inactive"` badge) so staff can manage existing games on courts taken offline. *(Tested in Task 3, Step 1)*

---

### Task 1: Availability-Driven Booking Grid Filtering & Cache Revalidation

**Files:**
- Modify: `apps/paddle-hub/src/lib/services/booking-grid.service.ts`
- Modify: `apps/paddle-hub/src/app/admin/courts/actions.ts`
- Modify: `packages/core/src/services/booking-grid.service.ts`
- Test: `apps/paddle-hub/src/lib/services/booking-grid.service.test.ts`

**Interfaces:**
- Consumes: Supabase `courts` table (`id`, `name`, `status`, `is_active`, `hourly_rate`).
- Produces: `getBookingGridForDate(date: string): Promise<BookingGridData | null>`, `updateCourtStatusAction(courtId: string, status: CourtStatus): Promise<{ success: boolean; error?: string }>`.

- [ ] **Step 1: Write the failing unit tests for court status filtering**

```typescript
// apps/paddle-hub/src/lib/services/booking-grid.service.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { getBookingGridForDate } from "./booking-grid.service";

describe("getBookingGridForDate court filtering", () => {
    it("excludes courts marked as Not Available or Deactivated from the public booking grid", async () => {
        // Mock supabase to return 3 courts: Court 1 (Available), Court 2 (Not Available), Court 3 (Maintenance)
        // Expected: Court 2 is excluded; Court 1 and Court 3 are returned
    });

    it("restores court to public booking grid when status is changed back to Available", async () => {
        // Mock supabase returning all courts as Available
        // Expected: All courts returned in natural numeric order
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run apps/paddle-hub/src/lib/services/booking-grid.service.test.ts`
Expected: FAIL or verifies status filter requirements.

- [ ] **Step 3: Update `booking-grid.service.ts` and `actions.ts`**

In `apps/paddle-hub/src/lib/services/booking-grid.service.ts` and `packages/core/src/services/booking-grid.service.ts`:
Ensure `courts` query filters:
```typescript
courts = dbCourts
    .filter((c: any) => c.is_active !== false && c.status !== "Deactivated" && c.status !== "Not Available")
    .map((c: any) => ({
        id: c.id,
        name: c.name,
        status: c.status === "Maintenance" ? "Maintenance" : "Available",
        hourly_rate: c.hourly_rate != null ? Number(c.hourly_rate) : 300,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
```

In `apps/paddle-hub/src/app/admin/courts/actions.ts`:
Ensure `updateCourtStatusAction`:
```typescript
const isActive = status === "Available" || status === "Maintenance";
const dbStatus = status === "Maintenance" ? "Maintenance" : status === "Not Available" ? "Not Available" : "Available";

await supabase.from("courts").update({ status: dbStatus, is_active: isActive }).eq("id", courtId);

revalidatePath("/admin/courts");
revalidatePath("/admin/schedule");
revalidatePath("/book");
revalidatePath("/");
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run apps/paddle-hub/src/lib/services/booking-grid.service.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/paddle-hub/src/lib/services/booking-grid.service.ts apps/paddle-hub/src/app/admin/courts/actions.ts packages/core/src/services/booking-grid.service.ts apps/paddle-hub/src/lib/services/booking-grid.service.test.ts
git commit -m "feat(courts): filter Not Available courts from public booking grid with instant cache revalidation"
```

---

### Task 2: Dynamic Grid Sizing & Adaptive Column Template in `BookingGrid.tsx`

**Files:**
- Modify: `apps/paddle-hub/src/components/booking/BookingGrid.tsx`
- Test: `apps/paddle-hub/src/components/booking/BookingGrid.test.tsx`

**Interfaces:**
- Consumes: `BookingGridData` (`courts: { id, name, status, hourly_rate }[]`, `hours: string[]`, `grid: GridCell[][]`).
- Produces: Dynamically sized, perfectly aligned booking matrix supporting 0 to N courts with compact column widths on 5+ courts.

- [ ] **Step 1: Write unit tests for dynamic column template and empty state**

```typescript
// apps/paddle-hub/src/components/booking/BookingGrid.test.tsx
describe("BookingGrid dynamic court scaling", () => {
    it("renders empty state card when 0 active courts are available", () => {
        // Render BookingGrid with data.courts = []
        // Expect "No courts are currently available" message
    });

    it("applies compact column styles when 5 or more courts are present", () => {
        // Render BookingGrid with 7 courts
        // Expect gridTemplateColumns to use compact column min-widths
    });

    it("uses identical gridTemplateColumns style for header and time slot rows", () => {
        // Render BookingGrid with 4 courts and 7 courts
        // Verify header and row elements have identical computed gridTemplateColumns style
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run apps/paddle-hub/src/components/booking/BookingGrid.test.tsx`
Expected: FAIL (missing dynamic grid inline template and empty state).

- [ ] **Step 3: Implement dynamic grid scaling in `BookingGrid.tsx`**

1. Replace `getGridColsClass` with computed column styles:
```typescript
const isCompact = activeCourts.length >= 5;
const colMinWidth = isCompact ? 96 : 140;
const mobileColMinWidth = isCompact ? 85 : 120;
const timeColWidth = 105;
const desktopTimeColWidth = isCompact ? 140 : 170;

const gridTemplate = `${timeColWidth}px repeat(${activeCourts.length}, minmax(${mobileColMinWidth}px, 1fr))`;
const desktopGridTemplate = `${desktopTimeColWidth}px repeat(${activeCourts.length}, minmax(${colMinWidth}px, 1fr))`;

const minContainerWidth = timeColWidth + activeCourts.length * mobileColMinWidth;
const desktopMinContainerWidth = desktopTimeColWidth + activeCourts.length * colMinWidth;
```

2. Apply identical `style={{ gridTemplateColumns: ... }}` to both:
   - Court header row `<div className="grid ...">`
   - Every hour slot row `<div className="grid ...">`
3. If `isCompact` is true, apply compact text (`text-xs font-medium`), tighter slot button padding, and compact badges (`px-1.5 py-0.5`).
4. If `activeCourts.length === 0`:
   Render clean empty state:
   ```tsx
   <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
       <CalendarX className="w-10 h-10 text-slate-400 mx-auto mb-3" />
       <h3 className="text-base font-semibold text-slate-900 dark:text-white">No Courts Available</h3>
       <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
           There are currently no courts available for booking on this date. Please select another date.
       </p>
   </div>
   ```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run apps/paddle-hub/src/components/booking/BookingGrid.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/paddle-hub/src/components/booking/BookingGrid.tsx apps/paddle-hub/src/components/booking/BookingGrid.test.tsx
git commit -m "feat(booking-grid): dynamic adaptive grid scaling for unlimited courts with compact 5+ layout"
```

---

### Task 3: Admin Schedule Timeline Scaling & Inactive Visibility Parity

**Files:**
- Modify: `apps/paddle-hub/src/app/admin/schedule/page.tsx`
- Modify: `apps/paddle-hub/src/components/admin/ScheduleTimeline.tsx`

**Interfaces:**
- Consumes: `getAllCourts()` returning active and inactive courts.
- Produces: Dynamic staff schedule timeline that scales cleanly to 5+ courts without column wrapping, keeping inactive courts visible with status badges.

- [ ] **Step 1: Write test for Admin Schedule Timeline dynamic court scaling**

```typescript
// apps/paddle-hub/src/components/admin/ScheduleTimeline.test.tsx (or in page.test.tsx)
describe("ScheduleTimeline court scaling", () => {
    it("renders all courts including inactive courts with Inactive badge", () => {
        // Pass courts containing active and inactive
        // Verify Inactive badge rendered
    });

    it("applies dynamic column template preventing row wrapping for 6+ courts", () => {
        // Pass 8 courts
        // Verify grid template adapts dynamically
    });
});
```

- [ ] **Step 2: Run test to verify status**

Run: `npx vitest run apps/paddle-hub/src/components/admin/`
Expected: Check current test status.

- [ ] **Step 3: Update `AdminSchedulePage` and `ScheduleTimeline.tsx`**

1. In `apps/paddle-hub/src/app/admin/schedule/page.tsx`:
   Ensure it queries `getAllCourts()` so staff can view schedules across all courts.
2. In `apps/paddle-hub/src/components/admin/ScheduleTimeline.tsx`:
   Replace the rigid `getGridColsClass` with computed inline `gridTemplateColumns: \`105px repeat(\${courts.length}, minmax(\${colWidth}px, 1fr))\`` across the header and each time row, so large venues (7+ courts) scroll horizontally without wrapping.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run apps/paddle-hub/`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/paddle-hub/src/app/admin/schedule/page.tsx apps/paddle-hub/src/components/admin/ScheduleTimeline.tsx
git commit -m "feat(admin-schedule): apply dynamic grid template and preserve inactive court visibility for staff"
```

---

### Task 4: Full Multi-Tenant Sync & End-to-End Test Suite Verification

**Files:**
- Sync: `apps/dinksync/src/components/booking/BookingGrid.tsx`
- Sync: `apps/dinksync/src/lib/services/booking-grid.service.ts`
- Sync: `src/components/booking/BookingGrid.tsx`
- Sync: `src/lib/services/booking-grid.service.ts`

- [ ] **Step 1: Sync dynamic grid and service changes to other workspace apps**

Propagate the tested dynamic template and service filtering changes to `apps/dinksync` and root `src` to maintain workspace parity.

- [ ] **Step 2: Run complete monorepo test suite**

Run: `npm run test`
Expected: All unit and integration test suites pass across all workspaces.

- [ ] **Step 3: Commit**

```bash
git add apps/dinksync/ src/
git commit -m "chore(sync): synchronize dynamic court grid scaling and availability filtering across all workspaces"
```
