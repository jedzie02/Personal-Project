# Landing Page Skeleton Loader Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update the landing page skeleton loader (`src/app/(public)/loading.tsx`) to mirror the responsive 2-column hero layout with the live court simulator and quick-slot bar.

**Architecture:** Replace the outdated centered hero skeleton in `loading.tsx` with a responsive 2-column desktop grid (`lg:grid-cols-12`), embedding an SVG wireframe of the pickleball court inside a dedicated simulator card and adding a quick-slots placeholder strip, eliminating layout shift against `page.tsx`.

**Tech Stack:** Next.js 16 (App Router), React 19, Tailwind CSS v4, Lucide React, Vitest.

**Spec:** [`docs/superpowers/specs/2026-11-04-landing-skeleton-loader-design.md`](file:///c:/Users/jedrik/Projects/pickle-wb/docs/superpowers/specs/2026-11-04-landing-skeleton-loader-design.md)

## Global Constraints
- Next.js streaming boundary: `src/app/(public)/loading.tsx` must remain a pure server-rendered component with no client-side hooks.
- Styling must use Tailwind dark slate palette (`bg-slate-950`, `border-slate-800`, `text-slate-100`).
- No changes to existing production components (`page.tsx`, `HeroCourtRally.tsx`, `BookingGridSkeleton.tsx`).

## Review Focus
- **Mobile responsiveness:** The 2-column desktop grid (`lg:grid-cols-12`) must stack gracefully into a single column (`grid-cols-1`) on mobile screens without overflowing.
- **Simulator card aspect ratio:** The SVG court wireframe must preserve the 260:144 aspect ratio and match `HeroCourtRally` dimensions.
- **Booking grid continuity:** The date selector and `BookingGridSkeleton` must remain intact at the bottom of the page.
- **Dark mode theme consistency:** Background gradients and border colors must align with `page.tsx` styling.
- **Zero layout shift (CLS):** Heights and padding of the skeleton containers must match their corresponding live components.

---

### Task 1: Update Landing Page Loading Skeleton

**Files:**
- Modify: `src/app/(public)/loading.tsx`
- Test: `src/app/(public)/loading.test.tsx`

**Interfaces:**
- Consumes: `@/components/ui/skeleton` (`Skeleton`), `@/components/booking/BookingGridSkeleton` (`BookingGridSkeleton`)
- Produces: `export default function LandingLoading(): JSX.Element`

- [ ] **Step 1: Write the test verifying the updated skeleton structure**

Create `src/app/(public)/loading.test.tsx`:
```tsx
import { describe, it, expect } from "vitest";
import LandingLoading from "./loading";

describe("LandingLoading", () => {
    it("renders the 2-column split hero layout and court wireframe", () => {
        const tree = LandingLoading();
        expect(tree).toBeDefined();

        // Convert JSX tree to JSON/string representation to assert key structural classes and elements
        const json = JSON.stringify(tree);

        // Must contain 2-column desktop grid
        expect(json).toContain("lg:grid-cols-12");

        // Must contain the simulator card container
        expect(json).toContain("rounded-3xl");

        // Must contain court simulator wireframe SVG with 260 144 viewBox
        expect(json).toContain("0 0 260 144");

        // Must retain booking section skeleton
        expect(json).toContain("BookingGridSkeleton");
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/app/\(public\)/loading.test.tsx --run`
Expected: FAIL with missing classes/elements (e.g., `lg:grid-cols-12` or `0 0 260 144` not found).

- [ ] **Step 3: Implement updated skeleton in `src/app/(public)/loading.tsx`**

Update `src/app/(public)/loading.tsx`:
- Convert hero `<section>` to 2-column desktop grid (`grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12`).
- Left column (`lg:col-span-6`):
  - Emerald status badge pill skeleton (`bg-emerald-950/50 border border-emerald-900/60`).
  - Heading lines skeleton.
  - Subtext lines skeleton.
  - Dual action button skeletons ("Book a Court" and "Learn More").
  - 3-item feature bullets skeleton.
- Right column (`lg:col-span-6`):
  - Card container matching `HeroCourtRally` dimensions (`w-full max-w-lg lg:max-w-xl rounded-3xl border border-slate-800 bg-slate-900/90 p-5 sm:p-6 lg:p-7 shadow-xl`).
  - Header: Live Court Simulator label + Tournament Spec pill skeleton.
  - Static court SVG wireframe (viewBox `0 0 260 144`) with outer court, kitchen zone, centerline, and dashed net.
  - Footer: "4 Tournament-Spec Master Courts" line skeleton.
- Quick slots placeholder row below split hero:
  - Container with header and 4 quick slot card skeletons.
- Retain existing date selector and `BookingGridSkeleton`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/app/\(public\)/loading.test.tsx --run`
Expected: PASS.

- [ ] **Step 5: Run full test suite to verify no regressions**

Run: `npm test -- --run`
Expected: All tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/app/\(public\)/loading.tsx src/app/\(public\)/loading.test.tsx docs/superpowers/
git commit -m "feat(landing): update skeleton loader to match live court simulator hero layout"
```

