# Multi-Court & Multi-Slot Booking ("Shopping Cart" Selection) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow players and event organizers to select multiple courts at the same time (e.g. Court 1 & Court 2 at 09:00–10:00 AM) or across different hours with a multi-select grid and floating cart checkout bar.

**Architecture:** Clicking available cells directly toggles selection into a client-side cart (`selectedSlots`). A responsive floating cart drawer slides up displaying selected slots, total cost (₱300/hr), and a checkout CTA that serializes all selections into `BookingSegment[]` and passes them to the existing multi-segment booking action (`submitConfirmBooking`).

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, Lucide icons, Vitest.

**Spec:** [`docs/superpowers/specs/2026-11-02-multi-court-selection-design.md`](file:///c:/Users/jedrik/Projects/pickle-wb/docs/superpowers/specs/2026-11-02-multi-court-selection-design.md)

## Global Constraints
- **Pricing**: Strictly ₱300/hour per court slot.
- **Operating Hours**: Strictly 09:00 AM to 11:00 PM (23:00); no slot past 23:00.
- **No Database Schema Changes**: Discrete rows in `bookings` sharing `payment_reference` block individual courts natively.
- **Verification Rule**: Verify using `npx tsc --noEmit` and `npm run test` (never `npm run build` due to sandbox network constraints).

## Review Focus
1. Toggling the same slot twice properly deselects it without leaving orphaned items in the cart.
2. Selecting parallel courts for the exact same hour (e.g. Court 1 & Court 2 at 09:00 AM) groups and calculates total price correctly (2 × ₱300 = ₱600).
3. Max slot threshold (e.g. 8 slots) prevents abusive bulk selections.
4. Unauthenticated users who select multiple slots and click "Review & Book" have their cart preserved in `sessionStorage` through signup/login.
5. Clearing the cart resets the selection state and smoothly dismisses the floating cart bar.

---

### Task 1: Cart Utility & Unit Tests

**Files:**
- Create: `src/lib/utils/cart.ts`
- Test: `src/lib/utils/cart.test.ts`

- [ ] **Step 1: Write failing unit tests in `src/lib/utils/cart.test.ts`**
  - Test `toggleCartSlot`: adds unselected slot, removes already-selected slot, enforces max 8 slots limit.
  - Test `calculateCartTotal`: multiplies slot count by rate (default ₱300).
  - Test `sortCartSlots`: sorts by hour ascending, then court name.
  - Test `convertCartToSegments`: converts `SelectedGridSlot[]` to `BookingSegment[]` compatible with `submitConfirmBooking`.

- [ ] **Step 2: Run tests to confirm failure**
  - Run: `npm run test`

- [ ] **Step 3: Implement `src/lib/utils/cart.ts`**
  - Export interface `SelectedGridSlot { courtId: string; courtName: string; hour: string; endHour: string; hourlyRate: number; }`
  - Implement `toggleCartSlot(current: SelectedGridSlot[], item: SelectedGridSlot, max = 8): SelectedGridSlot[]`
  - Implement `calculateCartTotal(slots: SelectedGridSlot[]): number`
  - Implement `sortCartSlots(slots: SelectedGridSlot[]): SelectedGridSlot[]`
  - Implement `convertCartToSegments(slots: SelectedGridSlot[]): BookingSegment[]`

- [ ] **Step 4: Verify test passes**
  - Run: `npm run test`
  - Verify: All tests pass.

---

### Task 2: Multi-Select Interaction & Cell Highlighting in `BookingGrid.tsx`

**Files:**
- Modify: `src/components/booking/BookingGrid.tsx`

- [ ] **Step 1: Add `selectedSlots` state & toggle handler**
  - Import `toggleCartSlot`, `SelectedGridSlot`, `calculateCartTotal` from `@/lib/utils/cart`.
  - Add state `const [selectedSlots, setSelectedSlots] = useState<SelectedGridSlot[]>([]);`
  - Handle slot toggle on `onSelectSlot`: if user clicks an available slot, toggle it in `selectedSlots`.

- [ ] **Step 2: Update `CellContent` rendering for selected slots**
  - Pass `isSelected` prop to `CellContent`.
  - When `cell.status === "available"`:
    - If `isSelected`: render cell with active blue background (`bg-blue-600 text-white shadow-xs`), checkmark icon (`Check`), and court rate badge.
    - If not selected: render normal available cell (`bg-blue-50/50 hover:bg-blue-500 ...`).

- [ ] **Step 3: Restore pending cart on login return**
  - In `useEffect`, restore `paddlix_pending_cart` from `sessionStorage` if date matches.

- [ ] **Step 4: Verify with TypeScript**
  - Run: `npx tsc --noEmit`

---

### Task 3: Floating Bottom Cart Drawer

**Files:**
- Modify: `src/components/booking/BookingGrid.tsx`

- [ ] **Step 1: Build responsive floating cart bar**
  - Render a fixed bottom drawer when `selectedSlots.length > 0`:
    - Responsive floating pill/bar container with backdrop blur, shadow-2xl, and border.
    - Left side: Slot count badge (e.g. `2 Courts Selected`), scrollable pill list of selected courts & times (e.g. `Court 1 (9–10 AM)`, `Court 2 (9–10 AM)`).
    - Right side: Total price display (`₱600.00`), `Clear` button (clears `selectedSlots`), and primary CTA button `Review & Book (N) →`.

- [ ] **Step 2: Connect CTA action**
  - When logged in: sort slots, convert to `BookingSegment[]`, serialize into URL parameters (`segments`, `rate`, `date`), and navigate to `/confirm-booking`.
  - When not logged in: persist `paddlix_pending_cart` in `sessionStorage` and route to `/login`.

- [ ] **Step 3: Verify with TypeScript and Vitest**
  - Run: `npx tsc --noEmit`
  - Run: `npm run test`

---

### Task 4: Multi-Court Confirmation UI Polish & Verification

**Files:**
- Modify: `src/app/confirm-booking/ConfirmBookingClient.tsx`

- [ ] **Step 1: Enhance `ConfirmBookingClient.tsx` for parallel & multi-slot review**
  - Detect parallel same-hour bookings (e.g., both Court 1 and Court 2 booked from 9:00 AM to 10:00 AM).
  - Present an itemized breakdown card showing each court and time slot cleanly with its individual fee (₱300).
  - Display total court-hours and grand total.

- [ ] **Step 2: Full End-to-End Verification**
  - Run: `npm run test` (must pass 100%).
  - Run: `npx tsc --noEmit` (must have 0 errors).

