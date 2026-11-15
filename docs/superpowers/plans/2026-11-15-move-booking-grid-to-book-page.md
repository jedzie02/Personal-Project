# Dedicated `/book` Page & Static Homepage Hero Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the 3-step booking guide and the court booking schedule grid from the homepage to a dedicated `/book` page, make the homepage hero static without skeleton flashing, and link quick slots directly to `/book`.

**Architecture:** Convert `src/app/book/page.tsx` from a redirect stub into a full Server Component page that renders `Navbar`, "Book a court in 3 simple steps", court overview badges, `DateSelector`, and `BookingGrid`. Remove the 3-step guide and `#book-a-court` schedule section from `src/app/(public)/page.tsx`. Update `HeroQuickSlots` to route to `/book?date=...&selectCourt=...&selectHour=...`. Update `Navbar.tsx` "Book Court" links to `/book`. Optimize `src/app/(public)/loading.tsx` to render the static hero without grey skeleton boxes.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS, Supabase, Vitest.

**Spec:** `docs/superpowers/specs/2026-11-15-move-booking-grid-to-book-page-design.md`

## Global Constraints

- Retain all query parameters support on `/book`: `date`, `selectCourt`, `selectHour`, `error`.
- Retain all single-court and 4-court responsive layout behavior in `BookingGrid`.
- Ensure all automated tests pass (`npm test -- --run`).
- Maintain ponytail mode: minimal diffs, reuse existing components, concise explanations.

## Review Focus

1. **Direct navigation:** Going to `/book` loads today's booking grid with the 3-step guide at the top.
2. **Quick slot deep linking:** Clicking a quick slot from the homepage lands on `/book` with that court and hour pre-selected in the cart.
3. **Date switching on `/book`:** Selecting another date in `DateSelector` updates the grid without breaking the URL or layout.
4. **Static homepage hero:** Loading the homepage does not show grey placeholder rectangles across the navbar or hero section.
5. **Navbar routing:** Clicking "Book Court" in the navbar routes to `/book` across desktop and mobile menus.

---

### Task 1: Implement the dedicated `/book` page and test

**Files:**
- Modify: `src/app/book/page.tsx`
- Create: `src/app/book/page.test.tsx`

**Interfaces:**
- Consumes: `getBookingGridForDate(date)` from `@/lib/services/booking-grid.service`, `createClient()` from `@/lib/supabase/server`, `getManilaNow()` from `@/lib/utils/date`.
- Produces: Dedicated page at `/book` with the 3-step guide, court overview badges, `DateSelector`, and `BookingGrid`.

- [x] **Step 1: Write the failing test in `src/app/book/page.test.tsx`**
- [x] **Step 2: Run test to verify it fails**
- [x] **Step 3: Implement `BookPage` in `src/app/book/page.tsx`**
- [x] **Step 4: Run test to verify it passes**

---

### Task 2: Update Homepage, Hero Quick Slots, and Navbar

- [x] **Step 1: Update `HeroQuickSlots.tsx`**
- [x] **Step 2: Update `src/app/(public)/page.tsx`**
- [x] **Step 3: Update `src/components/Navbar.tsx`**
- [x] **Step 4: Verify with vitest**

---

### Task 3: Streamline Homepage Loading and Update Book Loading

- [x] **Step 1: Update `src/app/(public)/loading.tsx`**
- [x] **Step 2: Update `src/app/book/loading.tsx`**
- [x] **Step 3: Update `src/app/(public)/loading.test.tsx`**
- [x] **Step 4: Run `src/app/(public)/loading.test.tsx`**

---

### Task 4: Full test suite verification

- [x] **Step 1: Run complete test suite**

Run: `npm test -- --run`  
Expected: All tests pass with 0 failures across all test files.
