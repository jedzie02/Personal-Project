# Design Doc: Page Refresh Speed Optimization (Approach 1)

**Date:** 2026-11-14  
**Status:** Pending Approval  
**Mode:** Ponytail (full)

---

## 1. Intent & Why
Visitors experience noticeable lag on page refresh. Profiling revealed three compounding bottlenecks on every reload:
1. **Middleware Auth Roundtrip:** Remote `supabase.auth.getUser()` HTTPS call executes on every request, adding ~200–400ms before SSR begins, even though auth is only needed for `/admin/*`.
2. **Force-Dynamic Public Homepage:** `export const dynamic = "force-dynamic"` bypasses Next.js page caching entirely, executing 4–6 database queries on every reload.
3. **Font Weight Bloat:** Poppins loads 9 full font weights (`100` through `900`), adding unnecessary network overhead.

## 2. Goals & Non-Goals
- **Goals:**
  - Instantaneous public refresh (<50ms for cached hits, eliminating auth roundtrip).
  - Preserve 100% of existing behavior, design, and booking availability accuracy.
  - Respect strict user constraint: zero code moving, zero component deletion.
- **Non-Goals:**
  - No client-side caching libraries (SWR, React Query).
  - No database schema or query changes.
  - No structural file reorganization.

## 3. Constraints
- Strict constraint from user: "make sure that no code will remove or move etc."
- Security constraint: `/admin/*` routes must remain 100% guarded with auth verification and role checks.
- Ponytail mode: minimum effective diff; solve the problem cleanly with no speculative code.

## 4. Approaches Considered
- **Approach 1 (Chosen): Surgical Zero-Risk Tweaks**
  - Scope middleware auth check to `/admin/*`.
  - Switch homepage from `force-dynamic` to `revalidate = 10`.
  - Trim Poppins font weights to `["400", "600", "700"]`.
  - *Why chosen:* Solves root causes directly with minimal lines changed and zero moving parts.
- **Approach 2: In-Memory Node Cache for Booking Queries**
  - Cache database queries in-process for 5 seconds.
  - *Trade-off:* Higher complexity, cache invalidation edge cases, unnecessary when Next.js ISR handles page caching cleanly.
- **Approach 3: Client-Side Refetching (SWR / React Query)**
  - *Trade-off:* Requires converting SSR pages to client components and restructuring data loading, directly violating the user's "no code moving or removing" constraint.

## 5. Implementation Details
1. **`src/proxy.ts` (Fast-Path Middleware Auth):**
   - Check `pathname.startsWith("/admin")` before calling `supabase.auth.getUser()`.
   - Public requests bypass the remote auth roundtrip entirely while preserving session cookie propagation.
   - Admin routes retain complete security checks.
2. **`src/app/(public)/page.tsx` (Incremental Static Revalidation):**
   - Replace `export const dynamic = "force-dynamic";` with `export const revalidate = 10;`.
   - Responses serve from cache in ~15ms while keeping court and session availability fresh (updates within 10s).
3. **`src/app/layout.tsx` (Trim Font Weights):**
   - Reduce Poppins weights from 9 weights down to `["400", "600", "700"]` (regular, semibold, bold).

## 6. Verification
- `npx vitest run` must pass with all 55 tests green.
- `npx tsc --noEmit` must pass with zero TypeScript errors.
- Verify middleware admin redirection test coverage.

