# Pickle Platform — Multi-Venue Monorepo

A multi-client pickleball court booking & management platform built with Next.js 16, TypeScript, Supabase, and Stripe.

---

## Architecture Overview

```text
pickle-wb/
├── packages/
│   └── core/              # Shared Engine (@pickle/core)
│                          # Database services, Supabase SSR/Admin, Stripe/GCash, auth & domain types
└── apps/
    ├── dinksync/          # Client 1: DinkSync venue web app (production UI)
    └── venue-template/    # Client 2: Customizable starter template for new clients
```

- **Shared Business Engine (`@pickle/core`)**: Booking algorithms, payment processing, slot schedule math, database queries, and email pipelines are written once and shared across all venues.
- **Customizable UI (`apps/*`)**: Each client venue has its own independent Next.js application with 100% freedom to create custom layouts, color palettes, and component styles.
- **Data & Financial Isolation**: Each client venue runs with its own `.env.local` pointing to its own Supabase database and Stripe account.

---

## Getting Started

### Install Dependencies
```bash
npm install
```

### Run Client Apps
* **Client 1 (DinkSync)**:
  ```bash
  npm run dev:dinksync
  ```
  Runs at [http://localhost:3000](http://localhost:3000)

* **Client 2 (Venue Template / Custom UI)**:
  ```bash
  npm run dev:venue
  ```
  Runs at [http://localhost:3001](http://localhost:3001)

### Run Tests
```bash
npm run test
```

---

## Deploying Multiple Clients to Vercel

When deploying to Vercel (or any other hosting provider), each client venue is created as a separate Vercel Project pointing to this same repository:

1. Create a new project in the Vercel dashboard and connect this GitHub repo.
2. Under **Root Directory**, click **Edit** and set:
   * For Client 1: `apps/dinksync`
   * For Client 2: `apps/venue-template` (or your renamed client app)
3. Under **Environment Variables**, add that venue's specific keys:
   * `NEXT_PUBLIC_SUPABASE_URL`
   * `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   * `SUPABASE_SERVICE_ROLE_KEY`
   * `STRIPE_SECRET_KEY`
   * `GMAIL_USER` / `GMAIL_APP_PASSWORD`
4. Click **Deploy**. Each venue will have its own independent domain (e.g. `dinksync.com`, `matchpoint.com`).
