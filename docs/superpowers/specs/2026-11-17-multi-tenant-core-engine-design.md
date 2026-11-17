# Multi-Tenant Core Engine & Multi-UI Architecture Design

## 1. Intent & The Why
The goal is to transform the single-venue pickleball court booking platform (`pickle-wb`) into a commercial platform that can be deployed for multiple client venues (3+ clients). 

Each client venue requires:
1. **Completely customized frontend experiences**: Both the public customer-facing booking site and the back-office admin dashboard will have unique layouts, user journeys, navigation structures, and visual branding tailored to each venue.
2. **Shared core business logic**: Booking validation, court scheduling, payment processing (Stripe & GCash), authentication, email notifications, and database schemas are standardized. When a bug is fixed or a shared feature (such as Staff/Cashier roles or Rain Check vouchers) is added, all venues benefit without manual code duplication.
3. **Data & financial isolation**: Each client venue has its own separate Supabase database, Stripe account, GCash configuration, and custom domain to ensure complete financial and legal isolation.

---

## 2. Goals & Non-Goals

### Goals
- **Single Source of Truth for Core Logic**: Centralize services, database access, Stripe integration, auth authorization checks, and validation in a shared core library (`packages/core`).
- **Independent UI Applications**: Each client venue exists as an independent Next.js application within a workspace (`apps/<client-name>`), giving 100% design freedom for pages, layouts, Tailwind themes, and UI components without affecting other venues.
- **Independent Deployments**: Each venue app is deployed independently (e.g. on Vercel) with its own environment variables (`.env.local`), custom domain, and isolated database credentials.
- **Zero-Downtime Migration for Client 1**: The existing venue (`pickle-wb`) is preserved as `apps/dinksync` with identical behavior, passing all existing tests.
- **Security Hardening as Prerequisite**: Fix existing Row Level Security (RLS) wildcard bypasses (`using (true)`) and insecure email string checks (`includes("admin")`) directly in the core engine before onboarding secondary clients.

### Non-Goals & Anti-Goals
- **Single-Database Multi-Tenancy (Anti-Goal)**: We will NOT share a single database across multiple client venues using a `tenant_id` column. Separate Supabase databases provide complete legal, data, and financial separation.
- **Dynamic In-App White-Labeling (Anti-Goal)**: We will NOT build runtime `if (tenant === 'A')` branching inside single UI components. Distinct layouts require distinct page implementations.
- **Over-engineered Microservices (Anti-Goal)**: We will use a standard Next.js npm workspace / monorepo structure.

---

## 3. Approaches Considered & Trade-offs

| Approach | Architecture | Advantages | Disadvantages | Verdict |
| :--- | :--- | :--- | :--- | :--- |
| **A. Git Clones / Forking** | Full repository copy per client | Fast initial setup; zero structural changes today | Maintenance nightmare: Bug fixes, security patches, and features must be manually copy-pasted across 3+ repositories. Code drifts apart quickly. | **Rejected** |
| **B. Shared Core + Multi-App Workspace** | Monorepo (`packages/core` + `apps/*`) | Core logic written once; infinite UI customization per client; clean CI/CD; updates rolled out per venue safely. | Requires upfront extraction of database queries from pages into services. | **Chosen** |
| **C. Single App Dynamic Engine** | One Next.js app switching themes via database settings | Single deployment | Fails the requirement for completely different page layouts and admin dashboards; results in huge bundle sizes and fragile conditional code. | **Rejected** |

---

## 4. Architecture Specification

### 4.1 Monorepo Workspace Structure
We will adopt an **npm workspace** structure (standard with Next.js and npm):

```text
pickle-wb/
├── package.json               # Root workspace manifest (defines workspaces: ["packages/*", "apps/*"])
├── packages/
│   └── core/                  # The Shared Engine (@pickle/core)
│       ├── package.json
│       ├── tsconfig.json
│       ├── src/
│       │   ├── config/        # VenueConfig schema, default rules (Asia/Manila, PHP, 60m slots)
│       │   ├── domain/        # Shared domain models & types (Booking, Court, Profile, Role)
│       │   ├── services/      # Business logic (booking, schedule, payments, email, customer)
│       │   ├── supabase/      # Supabase server & admin clients, normalized config
│       │   ├── stripe/        # Stripe client & checkout helpers
│       │   └── validation/    # Booking time rules, phone validation, cancellation logic
│       └── migrations/        # Canonical Supabase SQL migrations & locked-down RLS policies
├── apps/
│   ├── dinksync/              # Client 1 (The existing app, preserved cleanly)
│   │   ├── package.json       # Depends on "@pickle/core": "*"
│   │   ├── next.config.ts
│   │   ├── .env.local         # DinkSync Supabase & Stripe keys
│   │   └── src/               # Existing DinkSync pages, components, & Tailwind theme
│   └── venue-template/        # Starter template for Client 2 (and future clients)
│       ├── package.json       # Depends on "@pickle/core": "*"
│       ├── next.config.ts
│       ├── .env.local         # Client 2 Supabase & Stripe keys
│       └── src/               # Fresh, modular UI structure ready for revised design
```

### 4.2 Security & Service Architecture (Decisions Settled by Review)
1. **Server vs Client Boundary**:
   - Web browser / client components communicate only through Server Actions and Server Components using standard Supabase Anon clients protected by strict RLS.
   - Trusted server services (`booking.service.ts`, `payment.service.ts`, etc.) will continue utilizing `createAdminClient()` (Service Role) inside secure server environments to execute atomic business logic (walk-in booking generation, Stripe/GCash payment reconciliation) without running into client RLS blocks.
2. **Hardened RLS Policies**:
   - Drop all `using (true)` and `with check (true)` wildcard policies.
   - `profiles`: Users can read/update only their own row (`auth.uid() = id`). Inserts allowed only when `auth.uid() = id`.
   - `bookings`: Viewable for availability grids, but customer details protected.
3. **Elimination of Email-Based Admin Privilege**:
   - Remove `user.email?.toLowerCase().includes("admin")` from `auth.server.ts` and login pages. Roles are strictly read from the verified database `profiles.role` column.

### 4.3 Venue Configuration Contract
`packages/core` will export a typed `VenueConfig` injected by each client app:
```typescript
export interface VenueConfig {
  venueId: string;
  venueName: string;
  tagline?: string;
  contactEmail: string;
  contactPhone: string;
  address?: string;
  timezone: string; // Defaults to "Asia/Manila"
  currency: string; // Defaults to "PHP"
  currencySymbol: string; // Defaults to "₱"
}
```
All venue-specific branding previously hardcoded (such as "DinkSync" in emails or "+63 9171234567" in footers) will read from the app's `venue.config.ts`.

---

## 5. Execution Roadmap

1. **Phase 1: Security Fixes & Schema Cleanliness**:
   - Drop blanket RLS policies in Supabase.
   - Remove insecure email string admin heuristic.
2. **Phase 2: Core Extraction**:
   - Extract `src/lib/services/`, `src/lib/domain.ts`, and server utils into `packages/core`.
   - Replace hardcoded "DinkSync" strings in email services with `venueConfig`.
3. **Phase 3: Workspaces Configuration**:
   - Configure root `package.json` workspaces (`packages/*`, `apps/*`).
   - Move current application into `apps/dinksync`.
4. **Phase 4: Backward Compatibility Verification**:
   - Run test suite (`npm run test`) and production build (`npm run build`).
5. **Phase 5: Client 2 Starter Template**:
   - Create `apps/venue-template` with clean architecture ready for the revised UI development.
