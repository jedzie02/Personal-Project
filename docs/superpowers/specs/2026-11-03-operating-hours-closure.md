# Design: Facility Operating Hours Dynamic Enforcement & Closed Day Notice

## Context & Problem
Admins can toggle days of the week as "Closed" or configure custom open/close hours in `/admin/schedule`. However:
1. `src/lib/services/booking-grid.service.ts` hardcoded `09:00` - `23:00` and never queried `operating_hours`.
2. `src/lib/services/booking.service.ts` also hardcoded `09:00` - `23:00` and allowed reservations even when a day was closed.
3. `src/app/admin/schedule/actions.ts` only revalidated `/admin/schedule`, preventing Vercel from updating the public home page (`/`) and booking pages.
4. Saving schedule changes in `schedule.service.ts` should use admin-privileged DB access to prevent silent RLS failures.

## Proposed Changes

### 1. Database & Service Layer (`src/lib/services/schedule.service.ts`)
- Use `createAdminClient()` (falling back to `createClient()`) so schedule updates reliably commit without RLS permission issues on Vercel.
- Cache/fetch operating hours for the given date's day of week.

### 2. Booking Grid Service (`src/lib/services/booking-grid.service.ts`)
- Query `getOperatingHoursForDay(dayOfWeek)` for the requested `date`.
- Add `isClosed: boolean` to `BookingGridData`.
- If `isClosed === true`:
  - Set `hours = []`, `grid = []`, `isClosed = true`.
- If open with custom hours:
  - Generate hour slots dynamically between `openTime` and `closeTime`.

### 3. Quick Slots Utility (`src/lib/utils/quick-slots.ts`)
- If `gridData.isClosed`:
  - Return `totalOpenSlots = 0`, `nextSlot = null`, and `isVenueClosed = true`.
  - Prevent Hero status bar from showing false "available" slots on closed days.

### 4. Public Booking Grid UI (`src/components/booking/BookingGrid.tsx`)
- Detect `data.isClosed`.
- If true, display the Option 1 **Facility Closed Card**:
  - Dark slate card matching platform aesthetics (`bg-slate-900/60`, `border-slate-800`).
  - Clear icon + title: "Venue is Closed on this Day".
  - Friendly subtext: "DinkSync is closed on [Date] in accordance with operating hours. Please pick another date to reserve a court."
  - Action button: "Check Tomorrow / Next Open Day" which updates the URL query to the following date.

### 5. Booking Backend Guard (`src/lib/services/booking.service.ts`)
- In `createBooking`:
  - Check `getOperatingHoursForDay(dayOfWeek)`.
  - If `isClosed`: immediately return `{ success: false, error: "The venue is closed on this date." }`.
  - If `startTime < openTime || endTime > closeTime`: reject with `"Selected time slot is outside facility operating hours."`.
- In `getAvailableSlotsForDate`:
  - If `isClosed`, return `[]`.
  - If open, generate slots according to that day's `openTime` and `closeTime`.

### 6. Cache Revalidation (`src/app/admin/schedule/actions.ts`)
- On successful schedule update:
  - `revalidatePath("/")`
  - `revalidatePath("/book")`
  - `revalidatePath("/admin/schedule")`
  - `revalidatePath("/admin/bookings/new")`

## Verification Plan
1. Automated unit test suite: `npx vitest run` (ensure all tests pass, add unit tests for `booking-grid.service` closed day and `quick-slots`).
2. Typecheck: `npx tsc --noEmit`.
3. Manual verification: check Sunday Nov 8 closed state on booking grid, date switching, and booking rejection.

