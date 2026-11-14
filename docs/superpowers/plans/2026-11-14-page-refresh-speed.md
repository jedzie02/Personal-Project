# Page Refresh Speed Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate sluggish reload latency on public pages by scoping middleware auth checks to admin routes, adding 10-second revalidation to the public homepage, and trimming unnecessary Google Font weights without moving or removing any components.

**Architecture:** Next.js 16 App Router on Vercel with Supabase. Fast-path `proxy.ts` middleware skips remote auth roundtrips on public routes; `revalidate = 10` caches the homepage on Vercel's Edge network for 10 seconds; Poppins font loads only standard weights ("400", "600", "700").

**Tech Stack:** Next.js 16.4.4, React 19, Supabase SSR, Tailwind CSS v4, Vitest.

**Spec:** `docs/superpowers/specs/2026-11-14-page-refresh-speed-design.md`

## Global Constraints

- Zero components or files moved, deleted, or structurally reorganized.
- `/admin/*` routes must retain 100% of their auth checks and non-admin redirects.
- Booking and session availability must remain fresh within 10 seconds.
- Ponytail mode: minimal diff, no extra dependencies.

## Review Focus

- Visiting `/admin` without a session redirects to `/auth/login?redirectTo=%2Fadmin`.
- Visiting `/admin` with a non-admin session redirects to `/`.
- Public routes (`/`) respond without making remote `auth.getUser()` network calls.
- Date query params on the homepage (`/?date=YYYY-MM-DD`) continue to load the correct date's grid.
- All existing 55 Vitest unit tests continue to pass.

---

### Task 1: Scope Middleware Auth Check to Admin Routes and Trim Font Weights

**Files:**
- Modify: `src/proxy.ts:88-120`
- Modify: `src/app/layout.tsx:6-10`
- Test: `src/proxy.test.ts` (or verify with Vitest test suite)

**Interfaces:**
- Consumes: NextRequest from `next/server`, `createServerClient` from `@supabase/ssr`
- Produces: `proxy(request: NextRequest): Promise<NextResponse>`

- [ ] **Step 1: Check existing tests pass**
  Run: `npx vitest run`
  Expected: All 55 tests PASS

- [ ] **Step 2: Update `src/proxy.ts` to only call `supabase.auth.getUser()` on `/admin` routes**
  Scope auth check and profile role lookup inside `if (pathname.startsWith("/admin"))`.
  Return `supabaseResponse` directly for public routes.

- [ ] **Step 3: Update `src/app/layout.tsx` to trim Poppins font weights**
  Change `weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"]` to `weight: ["400", "600", "700"]`.

- [ ] **Step 4: Verify type safety and tests**
  Run: `npx tsc --noEmit; npx vitest run`
  Expected: PASS with 0 errors

- [ ] **Step 5: Commit changes**
  Run: `git add src/proxy.ts src/app/layout.tsx; git commit -m "perf: scope middleware auth check to admin and trim font weights"`

---

### Task 2: Enable 10-Second Revalidation on Public Homepage

**Files:**
- Modify: `src/app/(public)/page.tsx:16`

**Interfaces:**
- Consumes: Next.js route segment config
- Produces: `export const revalidate = 10`

- [ ] **Step 1: Update `src/app/(public)/page.tsx` line 16**
  Replace `export const dynamic = "force-dynamic";` with `export const revalidate = 10;`.

- [ ] **Step 2: Verify type check and run tests**
  Run: `npx tsc --noEmit; npx vitest run`
  Expected: All tests pass, zero type errors.

- [ ] **Step 3: Commit changes**
  Run: `git add src/app/(public)/page.tsx; git commit -m "perf: switch homepage from force-dynamic to 10s revalidate"`

