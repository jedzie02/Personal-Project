# Court Time-Range Pricing & Slot Price Display Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the hourly rate subtitle from `/book` court headers, display the resolved price for each court and hour inside every `Available` (and `Selected`) slot button, and upgrade the Admin → Courts "Edit Rate" modal to manage a Default Base Rate plus custom time-range pricing rules per court (with an optional "Apply to all courts" toggle).

**Architecture:** A pure utility module (`court-pricing.ts`) handles resolving a court's hourly rate for any `"HH:00"` slot from its base rate + `CourtPricingRule[]`, and serializes/deserializes rules via an invisible `<!--pricing_rules:[...]-->` metadata suffix in `courts.description` so zero SQL schema migrations are required. `booking-grid.service.ts` and `BookingGrid.tsx` pass `pricing_rules` to the grid and render `₱{slotRate}` inside each `Available`/`Selected` cell. `admin/courts/page.tsx` and `actions.ts` provide the Option A Time-Range Rules editor inside the "Edit Rate" modal.

**Tech Stack:** Next.js, React, TypeScript, Tailwind CSS, Supabase, Vitest

**Spec:** `docs/superpowers/specs/2026-11-19-court-time-range-pricing-and-slot-price-badge-design.md`

## Global Constraints

- Must work immediately against the existing live Supabase `public.courts` schema (`id, name, description, is_active, status, hourly_rate, created_at`) without requiring SQL table/column migrations.
- Must never leak raw `<!--pricing_rules:...-->` metadata tags into visible court descriptions on `/admin/courts` or edit forms.
- Keep `apps/dinksync`, root `src/`, and `apps/paddle-hub` synchronized.

## Review Focus

- Midnight end time (`"00:00"`): treated as hour `24` so a rule like `17:00` → `00:00` matches `17:00` through `23:00`.
- Overlapping rules on the same court: the last matching rule in `pricingRules` wins deterministically.
- Invalid or malformed rule JSON in `description`: gracefully ignored, falling back to `baseRate` and clean description text.
- Editing court name/description via `updateCourt`: preserves existing `pricingRules` metadata tag in `description`.
- Multi-hour cart selection spanning two price windows (e.g. `16:00` at base `₱200` and `17:00` at peak `₱350`): each slot carries its own resolved `hourlyRate` into `SelectedGridSlot`.

---

### Task 1: Court Time-Range Pricing Utility (`court-pricing.ts`)

**Files:**
- Create: `apps/dinksync/src/lib/utils/court-pricing.ts`
- Create: `apps/dinksync/src/lib/utils/court-pricing.test.ts`
- Create: `src/lib/utils/court-pricing.ts`
- Create: `src/lib/utils/court-pricing.test.ts`
- Create: `apps/paddle-hub/src/lib/utils/court-pricing.ts`
- Create: `apps/paddle-hub/src/lib/utils/court-pricing.test.ts`

**Interfaces:**
- Consumes: none
- Produces:
  - `export interface CourtPricingRule { startTime: string; endTime: string; rate: number }`
  - `export function resolveCourtHourRate(baseRate: number, rules: CourtPricingRule[] | undefined | null, hour: string): number`
  - `export function encodeDescriptionWithPricingRules(cleanDescription: string | null | undefined, rules: CourtPricingRule[] | undefined | null): string | null`
  - `export function decodeDescriptionAndPricingRules(rawDescription: string | null | undefined): { description: string | null; pricingRules: CourtPricingRule[] }`
  - `export function formatHourAMPM(timeStr: string): string`

