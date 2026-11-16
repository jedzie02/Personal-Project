# Dedicated Open Play Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a dedicated `/open-play` page with skeleton loading, remove Open Play from the homepage, and update all navbar and grid navigation to route to `/open-play`.

**Architecture:** Create `src/app/open-play/page.tsx` as a Server Component fetching `listUpcomingSessions()` and `src/app/open-play/loading.tsx` as its skeleton. Remove `listUpcomingSessions()` and `OpenPlaySection` from `src/app/(public)/page.tsx`. Update `Navbar.tsx` and `BookingGrid.tsx` to link to `/open-play`.

**Tech Stack:** Next.js (App Router, Server Components), TypeScript, Tailwind CSS, Lucide React, Vitest.

**Spec:** [docs/superpowers/specs/2026-11-16-dedicated-open-play-page-design.md](file:///c:/Users/jedrik/Projects/pickle-wb/docs/superpowers/specs/2026-11-16-dedicated-open-play-page-design.md)

## Global Constraints
- Strictly operate in ponytail mode (full): minimal diffs, zero unnecessary dependencies, clean TypeScript types.
- 100% type-safe with clean `npx tsc --noEmit`.
- All automated tests must pass (`npm test -- --run`).

## Review Focus
- The new `/open-play` page must handle both the empty state (no sessions scheduled) and populated state (active sessions) without crashing.
- Removing `OpenPlaySection` from the homepage must not break any other landing page elements or cause layout regressions.
- Navbar highlighting must accurately switch to "Open Play" when navigating to `/open-play` on both desktop and mobile dropdown.
- Booking grid open play slot clicks must direct to `/open-play` instead of the old hash anchor `/#open-play`.

---

### Task 1: Create Dedicated `/open-play` Page & Loading State

**Files:**
- Create: `src/app/open-play/page.tsx`
- Create: `src/app/open-play/loading.tsx`
- Create: `src/app/open-play/page.test.tsx`
- Modify: `src/components/booking/OpenPlaySection.tsx`

**Interfaces:**
- Consumes: `listUpcomingSessions` from `@/lib/services/open-play.service`, `Navbar` from `@/components/Navbar`, `OpenPlaySection` from `@/components/booking/OpenPlaySection`.
- Produces: Server-rendered `/open-play` route and fallback skeleton.

- [ ] **Step 1: Write the failing unit test**

Create `src/app/open-play/page.test.tsx`:
```tsx
import { describe, it, expect, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import OpenPlayPage from "./page";

vi.mock("@/lib/services/open-play.service", () => ({
    listUpcomingSessions: vi.fn().mockResolvedValue([
        {
            id: "session-1",
            courtId: "c1",
            courtName: "Court 1",
            date: "2099-01-01",
            startTime: "18:00",
            endTime: "20:00",
            pricePerPlayer: 150,
            playerCap: 8,
            spotsLeft: 5,
            status: "scheduled",
        },
    ]),
}));

vi.mock("@/components/Navbar", () => ({
    Navbar: () => <nav data-testid="navbar">Navbar</nav>,
}));

vi.mock("@/components/booking/JoinOpenPlayButton", () => ({
    default: () => <button>Join</button>,
}));

describe("OpenPlayPage", () => {
    it("renders the Open Play page with header and session cards", async () => {
        const jsx = await OpenPlayPage();
        const html = renderToStaticMarkup(jsx);
        expect(html).toContain("Open Play Sessions");
        expect(html).toContain("Court 1");
        expect(html).toContain("₱150");
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/app/open-play/page.test.tsx`
Expected: FAIL (Cannot find module './page')

- [ ] **Step 3: Implement `src/app/open-play/page.tsx` and `src/app/open-play/loading.tsx`**

1. In `src/app/open-play/page.tsx`:
   - Async server component.
   - Set `export const revalidate = 10;`.
   - Call `listUpcomingSessions()` with graceful try/catch fallback.
   - Render page wrapper with `<Navbar />`, `<OpenPlaySection sessions={sessions} />`, and footer.
2. In `src/app/open-play/loading.tsx`:
   - Skeleton with header pill, title, subtitle, and 3 pulse cards.
3. In `src/components/booking/OpenPlaySection.tsx`:
   - Allow optional `borderTop?: boolean` prop (defaulting to true) so `/open-play` can cleanly omit redundant borders.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/app/open-play/page.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/open-play/page.tsx src/app/open-play/loading.tsx src/app/open-play/page.test.tsx src/components/booking/OpenPlaySection.tsx
git commit -m "feat(open-play): create dedicated /open-play page and loading skeleton"
```

---

### Task 2: Remove Open Play from Landing Page & Update Navigation

**Files:**
- Modify: `src/app/(public)/page.tsx`
- Modify: `src/components/Navbar.tsx`
- Modify: `src/components/booking/BookingGrid.tsx`
- Modify: `src/components/booking/BookingGrid.test.tsx`

**Interfaces:**
- Consumes: `/open-play` route.
- Produces: Cleaned landing page without `listUpcomingSessions` SSR query; updated Navbar and BookingGrid links pointing to `/open-play`.

- [ ] **Step 1: Write/update the failing unit test**

In `src/components/booking/BookingGrid.test.tsx`, update the click assertion to route to `"/open-play"` instead of `"/#open-play"`:
```tsx
expect(html).toContain('onClick={() => router.push("/open-play")}');
```
Or verify the rendered slot attributes and links in `Navbar.tsx`.

- [ ] **Step 2: Run test to verify current state**

Run: `npx vitest run src/components/booking/BookingGrid.test.tsx`
Expected: Current tests pass.

- [ ] **Step 3: Implement updates**

1. In `src/app/(public)/page.tsx`:
   - Remove `listUpcomingSessions` from `@/lib/services/open-play.service` import.
   - Remove `OpenPlaySection` import and its render.
   - Remove `openPlaySessions` state/query from `LandingPage()`.
2. In `src/components/Navbar.tsx`:
   - In `useEffect`: add `if (pathname === "/open-play" || pathname?.startsWith("/open-play")) { setActiveNav("open-play"); return; }`.
   - Update desktop link: `href="/open-play"`, `onClick={() => setActiveNav("open-play")}`.
   - Update mobile link: `href="/open-play"`, `onClick={() => setActiveNav("open-play")}`.
3. In `src/components/booking/BookingGrid.tsx`:
   - Update `router.push("/#open-play")` to `router.push("/open-play")`.

- [ ] **Step 4: Run test suite to verify everything passes**

Run: `npm test -- --run`
Expected: All 22 test files pass.

- [ ] **Step 5: Commit**

```bash
git add src/app/(public)/page.tsx src/components/Navbar.tsx src/components/booking/BookingGrid.tsx src/components/booking/BookingGrid.test.tsx
git commit -m "refactor: remove open play from landing page and link navbar to /open-play"
```

---

### Task 3: Full Test Suite & TypeScript Verification

**Files:**
- Repository-wide verification.

- [ ] **Step 1: Run complete test suite**

Run: `npm test -- --run`
Expected: All 22 test files pass.

- [ ] **Step 2: Run TypeScript typecheck**

Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 3: Verify git status is clean**

Run: `git status`
Expected: working tree clean.
