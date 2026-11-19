# Court Time-Range Pricing & Slot Price Display — Design Doc

**Date:** 2026-11-19  
**Size:** Small change  
**Target Files:**
- `apps/dinksync/src/lib/utils/court-pricing.ts` (and `src/`, `apps/paddle-hub/`, `packages/core/`)
- `apps/dinksync/src/components/booking/BookingGrid.tsx`
- `apps/dinksync/src/lib/services/booking-grid.service.ts`
- `apps/dinksync/src/app/book/page.tsx`
- `apps/dinksync/src/app/admin/courts/page.tsx`
- `apps/dinksync/src/app/admin/courts/actions.ts`

## 1. Intent & Why
1. Clean up the `/book` column headers so they show only the court name (`COURT 1`, `COURT 2`, etc.) without a price subtitle under the header.
2. Show the exact price for each 1-hour slot right inside the **Available** (and **Selected**) slot button (`Available` with `₱250` underneath), so players immediately see the rate for that specific court and time.
3. Let admins configure custom time-range prices per court (Option A) inside the existing **"Edit Rate"** modal in **Admin → Courts**, with a Default/Base Rate plus custom time windows (`Start Time` → `End Time` = `₱ Rate`) and an optional *"Apply these rates to all courts"* checkbox.

## 2. Goals, Non-Goals, Anti-Goals
- **Goals:**
  - Remove `₱{court.hourly_rate}/hr` from the court header row in `BookingGrid.tsx`.
  - Render the resolved hourly price (`₱{slotRate}`) inside each `Available` and `Selected` button in `BookingGrid.tsx`.
  - Use the resolved slot rate when adding slots to the cart (`handleToggleSlot` and `ensureSlotSelected`) so multi-hour bookings across different price windows sum each hour's exact rate.
  - Upgrade the **Edit Rate** modal in `admin/courts/page.tsx` to edit the Base Hourly Rate and a list of Custom Time Ranges (`startTime`, `endTime`, `rate`), plus an *"Apply these rates to all courts"* toggle.
- **Non-Goals:** Changing Open Play pricing (which already has its own per-session `price_per_player`).
- **Anti-Goals:** Requiring the user to run a new database table migration before saving rates works, or leaking raw metadata tags into visible court descriptions.

## 3. Constraints
- Must work immediately against the existing live Supabase `public.courts` schema (`id, name, description, is_active, status, hourly_rate, created_at`).
- Must stay synchronized across `apps/dinksync`, root `src/`, and `apps/paddle-hub`.

## 4. Approaches Considered
1. **Approach 1 (Selected): Zero-SQL-Migration Resilient Storage on `public.courts`** — Store the base rate in `courts.hourly_rate` and serialize custom time-range rules (`CourtPricingRule[]`) via a lightweight metadata suffix (`<!--pricing_rules:[...]-->`) in `courts.description` (cleanly stripped whenever `description` is displayed or edited in Admin). Works immediately on the live Supabase database with zero schema errors and zero extra queries.
2. **Approach 2: Separate `court_pricing_rules` Table** — Rejected because it requires manual SQL table creation and RLS policies before the feature can function on the live database.

## 5. Decision Details
- **Rule Shape (`CourtPricingRule`):** `{ startTime: string; endTime: string; rate: number }` where `startTime` is `"06:00"`..`"23:00"` and `endTime` is `"07:00"`..`"23:00"` or `"00:00"` (midnight, treated as hour `24`).
- **Rate Resolution (`resolveCourtHourRate(baseRate, rules, hour)`):** Parses `hour` (`"HH:00"`). If a rule in `rules` covers `hour` (`startHour <= hour < endHour`), returns that rule's `rate` (last matching rule wins if ranges overlap); otherwise returns `baseRate`.
- **Booking Grid UI (`BookingGrid.tsx`):**
  - Remove the `₱{court.hourly_rate}/hr` `<span>` from the court column header.
  - Pass the resolved `slotRate` into `CellContent` for each `(court, hour)` cell.
  - Inside `CellContent` (`case "available"`), render a stacked two-line layout (`flex-col`):
    - Unselected: `Available` on top, `₱{slotRate}` below (`text-[10px]` / `text-[11px] font-semibold tabular-nums`).
    - Selected: `✓ Selected` on top, `₱{slotRate}` below.
- **Admin UI (`admin/courts/page.tsx` & `actions.ts`):**
  - On each court card, show the Base Hourly Rate and any active custom time ranges (e.g. `05:00 PM – 11:00 PM: ₱350/hr`).
  - In the **Edit Rate** modal, let the admin edit Base Rate, add/edit/remove Custom Time Ranges (`Start Time`, `End Time`, `Rate`), and optionally check *"Apply these rates to all courts"*.

## 6. Left to the Builder
- Unit tests for `court-pricing.ts` (`resolveCourtHourRate`, `encodeDescriptionWithPricingRules`, `decodeDescriptionAndPricingRules`) and updated `BookingGrid.test.tsx` assertions.
