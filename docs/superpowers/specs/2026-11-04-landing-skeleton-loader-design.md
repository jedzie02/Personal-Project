# Landing Page Skeleton Loader Design

## Intent & Why
The landing page hero section was recently redesigned into a 2-column responsive layout featuring a live court simulator (`HeroCourtRally`) and a quick-slot availability bar (`HeroQuickSlots`). However, `src/app/(public)/loading.tsx` still renders the old single-column centered hero placeholder, causing a noticeable layout jump (Cumulative Layout Shift) when the page finishes loading. Updating the loading skeleton ensures a seamless, visually stable loading experience.

## Goals, Non-Goals, & Anti-Goals
- **Goals:**
  - Update `src/app/(public)/loading.tsx` to mirror the responsive 2-column split hero layout in `src/app/(public)/page.tsx`.
  - Add a dedicated court simulator placeholder card with static SVG court wireframe lines matching `HeroCourtRally.tsx`.
  - Add a full-width quick slots placeholder row beneath the split hero matching `HeroQuickSlots.tsx`.
  - Maintain the existing sticky navbar, date selector, and booking grid skeletons.
- **Non-Goals:**
  - Modifying `page.tsx`, `HeroCourtRally.tsx`, or `BookingGridSkeleton.tsx`.
  - Altering backend data fetching or server components.
- **Anti-Goals:**
  - Introducing heavy animations or interactive scripts in `loading.tsx` that degrade loading performance.
  - Adding unnecessary wrapper components or dependencies.

## Constraints
- Next.js App Router streaming conventions: `loading.tsx` is an async-boundary fallback; it must remain pure server-rendered UI without client state.
- Tailored for Tailwind CSS and standard dark slate theme (`bg-slate-950`, `text-slate-100`).

## Approaches Considered
1. **High-Fidelity Inlined Skeleton in `loading.tsx` (Selected):**
   - Update `loading.tsx` directly to render the split 2-column hero, static court wireframe SVG, and quick-slot bar.
   - *Tradeoffs:* Zero layout shift (CLS = 0), self-contained, no extra component files.
2. **Dedicated `HeroCourtRallySkeleton` Component:**
   - Create a separate file `src/components/booking/HeroCourtRallySkeleton.tsx` and import it.
   - *Tradeoffs:* Adds file sprawl for a component only consumed by `loading.tsx`.
3. **Simplified Neutral Card Skeleton:**
   - Generic pulsing rectangle without SVG court lines.
   - *Tradeoffs:* Less code, but fails the user's requirement to visually match the live court simulator.

*Selection:* The user selected **Approach 1** to get a 1:1 match with zero layout shift while keeping the implementation self-contained.

## The Decided "How"
1. **Container & Hero Section:**
   - Keep `<main className="flex-1 flex flex-col">`.
   - Update Hero `<section>` to match `page.tsx`:
     - Outer container: `max-w-6xl mx-auto w-full space-y-8 sm:space-y-10`.
     - 2-Column Grid: `grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center`.
2. **Left Column (`lg:col-span-6`):**
   - Live badge pill: `h-7 w-64 rounded-full bg-emerald-950/50 border border-emerald-900/60`.
   - Title lines: 2-3 skeleton bars simulating the large heading.
   - Subtext lines: 2 skeleton bars simulating description.
   - Dual buttons: two `h-12 w-36 rounded-full` skeletons for "Book a Court" and "Learn More".
   - Bullet items: small text skeleton row with bullet separators.
3. **Right Column (`lg:col-span-6`):**
   - Card container: `w-full max-w-lg lg:max-w-xl rounded-3xl border border-slate-800 bg-slate-900/90 p-5 sm:p-6 lg:p-7 shadow-xl`.
   - Card Header: status dot + title placeholder on left; "Tournament Spec" pill placeholder on right.
   - Court SVG wireframe: static 260x144 viewBox matching `HeroCourtRally` dimensions and lines (outer court `rect`, kitchen / non-volley zone `rect`, center court dashed net `line`, and service centerline), using muted blues and soft opacity.
   - Card Footer: text bar placeholder representing "4 Tournament-Spec Master Courts".
4. **Quick Slots Row (Full-width below split hero):**
   - Container matching `HeroQuickSlots` width with 3–4 horizontal card pill skeletons.
5. **Existing Booking Section:**
   - Retain DateSelector and `BookingGridSkeleton` exactly as they are.

## What's Left to the Builder
- Precise Tailwind class alignment with `HeroCourtRally.tsx` and `page.tsx` for 100% layout fidelity.
- Verifying responsive behavior (stacked on mobile, 2-column on desktop).

