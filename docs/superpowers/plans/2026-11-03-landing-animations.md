# Landing Page Court Rally & Step Beam Animations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the Featured Top-Down Pickleball Court Rally Card in the landing hero (Option A, Placement 1) and the Animated 3-Step Progress Beam + Feature Card motion in the lower sections (Option B) using pure CSS `@keyframes` and inline SVG.

**Architecture:** CSS `@keyframes` and utility classes (`animate-court-line`, `animate-pickleball-rally`, `animate-bounce-ring`, `animate- bounce-ring-delayed`, `animate-step-beam`, `animate-step-node-2`, `animate-step-node-3`, `animate-icon-float`) live in `src/app/globals.css` with a `@media (prefers-reduced-motion: reduce)` override. `src/components/booking/HeroCourtRally.tsx` renders the responsive top-down SVG court card, and `src/app/page.tsx` embeds `HeroCourtRally` in the hero and applies the step-beam and card animations.

**Tech Stack:** Next.js 16 (Server Components), TypeScript, Tailwind CSS, CSS `@keyframes`.

**Spec:** `docs/superpowers/specs/2026-11-03-landing-animations-design.md`

## Global Constraints

- Follow `DESIGN.md` "Court Command" tokens (`#2563eb` Matchpoint Blue, `#059669` Court Turf Emerald, crisp slate surfaces) with full Light Mode and Dark Mode support.
- Zero external JS animation libraries (`0 KB` bundle overhead).
- Respect `@media (prefers-reduced-motion: reduce)` by disabling continuous keyframe animations in `src/app/globals.css`.
- Minimum font size `text-xs` (12px) across all badges and captions (Impeccable craft-floor compliance).

## Review Focus

1. **`prefers-reduced-motion: reduce` compliance:** All newly added `.animate-*` classes in `src/app/globals.css` must be included in the `@media (prefers-reduced-motion: reduce)` block so motion-sensitive users see a clean static court and step bar.
2. **Mobile viewport overflow on `HeroCourtRally`:** The SVG court (`viewBox="0 0 260 104"`) must use `w-full max-w-[280px] sm:max-w-[320px] h-auto` so it scales down cleanly on 320px mobile screens without horizontal scroll.
3. **Light and Dark Mode contrast on the 3-Step Nodes:** Step badges 1, 2, and 3 in `src/app/page.tsx` must remain legible in both Light Mode (`bg-white`) and Dark Mode (`dark:bg-slate-900`) throughout the animation cycle.
4. **Decorative SVG accessibility:** The animated SVG court in `HeroCourtRally.tsx` must carry `aria-hidden="true"` so screen readers read the semantic caption rather than raw SVG elements.
5. **No minimum text-size violations:** All labels in `HeroCourtRally.tsx` must use `text-xs` or larger (never `text-[10px]` or `text-[11px]`).

---

### Task 1: CSS Keyframes, `HeroCourtRally` Component & Landing Page Integration

**Files:**
- Modify: `src/app/globals.css`
- Create: `src/components/booking/HeroCourtRally.tsx`
- Modify: `src/app/page.tsx`

**Interfaces:**
- Produces: `HeroCourtRally` default export (`src/components/booking/HeroCourtRally.tsx`)

- [ ] **Step 1: Add court rally, step beam, and icon float keyframes + reduced-motion rules to `src/app/globals.css`**

In `src/app/globals.css`, add keyframes and helper classes:
- `@keyframes court-line-draw` (`stroke-dashoffset: 640 -> 0`) + `.animate-court-line`
- `@keyframes pickleball-rally` (4-point rally path across `(35px, 38px) -> (130px, 28px) -> (225px, 64px) -> (130px, 52px) -> (35px, 38px)`) + `.animate-pickleball-rally`
- `@keyframes court-bounce-ring` + `.animate-bounce-ring` and `.animate-bounce-ring-delayed` (`animation-delay: 1.3s`)
- `@keyframes step-beam-fill` (`width: 0% -> 50% -> 100%`) + `.animate-step-beam`
- `@keyframes step-node-pulse` + `.animate-step-node-2` and `.animate-step-node-3`
- `@keyframes icon-float` (`translateY(0) -> translateY(-4px) -> translateY(0)`) + `.animate-icon-float`
- Include all new `.animate-*` classes inside `@media (prefers-reduced-motion: reduce)`.

- [ ] **Step 2: Create `src/components/booking/HeroCourtRally.tsx`**

Create `src/components/booking/HeroCourtRally.tsx` rendering the Featured Court Card (Placement 1):
- Outer card container: `animate-hero-rise mx-auto w-full max-w-md rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/90 p-3.5 sm:p-4 shadow-xs`
- Responsive inline SVG (`viewBox="0 0 260 104"`, `className="w-full max-w-[280px] sm:max-w-[320px] h-auto mx-auto rounded-xl border-2 border-blue-600/80 dark:border-blue-500/80 bg-blue-950 shadow-sm"`, `aria-hidden="true"`) with outer court rectangle (`.animate-court-line`), kitchen non-volley zone, service lines, dashed net line, two bounce rings (`.animate-bounce-ring`, `.animate-bounce-ring-delayed`), and the rallying pickleball group (`.animate-pickleball-rally`).
- Bottom caption row with `text-xs font-semibold text-slate-600 dark:text-slate-300`: `"4 Tournament-Spec Master Courts · Open Daily 9:00 AM – 11:00 PM"`.

- [ ] **Step 3: Integrate `HeroCourtRally` and the 3-Step Progress Beam + Feature Card animations in `src/app/page.tsx`**

In `src/app/page.tsx`:
1. Import and render `<HeroCourtRally />` inside the Hero section right between the primary CTA buttons and `<HeroQuickSlots />`.
2. In the *"Book a court in 3 simple steps"* section, upgrade the desktop connecting line (`hidden sm:block absolute top-6 left-[18%] right-[18%] h-[3px] bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden -z-0`) to include an inner animated progress beam (`<div className="h-full bg-gradient-to-r from-blue-600 via-blue-500 to-emerald-500 animate-step-beam rounded-full" />`), and apply subtle synchronized pulse classes to step circles 1, 2, and 3.
3. In the *"Why players choose the Paddlix courts"* section, add `animate-card-reveal` to each feature card and `animate-icon-float` to the icon badge container.

- [ ] **Step 4: Run Vitest and TypeScript verification**

Run: `npx vitest run ; npx tsc --noEmit`
Expected: All 33 unit tests pass and 0 TypeScript errors.

