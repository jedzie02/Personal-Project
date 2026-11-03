# Multi-Hour Booking with Smart Court Jumping Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow players on the public schedule grid to book 1 to 4 consecutive hours at ₱300/hour, keeping them on the same court when possible and automatically jumping to the next available court if conflicts arise.

**Architecture:** A pure resolver function `resolveContinuousSlots` analyzes the day's grid to determine availability and assign courts for 1–4 hours. The `BookingGrid` modal exposes a duration toggle (`1 hr`, `2 hrs`, `3 hrs`, `4 hrs`) and displays the resulting court itinerary. The `/confirm-booking` flow and action create the required booking rows sharing the customer transaction reference, locking the courts seamlessly.

**Tech Stack:** Next.js 16 (App Router), TypeScript, Tailwind CSS, Supabase PostgreSQL, Vitest.

**Spec:** [`docs/superpowers/specs/2026-11-02-multi-hour-court-jump-design.md`](file:///c:/Users/jedrik/Projects/pickle-wb/docs/superpowers/specs/2026-11-02-multi-hour-court-jump-design.md)

## Global Constraints

- Pricing rate is **₱300.00** per hour (1 hr: ₱300, 2 hrs: ₱600, 3 hrs: ₱900, 4 hrs: ₱1,200)
- Venue operates strictly from 9:00 AM to 11:00 PM (23:00) — no booking may extend past 23:00
- Maximum duration is 4 hours
- Zero database migrations (uses existing `bookings` table schema)
- All existing tests must pass (`npm run test`) and `npx tsc --noEmit` must return 0 errors

## Review Focus

- Slot requested exceeds 23:00 (e.g. starting at 9:00 PM / 21:00 with 3 or 4 hours): duration options must be disabled
- Initial court is booked at hour 2, but Court 2 is free: system must assign Court 2 for hour 2 and display the court switch itinerary
- Venue is completely full at hour 2: durations >= 2 hours must be cleanly disabled with an informative message
- Court jumping creates multiple booking segments: confirm booking action must create all rows and link them properly
- Player cancels or views bookings: My Bookings page must render continuous or court-switch bookings correctly

---

## Task 1: Update Base Rate to ₱300

**Files:**
- Modify: `src/lib/config/booking-rules.ts`
- Modify: `src/lib/config/booking-rules.test.ts`
- Modify: `src/components/booking/BookingGrid.tsx:47-51`

**Interfaces:**
- Produces: `PRICE_PER_HOUR = 300`

- [ ] **Step 1: Update `PRICE_PER_HOUR` in `src/lib/config/booking-rules.ts`**
  Change:
  ```ts
  export const PRICE_PER_HOUR = 300;
  ```

- [ ] **Step 2: Update default fallback court hourly rate in `BookingGrid.tsx`**
  Update `DEFAULT_MASTER_COURTS` hourly_rate from `25` to `300`.

- [ ] **Step 3: Run unit tests to verify**
  Run: `npm run test`
  Expected: PASS

- [ ] **Step 4: Commit**
  ```bash
  git add src/lib/config/booking-rules.ts src/components/booking/BookingGrid.tsx
  git commit -m "feat: set base court pricing to 300 pesos per hour"
  ```

---

## Task 2: Pure Resolver `resolveContinuousSlots` + Unit Tests

**Files:**
- Create: `src/lib/utils/court-jump.ts`
- Test: `src/lib/utils/court-jump.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export interface BookingSegment {
      hour: string;        // "09:00"
      endHour: string;     // "10:00"
      courtId: string;
      courtName: string;
      hourlyRate: number;
      isJump: boolean;     // true if switched from the previous segment's court
  }

  export interface ContinuousSlotsResult {
      available: boolean;
      segments: BookingSegment[];
      totalPrice: number;
      hasCourtJump: boolean;
      disabledReason?: string;
  }

  export function resolveContinuousSlots(
      initialCourtId: string,
      initialCourtName: string,
      startHour: string,
      durationHours: number,
      grid: GridCell[][],
      masterCourts: { id: string; name: string; hourly_rate?: number; status?: string }[],
      closeTime?: string // default "23:00"
  ): ContinuousSlotsResult;
  ```

- [ ] **Step 1: Write unit tests in `src/lib/utils/court-jump.test.ts`**
  Test cases:
  1. 1-hour booking: returns available, 1 segment, no jump, totalPrice = 300
  2. 2-hour booking on same court when free: returns available, 2 segments on same court, hasCourtJump = false, totalPrice = 600
  3. 2-hour booking when initial court booked at hour 2: assigns next available court, hasCourtJump = true
  4. Exceeding close time (e.g. 21:00 with 3 hours): returns available = false, disabledReason = "Exceeds closing time"
  5. Venue completely full at hour 2: returns available = false, disabledReason = "No courts available"

- [ ] **Step 2: Run test to verify it fails (RED)**
  Run: `npm run test`
  Expected: FAIL (module not found)

- [ ] **Step 3: Implement `resolveContinuousSlots` in `src/lib/utils/court-jump.ts`**
  Implement the logic prioritizing initial court, falling back to next available active court in `masterCourts`, computing segments and totals.

- [ ] **Step 4: Run test to verify it passes (GREEN)**
  Run: `npm run test`
  Expected: PASS

- [ ] **Step 5: Commit**
  ```bash
  git add src/lib/utils/court-jump.ts src/lib/utils/court-jump.test.ts
  git commit -m "feat: add resolveContinuousSlots with smart court jump logic"
  ```

---

## Task 3: Update `BookingGrid.tsx` with Duration Selector & Itinerary

**Files:**
- Modify: `src/components/booking/BookingGrid.tsx`

**Interfaces:**
- Consumes: `resolveContinuousSlots` from Task 2
- Produces: Interactive duration pills (`1 hr`, `2 hrs`, `3 hrs`, `4 hrs`) in the preview modal with real-time price & court itinerary breakdown.

- [ ] **Step 1: Add duration state to `BookingGrid`**
  Add state `const [selectedDuration, setSelectedDuration] = useState<number>(1);`
  Reset to `1` when opening a new slot or closing modal.

- [ ] **Step 2: Compute slot resolution for each duration (1–4)**
  Use `useMemo` to evaluate `resolveContinuousSlots` for durations 1, 2, 3, and 4 so each button knows if it is valid or disabled.

- [ ] **Step 3: Render Duration Controls in Preview Modal**
  Add Duration toggle bar with buttons for 1, 2, 3, 4 hours.
  Show price under each duration button.
  Disable buttons where `available === false`.

- [ ] **Step 4: Render Court Jump Itinerary Box when `hasCourtJump === true`**
  Display visual itinerary:
  - 🎾 Hour 1: Court 1 (9:00 AM – 10:00 AM)
  - 🔀 Hour 2: Court 2 (10:00 AM – 11:00 AM) • Court Switch

- [ ] **Step 5: Update "Book Slot" navigation**
  Pass segments serialized in the URL:
  `segments=${encodeURIComponent(JSON.stringify(resolved.segments))}&duration=${selectedDuration}&totalPrice=${resolved.totalPrice}`

- [ ] **Step 6: Run type check & tests**
  `npx tsc --noEmit` and `npm run test`
  Expected: 0 errors, all tests pass

- [ ] **Step 7: Commit**
  ```bash
  git add src/components/booking/BookingGrid.tsx
  git commit -m "feat: add duration picker and court jump itinerary to booking modal"
  ```

---

## Task 4: Multi-Segment Confirmation Page & Actions

**Files:**
- Modify: `src/app/confirm-booking/ConfirmBookingClient.tsx`
- Modify: `src/app/confirm-booking/actions.ts`

**Interfaces:**
- Consumes: `segments` URL parameter containing `BookingSegment[]`
- Produces: Displays itinerary on confirmation card; inserts all segments in database.

- [ ] **Step 1: Parse `segments` in `ConfirmBookingClient.tsx`**
  Extract `segments` from search params:
  ```ts
  const rawSegments = searchParams.get("segments");
  const segments: BookingSegment[] = rawSegments ? JSON.parse(rawSegments) : [];
  ```
  Fallback to single-slot behavior if `segments` is empty.

- [ ] **Step 2: Display Multi-Court Itinerary in Confirmation Card**
  If `segments.length > 1`:
  Render itinerary list showing each court, time range, and switch badges.
  Total price reflects all hours (`₱{rate.toFixed(2)}`).

- [ ] **Step 3: Update `submitConfirmBooking` in `actions.ts`**
  Accept `segments?: { courtId: string; courtName: string; start: string; end: string; hourlyRate: number }[]`.
  If multiple segments:
  - Check overlap for all segments.
  - Insert rows into `bookings` sharing the same `payment_reference`, `user_id`, and `booking_date`.
  - Return primary `bookingId` for confirmation redirect.

- [ ] **Step 4: Run type check & tests**
  `npx tsc --noEmit` and `npm run test`
  Expected: 0 errors, all tests pass

- [ ] **Step 5: Commit**
  ```bash
  git add src/app/confirm-booking/ConfirmBookingClient.tsx src/app/confirm-booking/actions.ts
  git commit -m "feat: support multi-segment bookings in confirm booking flow"
  ```

---

## Task 5: Booking Confirmation Receipt & Verification

**Files:**
- Modify: `src/app/book/confirmation/page.tsx`

**Interfaces:**
- Consumes: Booking record(s)
- Produces: Displays complete duration, court itinerary, and total ₱ amount on final confirmation receipt.

- [ ] **Step 1: Check for linked segments on confirmation page**
  If booking has linked segments (same customer, date, payment reference within consecutive hours), display the court breakdown on receipt.

- [ ] **Step 2: Run verification**
  Run: `npx tsc --noEmit`
  Run: `npm run test`
  Expected: 0 errors, all tests pass

- [ ] **Step 3: Commit**
  ```bash
  git add src/app/book/confirmation/page.tsx
  git commit -m "feat: show court jump itinerary on final booking confirmation receipt"
  ```