- [ ] **Step 1: Write the failing test in `apps/dinksync/src/lib/utils/court-pricing.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import {
    resolveCourtHourRate,
    encodeDescriptionWithPricingRules,
    decodeDescriptionAndPricingRules,
    type CourtPricingRule,
} from "./court-pricing";

describe("court-pricing utilities", () => {
    const sampleRules: CourtPricingRule[] = [
        { startTime: "09:00", endTime: "16:00", rate: 200 },
        { startTime: "17:00", endTime: "00:00", rate: 350 },
    ];

    it("resolves matching time-range rule rate or falls back to baseRate", () => {
        expect(resolveCourtHourRate(250, sampleRules, "09:00")).toBe(200);
        expect(resolveCourtHourRate(250, sampleRules, "15:00")).toBe(200);
        // 16:00 is outside both ranges -> baseRate 250
        expect(resolveCourtHourRate(250, sampleRules, "16:00")).toBe(250);
        // 17:00 to 00:00 (midnight) -> 350
        expect(resolveCourtHourRate(250, sampleRules, "17:00")).toBe(350);
        expect(resolveCourtHourRate(250, sampleRules, "23:00")).toBe(350);
    });

    it("uses the last matching rule when rules overlap", () => {
        const overlapping: CourtPricingRule[] = [
            { startTime: "09:00", endTime: "22:00", rate: 250 },
            { startTime: "18:00", endTime: "21:00", rate: 400 },
        ];
        expect(resolveCourtHourRate(300, overlapping, "12:00")).toBe(250);
        expect(resolveCourtHourRate(300, overlapping, "18:00")).toBe(400);
        expect(resolveCourtHourRate(300, overlapping, "21:00")).toBe(250);
    });

    it("encodes and decodes pricing rules inside description without leaking metadata", () => {
        const encoded = encodeDescriptionWithPricingRules("Indoor pro surface", sampleRules);
        expect(encoded).toContain("Indoor pro surface");
        expect(encoded).toContain("<!--pricing_rules:");

        const decoded = decodeDescriptionAndPricingRules(encoded);
        expect(decoded.description).toBe("Indoor pro surface");
        expect(decoded.pricingRules).toEqual(sampleRules);
    });

    it("handles null description and malformed metadata gracefully", () => {
        const encodedNull = encodeDescriptionWithPricingRules(null, sampleRules);
        const decodedNull = decodeDescriptionAndPricingRules(encodedNull);
        expect(decodedNull.description).toBeNull();
        expect(decodedNull.pricingRules).toEqual(sampleRules);

        const decodedBroken = decodeDescriptionAndPricingRules("Court notes <!--pricing_rules:broken-->");
        expect(decodedBroken.description).toBe("Court notes");
        expect(decodedBroken.pricingRules).toEqual([]);
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run apps/dinksync/src/lib/utils/court-pricing.test.ts`
Expected: FAIL with "Cannot find module './court-pricing'"

- [ ] **Step 3: Implement `apps/dinksync/src/lib/utils/court-pricing.ts` and sync to `src/` and `apps/paddle-hub/`**

Implement `resolveCourtHourRate`, `encodeDescriptionWithPricingRules`, `decodeDescriptionAndPricingRules`, and `formatHourAMPM`. Sync both `.ts` and `.test.ts` across `apps/dinksync`, `src/`, and `apps/paddle-hub`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run apps/dinksync/src/lib/utils/court-pricing.test.ts src/lib/utils/court-pricing.test.ts apps/paddle-hub/src/lib/utils/court-pricing.test.ts`
Expected: PASS (12 passed)

- [ ] **Step 5: Commit**

```bash
git add apps/dinksync/src/lib/utils/court-pricing.ts apps/dinksync/src/lib/utils/court-pricing.test.ts src/lib/utils/court-pricing.ts src/lib/utils/court-pricing.test.ts apps/paddle-hub/src/lib/utils/court-pricing.ts apps/paddle-hub/src/lib/utils/court-pricing.test.ts
git commit -m "feat(pricing): add court time-range pricing resolution and metadata codec"
```

---

### Task 2: Booking Grid Header Cleanup & Per-Slot Price Display (`BookingGrid.tsx`, `booking-grid.service.ts`, `book/page.tsx`)

**Files:**
- Modify: `apps/dinksync/src/lib/services/booking-grid.service.ts`
- Modify: `apps/dinksync/src/app/book/page.tsx`
- Modify: `apps/dinksync/src/components/booking/BookingGrid.tsx`
- Modify: `apps/dinksync/src/components/booking/BookingGrid.test.tsx`
- Sync: `src/` and `apps/paddle-hub/` counterparts

**Interfaces:**
- Consumes: `CourtPricingRule`, `resolveCourtHourRate`, `decodeDescriptionAndPricingRules` from `@/lib/utils/court-pricing`
- Produces: Updated `BookingGridData` (with `pricing_rules?: CourtPricingRule[]` on `courts`) and `BookingGrid` rendering prices inside `Available` and `Selected` slot buttons instead of court headers.

- [ ] **Step 1: Update `apps/dinksync/src/components/booking/BookingGrid.test.tsx` with failing assertions**

Add a test in `BookingGrid.test.tsx` verifying:
1. Court headers do not render `/hr` (`expect(html).not.toContain("/hr")`).
2. `Available` buttons render the resolved slot price inside the cell (`₱200` for `09:00` and `₱350` for `10:00` when `pricing_rules` sets `10:00–11:00` to `350` and base rate is `200`).

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run apps/dinksync/src/components/booking/BookingGrid.test.tsx`
Expected: FAIL because headers still contain `₱300/hr` and `Available` buttons do not display `₱200` / `₱350`.

