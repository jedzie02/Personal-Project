# Landing Page Court Rally & Step Beam Animations Design

## 1. Intent & Why
Bring athletic motion to Paddlix's landing page (`src/app/page.tsx`) by combining a featured top-down animated pickleball court rally card in the Hero (Option A, Placement 1) with an animated 3-step progress beam and floating feature card icons in the lower sections (Option B).

## 2. Goals, Non-Goals, & Anti-Goals
- **Goals:**
  - Render a featured **Top-Down Pickleball Court Rally Card** (`src/components/booking/HeroCourtRally.tsx`) inside the hero section showing regulation court boundaries, kitchen lines, net, bounce ripples, and a rallying pickleball.
  - Animate the horizontal connecting track in *"Book a court in 3 simple steps"* (`src/app/page.tsx`) with a Matchpoint Blue-to-Emerald progress beam and sequential step badge pulses (`1 → 2 → 3`).
  - Add scroll-reveal (`animate-card-reveal`) and subtle icon float animations to the 4 *"Why players choose the Paddlix courts"* feature cards.
- **Non-Goals:**
  - Changing booking logic, database queries, or checkout flows.
- **Anti-Goals:**
  - Adding heavy external JS animation libraries (`framer-motion`) or ignoring `@media (prefers-reduced-motion: reduce)`.

## 3. Constraints
- Pure CSS `@keyframes` and inline SVG (`0 KB` third-party JS dependencies).
- Full Light Mode and Dark Mode visual clarity (`DESIGN.md` "Court Command" palette).
- Must disable continuous motion when `@media (prefers-reduced-motion: reduce)` is active.

## 4. Approaches Considered
1. **Approach 1 (Selected): Pure CSS `@keyframes` + Inline SVG**
   - Define GPU-accelerated keyframes (`court-line-draw`, `pickleball-rally`, `court-bounce-ring`, `step-beam-fill`, `step-node-2`, `step-node-3`, `icon-float`) in `src/app/globals.css` and apply them to `HeroCourtRally.tsx` and `src/app/page.tsx`.
2. **Approach 2: Third-Party JS Animation Library (`framer-motion`)**
   - Rejected due to ~35 KB bundle overhead and unnecessary client hydration on static landing sections.

## 5. Decided Behavior
- **Hero Court Placement (`User Selected — Placement 1`):** Featured visual court card inside the hero container (between the CTA buttons and the Next Open Slots strip) with no overlapping hero headline text, plus a caption badge (`4 Tournament-Spec Master Courts · Open Daily 9:00 AM – 11:00 PM`).
- **3-Step Progress Beam & Feature Cards (`User Selected — Option B`):** Animated blue-to-emerald progress beam connecting Steps 1, 2, and 3 with synchronized step badge highlights, plus subtle floating icon badges in the 4 feature cards.

## 6. Left to the Builder
- Exact keyframe timing curves (`2.6s` rally cycle, `3.6s` step beam cycle) and responsive scaling of the SVG court card on mobile screens.

