# Customer Tier Labels Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update customer tier labels from "VIP Member / Regular Member / Guest" to "VIP Player / Regular Player / New Player" across the admin customers table, overview cards, and customer detail page.

**Architecture:** Export an enhanced `getMembershipTier` helper in `src/app/admin/customers/page.tsx` providing consistent `label`, `cls`, and `description` properties for each tier based on booking count. Update the summary cards on `/admin/customers` to display "VIP Players", "Regular Players", and "New Players", and import `getMembershipTier` in `/admin/customers/[id]/page.tsx` to eliminate duplicated tier logic.

**Tech Stack:** React 19 Server Components, Next.js 16, Tailwind CSS v4, Vitest, `react-dom/server`.

**Spec:** [`docs/superpowers/specs/2026-11-05-customer-tier-labels-design.md`](file:///c:/Users/jedrik/Projects/pickle-wb/docs/superpowers/specs/2026-11-05-customer-tier-labels-design.md)

## Global Constraints
- Thresholds must remain strictly: `>= 20` for VIP, `>= 5` for Regular, `< 5` for New.
- Do not modify database schemas, table columns, or query functions.
- All existing 13 test suites must pass without regression.

## Review Focus
- **Tier Label Accuracy:** `getMembershipTier(20)` must return `"VIP Player"`, `getMembershipTier(5)` returns `"Regular Player"`, and `getMembershipTier(0)` returns `"New Player"`.
- **Card Header Pluralization:** The top metric cards in `AdminCustomersPage` must display `"VIP Players"`, `"Regular Players"`, and `"New Players"`.
- **Detail View Consistency:** The customer detail page (`/admin/customers/[id]`) must display the identical tier title and descriptive text without hardcoded string divergence.
- **Zero Regressions:** Customer search and bookings table integration must remain fully functional.

---

### Task 1: Update `getMembershipTier` Helper and Customer List Page

**Files:**
- Modify: `src/app/admin/customers/page.tsx`
- Test: `src/app/admin/customers/customers.test.tsx`

**Interfaces:**
- Consumes: `CustomerSummary` from `@/lib/types/domain`
- Produces: `export function getMembershipTier(count: number): { label: string; cls: string; description: string }`

- [ ] **Step 1: Write failing test in `src/app/admin/customers/customers.test.tsx`**

```tsx
import { describe, it, expect, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import AdminCustomersPage, { getMembershipTier } from "./page";

vi.mock("@/lib/services/customer.service", () => ({
  getAllCustomersWithBookingCounts: vi.fn().mockResolvedValue([
    { id: "c-1", fullName: "Alice Smith", email: "alice@example.com", bookingCount: 22, totalSpend: 5500 },
    { id: "c-2", fullName: "Bob Jones", email: "bob@example.com", bookingCount: 8, totalSpend: 2000 },
    { id: "c-3", fullName: "Charlie Day", email: "charlie@example.com", bookingCount: 1, totalSpend: 250 },
  ]),
}));

describe("Customer Tier Labels", () => {
  it("returns correct tier labels and descriptions based on booking counts", () => {
    expect(getMembershipTier(25)).toEqual({
      label: "VIP Player",
      cls: expect.stringContaining("purple"),
      description: "Top frequent player",
    });

    expect(getMembershipTier(5)).toEqual({
      label: "Regular Player",
      cls: expect.stringContaining("blue"),
      description: "Active returning player",
    });

    expect(getMembershipTier(2)).toEqual({
      label: "New Player",
      cls: expect.stringContaining("slate"),
      description: "First-time or occasional player",
    });
  });

  it("renders updated tier cards and table badges in AdminCustomersPage", async () => {
    const pageJsx = await AdminCustomersPage({});
    const html = renderToStaticMarkup(pageJsx);

    // Summary cards
    expect(html).toContain("VIP Players");
    expect(html).toContain("Regular Players");
    expect(html).toContain("New Players");

    // Table badges
    expect(html).toContain("VIP Player");
    expect(html).toContain("Regular Player");
    expect(html).toContain("New Player");

    // No legacy Guest or Member text in tiers
    expect(html).not.toContain("VIP Members");
    expect(html).not.toContain("Regular Members");
    expect(html).not.toContain("Guests");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/app/admin/customers/customers.test.tsx`
Expected: FAIL (getMembershipTier returns "VIP Member" and html contains "VIP Members").

- [ ] **Step 3: Update `src/app/admin/customers/page.tsx`**

1. Update `getMembershipTier`:
```tsx
export function getMembershipTier(count: number): { label: string; cls: string; description: string } {
    if (count >= 20) return { label: "VIP Player",     cls: "bg-purple-100 text-purple-800 hover:bg-purple-100 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800", description: "Top frequent player" };
    if (count >= 5)  return { label: "Regular Player", cls: "bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800",       description: "Active returning player" };
    return              { label: "New Player",         cls: "bg-slate-100 text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",   description: "First-time or occasional player" };
}
```
2. Update summary metric cards:
```tsx
    {[
        { label: "VIP Players",     count: customers.filter((c) => c.bookingCount >= 20).length, cls: "bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300" },
        { label: "Regular Players", count: customers.filter((c) => c.bookingCount >= 5 && c.bookingCount < 20).length, cls: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300" },
        { label: "New Players",     count: customers.filter((c) => c.bookingCount < 5).length,  cls: "bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-300"   },
    ].map(({ label, count, cls }) => (
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/app/admin/customers/customers.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/admin/customers/page.tsx src/app/admin/customers/customers.test.tsx
git commit -m "feat(customers): update membership tier labels to VIP, Regular, and New Player"
```

---

### Task 2: Update Customer Detail Page (`src/app/admin/customers/[id]/page.tsx`)

**Files:**
- Modify: `src/app/admin/customers/[id]/page.tsx`
- Test: `src/app/admin/customers/customers.test.tsx`

**Interfaces:**
- Consumes: `getMembershipTier` from `../page`

- [ ] **Step 1: Add test in `src/app/admin/customers/customers.test.tsx` for detail page**

```tsx
import AdminCustomerDetailPage from "./[id]/page";

vi.mock("@/lib/services/booking.service", () => ({
  getBookingsForCustomer: vi.fn().mockResolvedValue([
    { id: "b-1", status: "confirmed", paymentStatus: "succeeded", totalPrice: 300 },
  ]),
}));
vi.mock("@/app/bookings/actions", () => ({
  updateCustomerPhoneByAdminAction: vi.fn(),
}));

describe("AdminCustomerDetailPage", () => {
  it("renders New Player tier label and description for customer with 1 booking", async () => {
    vi.mocked(await import("@/lib/services/customer.service")).getCustomerProfile = vi.fn().mockResolvedValue({
      id: "c-1",
      fullName: "Jane Doe",
      email: "jane@example.com",
      createdAt: "2026-01-01",
    });

    const pageJsx = await AdminCustomerDetailPage({ params: Promise.resolve({ id: "c-1" }) });
    const html = renderToStaticMarkup(pageJsx);

    expect(html).toContain("New Player");
    expect(html).toContain("First-time or occasional player");
    expect(html).not.toContain("Guest");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/app/admin/customers/customers.test.tsx`
Expected: FAIL (detail page contains "Guest").

- [ ] **Step 3: Update `src/app/admin/customers/[id]/page.tsx`**

1. Import `getMembershipTier` from `../page`:
```tsx
import { getMembershipTier } from "../page";
```
2. In the component body, derive tier:
```tsx
const tier = getMembershipTier(bookings.length);
```
3. Update Membership Tier card:
```tsx
<p className="text-2xl font-bold tracking-tight">
    {tier.label}
</p>
<p className="text-xs text-muted-foreground mt-1">
    {tier.description}
</p>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/app/admin/customers/customers.test.tsx`
Expected: PASS.

- [ ] **Step 5: Run full test suite and TypeScript check**

Run: `npx vitest run`
Run: `npx tsc --noEmit`
Run: `npx eslint src/app/admin/customers/page.tsx "src/app/admin/customers/[id]/page.tsx" src/app/admin/customers/customers.test.tsx`
Expected: All 14 test files pass, 0 typecheck errors, 0 lint errors.

- [ ] **Step 6: Commit**

```bash
git add src/app/admin/customers/[id]/page.tsx src/app/admin/customers/customers.test.tsx docs/superpowers/plans/2026-11-05-customer-tier-labels.md
git commit -m "feat(customers): unify customer detail page tier display with getMembershipTier"
```