- [ ] **Step 3: Update `booking-grid.service.ts`, `book/page.tsx`, and `BookingGrid.tsx` (and sync to `src/` and `apps/paddle-hub/`)**

1. In `booking-grid.service.ts`:
   - Add `pricing_rules?: CourtPricingRule[]` to `BookingGridData["courts"][0]`.
   - Select `id, name, description, is_active, status, hourly_rate` from `courts`, decode `pricingRules` via `decodeDescriptionAndPricingRules(c.description).pricingRules`, and include `pricing_rules` on each court object.
2. In `book/page.tsx`:
   - Select `id, name, description, status, is_active, hourly_rate` from `courts`, decode `pricing_rules`, and include `pricing_rules` if passed to `gridData`.
3. In `BookingGrid.tsx`:
   - Remove the `{court.hourly_rate != null && (<span ...>₱{court.hourly_rate}/hr</span>)}` block from the court column header so only `<div>{court.name}</div>` (and any status badge) renders.
   - In `handleToggleSlot` and `ensureSlotSelected`, compute `const baseRate = selectedCourt?.hourly_rate != null ? Number(selectedCourt.hourly_rate) : PRICE_PER_HOUR;` and `const hourlyRate = resolveCourtHourRate(baseRate, selectedCourt?.pricing_rules, slot.hour);`.
   - In the cell loop, compute `const slotRate = resolveCourtHourRate(court.hourly_rate != null ? Number(court.hourly_rate) : PRICE_PER_HOUR, court.pricing_rules, hour);` and pass `slotRate={slotRate}` to `CellContent`.
   - In `CellContent` (`case "available"`), render the button with `flex-col`:
     - When `isSelected`:
       ```tsx
       <div className={cn("flex flex-col items-center justify-center font-bold text-white animate-in zoom-in-95 duration-150 leading-tight")}>
           <div className={cn("flex items-center", isCompact ? "gap-0.5 text-[11px]" : "gap-1 text-xs")}>
               <Check className={cn(isCompact ? "size-3 stroke-[3]" : "size-3.5 stroke-[3]")} />
               <span>Selected</span>
           </div>
           <span className={cn("font-semibold text-blue-100 tabular-nums mt-0.5", isCompact ? "text-[10px]" : "text-[11px]")}>
               ₱{slotRate}
           </span>
       </div>
       ```
     - When not selected:
       ```tsx
       <div className="flex flex-col items-center justify-center leading-tight">
           <span className={cn("font-semibold text-blue-600 dark:text-blue-400 capitalize group-hover/cell:text-white transition-colors duration-200", isCompact ? "text-xs" : "text-sm")}>
               Available
           </span>
           <span className={cn("font-semibold text-blue-500/80 dark:text-blue-300/90 group-hover/cell:text-blue-100 tabular-nums mt-0.5 transition-colors duration-200", isCompact ? "text-[10px]" : "text-[11px]")}>
               ₱{slotRate}
           </span>
       </div>
       ```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run apps/dinksync/src/components/booking/BookingGrid.test.tsx src/components/booking/BookingGrid.test.tsx apps/paddle-hub/src/components/booking/BookingGrid.test.tsx`
Expected: PASS (30 passed)

- [ ] **Step 5: Commit**

```bash
git add apps/dinksync/src/lib/services/booking-grid.service.ts apps/dinksync/src/app/book/page.tsx apps/dinksync/src/components/booking/BookingGrid.tsx apps/dinksync/src/components/booking/BookingGrid.test.tsx src/lib/services/booking-grid.service.ts src/app/book/page.tsx src/components/booking/BookingGrid.tsx src/components/booking/BookingGrid.test.tsx apps/paddle-hub/src/lib/services/booking-grid.service.ts apps/paddle-hub/src/app/book/page.tsx apps/paddle-hub/src/components/booking/BookingGrid.tsx apps/paddle-hub/src/components/booking/BookingGrid.test.tsx
git commit -m "feat(booking-grid): move court prices from headers into available slot buttons"
```

---

### Task 3: Admin Courts Time-Range Pricing Editor (`admin/courts/actions.ts`, `admin/courts/page.tsx`, `court.service.ts`)

**Files:**
- Modify: `apps/dinksync/src/lib/services/court.service.ts`
- Modify: `apps/dinksync/src/app/admin/courts/actions.ts`
- Modify: `apps/dinksync/src/app/admin/courts/actions.test.ts`
- Modify: `apps/dinksync/src/app/admin/courts/page.tsx`
- Modify: `apps/dinksync/src/app/admin/courts/page.test.tsx`
- Sync: `src/` and `apps/paddle-hub/` counterparts

**Interfaces:**
- Consumes: `CourtPricingRule`, `encodeDescriptionWithPricingRules`, `decodeDescriptionAndPricingRules`, `formatHourAMPM` from `@/lib/utils/court-pricing`
- Produces:
  - `updateCourtRateAction(courtId: string, hourlyRate: number, options?: { pricingRules?: CourtPricingRule[]; applyToAll?: boolean }): Promise<{ success: boolean; error?: string }>`
  - Updated `AdminCourtsPage` with Option A Time-Range Rules editor inside the "Edit Rate" modal.

- [ ] **Step 1: Write failing tests in `apps/dinksync/src/app/admin/courts/actions.test.ts` and `page.test.tsx`**

1. In `actions.test.ts`: Add test verifying `updateCourtRateAction` rejects invalid time-range rules (e.g. negative rule rate or `startTime >= endTime`).
2. In `page.test.tsx`: Add test verifying the court card renders decoded clean descriptions and custom time-range pricing badges when a court has encoded pricing rules in its description.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run apps/dinksync/src/app/admin/courts/actions.test.ts apps/dinksync/src/app/admin/courts/page.test.tsx`
Expected: FAIL

