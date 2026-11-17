# Multi-Tenant Core Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the single-venue pickleball system into an npm workspaces monorepo featuring a shared core engine (`packages/core`) consumed by independent client applications (`apps/dinksync` for Client 1, and `apps/venue-template` for Client 2 and future clients).

**Architecture:** Monorepo with npm workspaces. The `@pickle/core` package encapsulates all database services, Supabase SSR/admin clients, Stripe/GCash payment verification, auth guards, and domain logic. Client UI apps live under `apps/*` as standalone Next.js 16 applications with distinct layouts, themes, and isolated environment variables.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript 5, Tailwind CSS 4, Supabase (`@supabase/ssr`, `@supabase/supabase-js`), Stripe, Vitest.

**Spec:** `docs/superpowers/specs/2026-11-17-multi-tenant-core-engine-design.md`

## Global Constraints
- **Zero data sharing**: Each client app connects to its own dedicated Supabase database and Stripe account via its own `.env.local`.
- **Strict RLS & Authorization**: Never rely on wildcard RLS (`using (true)`). Remove heuristic email string matching (`includes("admin")`); roles must strictly come from verified database records.
- **Client 1 Backward Compatibility**: Existing functionality, routes, and tests in Client 1 (`dinksync`) must continue to work without regression.
- **Configurable Defaults**: Default to Philippine operations (PHP `₱`, `Asia/Manila` timezone, GCash QR, 60-min slots), with venue name, contact details, and branding injected through `VenueConfig`.

## Review Focus
1. **Admin privilege escalation attempt**: A user with email `admin-impostor@gmail.com` logs in with no profile row. Expected: User is assigned `customer` role and blocked from `/admin/*`.
2. **Missing `VenueConfig` fallback**: A client app does not provide custom contact info. Expected: `@pickle/core` provides safe default contact placeholders without crashing.
3. **Workspace package resolution**: Next.js bundling of `@pickle/core` inside `apps/dinksync` and `apps/venue-template`. Expected: `transpilePackages` correctly resolves internal TypeScript modules without build errors.
4. **Environment isolation**: Running Client 2 must not read Client 1's `.env.local` keys. Expected: Each app has its own isolated `.env.local` root.
5. **Direct DB calls in UI**: A page bypassing services to directly mutate `bookings` or `payments`. Expected: All database operations must go through `@pickle/core` services.

---

### Task 1: Security Hardening - Remove Insecure Admin Email Heuristic

**Files:**
- Modify: `src/lib/services/auth.server.ts:34-48, 83-93`
- Modify: `src/app/auth/login/page.tsx:88-93`
- Modify: `src/app/login/page.tsx:81-86`
- Test: `src/lib/services/auth.server.test.ts`

**Interfaces:**
- Consumes: Supabase `User`, `profiles` table.
- Produces: `getCurrentProfile(): Promise<Profile | null>`, `requireAdmin(): Promise<Profile>`.

- [ ] **Step 1: Write the failing test**

```typescript
// src/lib/services/auth.server.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { getCurrentProfile, requireAdmin } from "./auth.server";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

describe("auth.server security", () => {
  it("does not grant admin role based solely on email containing 'admin'", async () => {
    const { createClient } = await import("@/lib/supabase/server");
    (createClient as any).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: "fake-user-id",
              email: "admin-hacker@example.com",
              user_metadata: {},
            },
          },
        }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: null }),
          }),
        }),
        upsert: vi.fn().mockResolvedValue({ error: null }),
      }),
    });

    const profile = await getCurrentProfile();
    expect(profile?.role).toBe("customer");
    await expect(requireAdmin()).rejects.toThrow("Unauthorized: Admin privileges required.");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/services/auth.server.test.ts`
Expected: FAIL (currently grants "admin" because email includes "admin").

- [ ] **Step 3: Remove `includes("admin")` fallback**

In `src/lib/services/auth.server.ts`:
Remove `user.email?.toLowerCase().includes("admin")`. Only assign `role: "admin"` if `user.user_metadata?.role === "admin"`. Default to `"customer"`.
In `src/app/auth/login/page.tsx` and `src/app/login/page.tsx`:
Remove the matching fallback block `if (!userRole && data.user.email?.toLowerCase().includes("admin")) { userRole = "admin" }`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/services/auth.server.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/services/auth.server.ts src/lib/services/auth.server.test.ts src/app/auth/login/page.tsx src/app/login/page.tsx
git commit -m "fix(security): remove insecure email substring admin heuristic"
```

---

### Task 2: Core Domain & Configuration Contract Extraction

**Files:**
- Create: `packages/core/package.json`
- Create: `packages/core/tsconfig.json`
- Create: `packages/core/src/config/venue.ts`
- Create: `packages/core/src/config/venue.test.ts`
- Create: `packages/core/src/domain/index.ts`

**Interfaces:**
- Produces: `VenueConfig`, `resolveVenueConfig(overrides?: Partial<VenueConfig>): VenueConfig`, shared domain types (`Booking`, `Court`, `Profile`, `UserRole`, `Payment`).

- [ ] **Step 1: Write the failing test for venue config**

```typescript
// packages/core/src/config/venue.test.ts
import { describe, it, expect } from "vitest";
import { resolveVenueConfig, DEFAULT_VENUE_CONFIG } from "./venue";

