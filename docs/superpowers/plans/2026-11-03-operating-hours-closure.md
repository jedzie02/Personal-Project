# Facility Operating Hours Closure & Public Dynamic Schedule Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dynamically bind the public booking grid and booking validation to the venue's configured operating hours so that closed days display a friendly closed notice and block bookings, and schedule updates invalidate cache on Vercel immediately.

**Architecture:** 
- In `schedule.service.ts`, use admin client fallback to ensure writes succeed regardless of RLS, and export `getOperatingHoursForDate(date)`.
- In `booking-grid.service.ts`, query the operating hours for the given date. If closed, set `isClosed: true`.
- In `quick-slots.ts`, return 0 open slots and `isVenueClosed: true` when `gridData.isClosed`.
- In `BookingGrid.tsx`, display the friendly "Venue Closed on this Date" empty state card with a button to jump to the next day.
- In `booking.service.ts`, reject booking creation if the date is marked closed or times are outside operating window.
- In `admin/schedule/actions.ts`, revalidate `/`, `/book`, and `/admin/schedule`.

**Tech Stack:** Next.js App Router (Server Actions, `revalidatePath`), Supabase, Tailwind CSS, Lucide React, Vitest.

**Spec:** `docs/superpowers/specs/2026-11-03-operating-hours-closure.md`

## Global Constraints
- Must maintain dark mode design system (slate-900/950, emerald/amber badges, no pure white background).
- Maintain 11-digit phone number validation and existing booking rules.
- All existing vitest suites must pass.

## Tasks

- [ ] **Task 1: Update Schedule Service & Admin Actions**
  - Use `createAdminClient` fallback in `schedule.service.ts` for updating and reading operating hours.
  - Implement date-to-day-of-week resolver in `schedule.service.ts`.
  - Add `revalidatePath("/")` and `revalidatePath("/book")` to `updateScheduleAction`.

- [ ] **Task 2: Dynamic Booking Grid Service & Quick Slots**
  - Update `booking-grid.service.ts` to fetch operating hours for the requested date.
  - If `isClosed === true`, populate `isClosed: true`, `hours: []`, `grid: []`.
  - If open, generate hour slots based on that day's `openTime` and `closeTime`.
  - Update `quick-slots.ts` and `quick-slots.test.ts` to handle closed days cleanly.

- [ ] **Task 3: Public Booking Grid UI Closed Notice**
  - In `BookingGrid.tsx`, check `data.isClosed`.
  - Render dark-mode Option 1 "Venue Closed" card with Moon/Calendar icon, friendly explanation, and "View Next Day" button.
  - Hide cart drawer triggers when venue is closed.

- [ ] **Task 4: Booking Validation & Available Slots Backend Guard**
  - In `booking.service.ts`, guard `createBooking` and `getAvailableSlotsForDate` against closed days and out-of-bounds hours.
  - Add unit test verifying that closed days return empty slots and reject bookings.

- [ ] **Task 5: Verification & End-to-End Typecheck**
  - Run `npx vitest run` to ensure all tests pass.
  - Run `npx tsc --noEmit` to verify type safety.