- [ ] **Step 3: Implement time-range support in `court.service.ts`, `admin/courts/actions.ts`, and `admin/courts/page.tsx` (and sync to `src/` and `apps/paddle-hub/`)**

1. In `court.service.ts`:
   - In `mapCourt`, use `decodeDescriptionAndPricingRules(row.description).description` so `court.description` is always clean.
   - In `updateCourt(id, name, description)`, read existing `description` from the court row first, extract its `pricingRules`, and re-encode `encodeDescriptionWithPricingRules(description?.trim() || null, pricingRules)` so editing a court's name/notes never wipes out its time-range pricing rules.
2. In `admin/courts/actions.ts`:
   - Extend `updateCourtRateAction(courtId, hourlyRate, options?: { pricingRules?: CourtPricingRule[]; applyToAll?: boolean })`:
     - Validate `hourlyRate` and each rule in `options?.pricingRules` (`Number.isFinite(rule.rate) && rule.rate >= 0`, and valid time interval where `startHour < endHour` with `"00:00"` treated as `24`).
     - Fetch current court(s) (`id, description`) to preserve clean description text, encode the updated `pricingRules` with `encodeDescriptionWithPricingRules`, and update `{ hourly_rate: hourlyRate, description: encodedDesc }`.
3. In `admin/courts/page.tsx`:
   - Decode `description` and `pricingRules` on load.
   - Display any configured custom time ranges under the Base Hourly Rate on each court card (e.g. `05:00 PM – 11:00 PM: ₱350/hr`).
   - In the **Edit Rate** modal, render:
     - **Default / Base Hourly Rate (PHP)** input.
     - **Custom Time Ranges** section with **"+ Add Time Range"** button, Start Time select (`06:00 AM`..`11:00 PM`), End Time select (`07:00 AM`..`12:00 AM`), Rate input (`₱`), and `✕` remove button.
     - Checkbox: *"Apply these rates to all courts"*.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run apps/dinksync/src/app/admin/courts/actions.test.ts apps/dinksync/src/app/admin/courts/page.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/dinksync/src/lib/services/court.service.ts apps/dinksync/src/app/admin/courts/actions.ts apps/dinksync/src/app/admin/courts/actions.test.ts apps/dinksync/src/app/admin/courts/page.tsx apps/dinksync/src/app/admin/courts/page.test.tsx src/lib/services/court.service.ts src/app/admin/courts/actions.ts src/app/admin/courts/actions.test.ts src/app/admin/courts/page.tsx src/app/admin/courts/page.test.tsx apps/paddle-hub/src/lib/services/court.service.ts apps/paddle-hub/src/app/admin/courts/actions.ts apps/paddle-hub/src/app/admin/courts/actions.test.ts apps/paddle-hub/src/app/admin/courts/page.tsx apps/paddle-hub/src/app/admin/courts/page.test.tsx
git commit -m "feat(admin-courts): add custom time-range pricing editor to Edit Rate modal"
```