describe("Venue Configuration Contract", () => {
  it("provides standard Philippine defaults when no overrides are given", () => {
    const config = resolveVenueConfig();
    expect(config.currency).toBe("PHP");
    expect(config.currencySymbol).toBe("₱");
    expect(config.timezone).toBe("Asia/Manila");
    expect(config.slotDurationMinutes).toBe(60);
  });

  it("applies venue overrides cleanly", () => {
    const config = resolveVenueConfig({
      venueName: "Metro Pickleball Club",
      contactPhone: "09181234567",
      contactEmail: "info@metropickle.ph",
    });
    expect(config.venueName).toBe("Metro Pickleball Club");
    expect(config.contactPhone).toBe("09181234567");
    expect(config.currencySymbol).toBe("₱");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run packages/core/src/config/venue.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement `packages/core/src/config/venue.ts` and `domain/index.ts`**

Create `packages/core/package.json`:
```json
{
  "name": "@pickle/core",
  "version": "0.1.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts"
}
```
Create `packages/core/src/config/venue.ts` implementing `VenueConfig` interface and `resolveVenueConfig()`.
Create `packages/core/src/domain/index.ts` re-exporting domain entities from `src/lib/domain.ts`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run packages/core/src/config/venue.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/core/
git commit -m "feat(core): initialize @pickle/core package with domain models and venue config"
```

---

### Task 3: Migrate Core Services to `@pickle/core`

**Files:**
- Create: `packages/core/src/supabase/client.ts`
- Create: `packages/core/src/supabase/server.ts`
- Create: `packages/core/src/supabase/admin.ts`
- Create: `packages/core/src/services/booking.service.ts`
- Create: `packages/core/src/services/schedule.service.ts`
- Create: `packages/core/src/services/payment.service.ts`
- Create: `packages/core/src/services/email.service.ts`
- Create: `packages/core/src/index.ts` (main entry exporting config, domain, services, and supabase clients)

**Interfaces:**
- Consumes: `@supabase/ssr`, `@supabase/supabase-js`, `stripe`, `VenueConfig`.
- Produces: `@pickle/core` exports: `createClient`, `createAdminClient`, `bookingService`, `paymentService`, `scheduleService`, `emailService`, `authService`.

- [ ] **Step 1: Write integration test for core exports**

```typescript
// packages/core/src/index.test.ts
import { describe, it, expect } from "vitest";
import * as core from "./index";

describe("@pickle/core exports", () => {
  it("exports all required core modules", () => {
    expect(core.resolveVenueConfig).toBeDefined();
    expect(core.createAdminClient).toBeDefined();
    expect(core.createCheckoutSession).toBeDefined();
    expect(core.getBookingGridForDate).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run packages/core/src/index.test.ts`
Expected: FAIL

- [ ] **Step 3: Migrate and parameterize services into `packages/core/src/`**

1. Copy database and supabase helpers into `packages/core/src/supabase/`.
2. Copy and decouple services (`booking.service.ts`, `schedule.service.ts`, `payment.service.ts`, `customer.service.ts`, `open-play.service.ts`, `email.service.ts`) into `packages/core/src/services/`.
3. In `email.service.ts`, replace hardcoded "DinkSync" strings with `config.venueName` passed from `resolveVenueConfig()`.
4. Export all modules from `packages/core/src/index.ts`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run packages/core/src/index.test.ts`
Expected: PASS

- [ ] **Step 5: Run existing service test suite**

Run: `npx vitest run src/lib/services/`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add packages/core/
git commit -m "feat(core): extract and parameterize business services into @pickle/core"
```

---

### Task 4: Setup Monorepo Workspaces & Migrate Existing App to `apps/dinksync`

**Files:**
- Modify: Root `package.json` (add `"workspaces": ["packages/*", "apps/*"]`)
- Move: `src/`, `public/`, `next.config.ts`, `postcss.config.mjs`, `components.json` -> `apps/dinksync/`
- Create: `apps/dinksync/package.json` (pointing to `"@pickle/core": "*"`)
- Modify: `apps/dinksync/next.config.ts` (add `transpilePackages: ["@pickle/core"]`)
- Create: `apps/dinksync/venue.config.ts` (configured with DinkSync metadata)

**Interfaces:**
- Consumes: `@pickle/core`.
- Produces: Runnable Client 1 Next.js application at `apps/dinksync`.

- [ ] **Step 1: Configure root `package.json` workspaces**

Update root `package.json`:
```json
{
  "name": "pickle-platform",
  "private": true,
  "workspaces": [
    "packages/*",
    "apps/*"
  ],
  "scripts": {
    "dev:dinksync": "npm run dev --workspace=apps/dinksync",
    "build:dinksync": "npm run build --workspace=apps/dinksync",
    "test": "vitest"
  }
}
```

- [ ] **Step 2: Restructure directory to `apps/dinksync`**

1. Move current application files (`src/`, `public/`, `next.config.ts`, `postcss.config.mjs`) into `apps/dinksync/`.
2. Move `.env.local` to `apps/dinksync/.env.local` (and preserve root `.env.local` fallback for tests).
3. Create `apps/dinksync/package.json` defining dependencies and `"@pickle/core": "*"`.
4. Add `transpilePackages: ["@pickle/core"]` in `apps/dinksync/next.config.ts`.
5. Create `apps/dinksync/venue.config.ts`:
```typescript
import { resolveVenueConfig } from "@pickle/core";

export const venueConfig = resolveVenueConfig({
  venueId: "dinksync",
  venueName: "DinkSync",
  contactPhone: "+63 9171234567",
  contactEmail: "support@dinksync.ph",
});
```

- [ ] **Step 3: Run npm install to link workspaces**

Run: `npm install`
Expected: Symlinks `@pickle/core` into `node_modules`.

- [ ] **Step 4: Verify Client 1 builds and tests pass**

Run: `npm run build --workspace=apps/dinksync`
Expected: Build successfully completes.
Run: `npm run test`
Expected: All existing tests pass.

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "refactor(workspace): migrate dinksync into apps/dinksync with @pickle/core dependency"
```

---

### Task 5: Scaffold Client 2 Starter Template (`apps/venue-template`)

**Files:**
- Create: `apps/venue-template/package.json`
- Create: `apps/venue-template/next.config.ts`
- Create: `apps/venue-template/tsconfig.json`
- Create: `apps/venue-template/venue.config.ts`
- Create: `apps/venue-template/src/app/layout.tsx`
- Create: `apps/venue-template/src/app/page.tsx`
- Create: `apps/venue-template/src/app/admin/page.tsx`

**Interfaces:**
- Consumes: `@pickle/core`.
- Produces: Standalone clean starter app ready for building a completely different UI for Client 2.

- [ ] **Step 1: Create `apps/venue-template` app manifest & config**

Create `apps/venue-template/package.json`:
```json
{
  "name": "venue-template",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev -p 3001",
    "build": "next build",
    "start": "next start -p 3001"
  },
  "dependencies": {
    "@pickle/core": "*",
    "next": "^16.4.4",
    "react": "^19.2.8",
    "react-dom": "19.2.8",
    "lucide-react": "^1.48.0"
  }
}
```

- [ ] **Step 2: Scaffold minimal clean starter layout & pages**

1. Create `apps/venue-template/venue.config.ts` with placeholder venue configuration.
2. Create `apps/venue-template/src/app/layout.tsx` with dynamic title from `venueConfig.venueName`.
3. Create `apps/venue-template/src/app/page.tsx` (clean booking wireframe showing how to call `getBookingGridForDate()` from `@pickle/core`).
4. Create `apps/venue-template/src/app/admin/page.tsx` (clean admin shell).

- [ ] **Step 3: Verify Client 2 builds**

Run: `npm run build --workspace=apps/venue-template`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add apps/venue-template/
git commit -m "feat(venue-template): scaffold clean starter template for Client 2 UI revision"
```

---

### Task 6: Final Verification Across Both Apps

**Files:**
- Test all workspaces

- [ ] **Step 1: Run comprehensive tests across the monorepo**

Run: `npm run test`
Expected: All unit & integration tests pass across `packages/core` and `apps/*`.

- [ ] **Step 2: Run both production builds**

Run: `npm run build --workspace=apps/dinksync`
Run: `npm run build --workspace=apps/venue-template`
Expected: Both exit code 0.

- [ ] **Step 3: Document deployment instructions in README.md**

Update root `README.md` explaining how to deploy individual venues on Vercel by setting Root Directory to `apps/<client-name>`.

- [ ] **Step 4: Final commit**

```bash
git add README.md
git commit -m "docs: add multi-tenant deployment guide for Vercel"
```
