# Admin Schedule: Multi-Hour Booking Unified Row Span Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Consolidate multi-hour court reservations on `/admin/schedule` into a single continuous visual card that spans across the booked hours using native CSS Grid, eliminating duplicate hour-by-hour cards.

**Architecture:** Refactor the schedule matrix in `ScheduleTimeline.tsx` to a unified master CSS grid container. In this grid, operating hours form row tracks and courts form columns; available slots take a single track row, while multi-hour bookings and Open Play holds span `grid-row: [hour-start-index] / span [durationHours]` with a single unified card.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Tailwind CSS, Lucide React, Vitest.

**Spec:** [docs/superpowers/specs/2026-11-16-admin-schedule-multi-hour-booking-span-design.md](file:///c:/Users/jedrik/Projects/pickle-wb/docs/superpowers/specs/2026-11-16-admin-schedule-multi-hour-booking-span-design.md)

## Global Constraints
- **Preserve Existing Grid Dimensions**: 1-hour discrete slot increments (09:00 to 23:00) with sticky time column on the left.
- **Single DOM Card per Reservation**: A 2-, 3-, or 4-hour reservation renders exactly one card element containing customer name, status badge, time window, and total price.
- **Full Interactive Parity**: Clicking the unified card must open the reservation details sheet (`activeBookingSlot`).
- **No Impact to Unbooked Courts**: Adjacent courts in the same time slots remain independent and bookable.
- **Ponytail Mode (full)**: Minimal diffs, idiomatic React/Tailwind/CSS Grid code, zero new external packages.

## Review Focus
1. **Multi-hour booking spanning midnight or venue close**: A booking from 21:00 to 23:00 (or 00:00 midnight close) must span exactly to the close track without overflowing.
2. **Back-to-back bookings on the same court**: When Player A books 18:00–19:00 and Player B books 19:00–21:00, each renders as its own card (span 1 and span 2) without visual collision.
3. **Open Play hold blocks**: Open Play sessions with `payment_method = "Open Play Hold"` or matching session hours must span their multi-hour duration as a single card.
4. **Single-hour reservations**: Standard 1-hour bookings continue to render with `span 1` without visual regression.
5. **Court filtering**: When the admin filters to a specific court (e.g. `Court 1`), the multi-hour card continues to span correctly within the single-court layout.

---

### Task 1: Schedule Timeline Multi-Hour Spanning Tests

**Files:**
- Create: `src/components/admin/ScheduleTimeline.test.tsx`

**Interfaces:**
- Consumes: `ScheduleTimeline` props (`selectedDate`, `todayDate`, `initialCourts`, `initialBookings`, `initialOperatingHours`)
- Produces: Vitest unit test suite proving multi-hour booking span and absence of duplicate hour cards

- [ ] **Step 1: Write the failing tests**

```tsx
// src/components/admin/ScheduleTimeline.test.tsx
import { describe, it, expect, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ScheduleTimeline } from "./ScheduleTimeline";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("@/app/admin/bookings/actions", () => ({
  createAdminBookingAction: vi.fn(),
  getRegisteredProfilesAction: vi.fn().mockResolvedValue([]),
  getExistingBookingsForCourtDateAction: vi.fn().mockResolvedValue([]),
  getActiveCourtsAction: vi.fn().mockResolvedValue([]),
}));

describe("ScheduleTimeline Multi-Hour Spanning", () => {
  const mockCourts = [
    { id: "court-1", name: "Court 1", status: "Available", hourlyRate: 300, isActive: true },
    { id: "court-2", name: "Court 2", status: "Available", hourlyRate: 300, isActive: true },
  ];

  const mockOperatingHours = [
    { id: "h1", dayOfWeek: 1, openTime: "09:00:00", closeTime: "23:00:00", isClosed: false },
  ];

  it("renders a multi-hour booking as a single card spanning multiple hours without duplicate cards", () => {
    // 3-hour booking on Court 1: 18:00 to 21:00
    const mockBookings = [
      {
        id: "b-1",
        courtId: "court-1",
        courtName: "Court 1",
        customerId: "cust-1",
        customerName: "Mark Ramos",
        customerEmail: "mark@example.com",
        bookingDate: "2026-11-16",
        startTime: "18:00:00",
        endTime: "21:00:00",
        status: "confirmed" as const,
        paymentStatus: "succeeded" as const,
        paymentMethod: "Cash walk in",
        paymentReference: null,
        totalPrice: 900,
        cancelledReason: null,
        createdAt: "2026-11-16T10:00:00Z",
      },
    ];

    const html = renderToStaticMarkup(
      <ScheduleTimeline
        selectedDate="2026-11-16"
        todayDate="2026-11-16"
        initialCourts={mockCourts}
        initialBookings={mockBookings}
        initialOperatingHours={mockOperatingHours}
      />
    );

    // Customer name should appear exactly once in the grid
    const customerMatches = html.match(/Mark Ramos/g) || [];
    expect(customerMatches.length).toBe(1);

    // Should indicate 3 hours span
    expect(html).toContain("18:00");
    expect(html).toContain("21:00");
    expect(html).toContain("₱900");

    // Grid row span attribute or inline style indicating span 3
    expect(html).toContain("span 3");
  });

  it("leaves adjacent courts available for booking during the same hours", () => {
    const mockBookings = [
      {
        id: "b-1",
        courtId: "court-1",
        courtName: "Court 1",
        customerId: "cust-1",
        customerName: "Mark Ramos",
        customerEmail: "mark@example.com",
        bookingDate: "2026-11-16",
        startTime: "18:00:00",
        endTime: "20:00:00",
        status: "confirmed" as const,
        paymentStatus: "succeeded" as const,
        paymentMethod: "Cash walk in",
        paymentReference: null,
        totalPrice: 600,
        cancelledReason: null,
        createdAt: "2026-11-16T10:00:00Z",
      },
    ];

    const html = renderToStaticMarkup(
      <ScheduleTimeline
        selectedDate="2026-11-16"
        todayDate="2026-11-16"
        initialCourts={mockCourts}
        initialBookings={mockBookings}
        initialOperatingHours={mockOperatingHours}
      />
    );

    // Court 2 must still show Available options at 18:00
    expect(html).toContain("Available");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/admin/ScheduleTimeline.test.tsx`
Expected: FAIL (because current implementation renders "Mark Ramos" multiple times and does not output `span 3`).

- [ ] **Step 3: Commit test file**

```bash
git add src/components/admin/ScheduleTimeline.test.tsx
git commit -m "test(admin): add tests for multi-hour booking spanning in schedule timeline"
```

---

### Task 2: Implement Unified Master Grid and Multi-Hour Cell Spanning

**Files:**
- Modify: `src/components/admin/ScheduleTimeline.tsx:630-830`

**Interfaces:**
- Consumes: `timeSlots`, `visibleCourts`, `initialBookings`
- Produces: CSS Grid schedule matrix with `grid-row: [slot-start] / span [duration]` for multi-hour bookings and single-slot rendering for unbooked hours

- [ ] **Step 1: Implement slot map and grid layout calculation in `ScheduleTimeline.tsx`**

1. Build an indexing helper or map for each court:
   - Identify bookings starting at `slot.start`.
   - Compute `durationHours = Math.max(1, Math.round((timeToMinutes(b.endTime) - timeToMinutes(b.startTime)) / 60))`.
   - Mark hours covered by the booking so they skip rendering duplicate slots on that court.
2. Structure the grid container:
   - Column 1: Sticky Time labels (`row: slotIndex + 1`, `col: 1`).
   - Column `cIdx + 2`: Court slots (`row: slotIndex + 1 / span durationHours`, `col: cIdx + 2`).
3. Render the single booking card with:
   - Full booking span label (e.g. `6:00 PM – 9:00 PM (3 hrs)`).
   - Customer name and payment badge (`Paid` / `Pending`).
   - Total price in Philippine Pesos (`₱900`).
   - Click handler opening `activeBookingSlot`.

- [ ] **Step 2: Run test to verify it passes**

Run: `npx vitest run src/components/admin/ScheduleTimeline.test.tsx`
Expected: PASS (Mark Ramos appears once, `span 3` is present, Court 2 available slots remain intact).

- [ ] **Step 3: Run full test suite and type check**

Run: `npm test -- --run`
Run: `npx tsc --noEmit`
Expected: All 29 test files pass, 0 TypeScript errors.

- [ ] **Step 4: Commit implementation**

```bash
git add src/components/admin/ScheduleTimeline.tsx
git commit -m "feat(admin): render multi-hour bookings as unified spanned card on schedule timeline"
```

---

### Task 3: Verification, Impeccable Design Audit, and Integration Push

**Files:**
- Modify: `src/components/admin/ScheduleTimeline.tsx` (if detector or layout audit findings require polish)

- [ ] **Step 1: Run Impeccable Design Detector**

Run: `.agent\skills\impeccable\scripts\impeccable.cmd detect --json src/components/admin/ScheduleTimeline.tsx`
Expected: `[]` (0 design violations).

- [ ] **Step 2: Verify git status and commit cleanliness**

Run: `git status`
Expected: Clean working tree.

- [ ] **Step 3: Push to origin main**

Run: `git push origin main`
Expected: Up to date on `origin/main`.
