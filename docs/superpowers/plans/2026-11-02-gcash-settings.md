# GCash Settings Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Admin uploads a real GCash QR image and saves GCash account details on a new Settings page; those live details are shown to players on the Booking Confirmed page instead of hardcoded mock values.

**Architecture:** A `site_settings` table holds a single-row config (gcash_number, gcash_name, gcash_qr_url). A Supabase Storage bucket `settings` stores the QR image. The admin Settings page (`/admin/settings`) uses a Server Action to save text fields and upload the image via the service-role client. `GCashPaymentCard` is converted to a server component that reads from `site_settings` at render time.

**Tech Stack:** Next.js 16 App Router, Supabase (Postgres + Storage), TypeScript, Tailwind CSS, shadcn/ui, server actions pattern matching `src/app/admin/payments/actions.ts`.

**Spec:** This file.

## Global Constraints

- Ponytail full mode: smallest complete change, no gold-plating
- Use `createAdminClient()` (service role) for storage upload in the Server Action — RLS on storage requires it
- Use `createClient()` (server) for read-only `site_settings` queries (RLS allows public SELECT)
- No new npm dependencies
- Verification: `npx tsc --noEmit` + `npm run test` (no `npm build` — Google Fonts fails in sandbox)
- Image served via Supabase Storage public URL, not `/public` folder
- Bucket name: `settings` (public bucket)
- Table name: `site_settings`, single row with `id = 'gcash'`

## Review Focus

- No `site_settings` row yet: `GCashPaymentCard` must fall back gracefully to "contact the venue" text rather than crashing
- Image upload: oversized files or wrong MIME types should be rejected server-side with a user-visible error
- Storage public URL format differs between Supabase projects: use `supabase.storage.from('settings').getPublicUrl(path)` not string interpolation
- RLS on `site_settings`: SELECT must be allowed for anon/authenticated (players read it); INSERT/UPDATE only for service role
- Stale QR URL in `GCashPaymentCard`: page must not cache the old URL after admin saves a new image — use `revalidatePath` in the action

---

## Task 1: SQL Migration — `site_settings` table + `settings` storage bucket

**Files:**
- Create: `supabase/migrations/20261102_gcash_settings.sql`

**Interfaces:**
- Produces: `site_settings` table with columns `id text PRIMARY KEY`, `gcash_number text`, `gcash_name text`, `gcash_qr_url text`, `updated_at timestamptz`; Supabase Storage bucket `settings` (public); RLS policies

- [ ] **Step 1: Create migration file**

```sql
-- Create site_settings table
create table if not exists public.site_settings (
  id           text primary key,
  gcash_number text,
  gcash_name   text,
  gcash_qr_url text,
  updated_at   timestamptz default now()
);

-- Seed the gcash row so the app always has a row to upsert into
insert into public.site_settings (id) values ('gcash')
  on conflict (id) do nothing;

-- RLS: everyone can read, only service role can write
alter table public.site_settings enable row level security;

create policy "site_settings_read" on public.site_settings
  for select using (true);

-- Storage bucket (public so image URLs are directly accessible)
insert into storage.buckets (id, name, public)
  values ('settings', 'settings', true)
  on conflict (id) do nothing;

-- Storage RLS: anyone can read objects in `settings` bucket
create policy "settings_objects_read" on storage.objects
  for select using (bucket_id = 'settings');
```

- [ ] **Step 2: Run migration in Supabase dashboard (SQL editor) or via `supabase db push`**

  Expected: table `site_settings` exists with one row `id='gcash'`; bucket `settings` appears in Storage.

- [ ] **Step 3: Commit**

```
git add supabase/migrations/20261102_gcash_settings.sql
git commit -m "feat: add site_settings table and settings storage bucket"
```

---

## Task 2: `settings.service.ts` — read/write GCash settings

**Files:**
- Create: `src/lib/services/settings.service.ts`

**Interfaces:**
- Produces:
  - `getGCashSettings(): Promise<{ gcash_number: string | null; gcash_name: string | null; gcash_qr_url: string | null }>`
  - `saveGCashSettings(data: { gcash_number: string; gcash_name: string; gcash_qr_url?: string }): Promise<{ error?: string }>`
  - `uploadGCashQR(file: File): Promise<{ url: string; error?: string }>`

- [ ] **Step 1: Write `getGCashSettings`**

  Use `createClient()` (server), `select('gcash_number,gcash_name,gcash_qr_url').eq('id','gcash').maybeSingle()`. Returns the row or `{ gcash_number: null, gcash_name: null, gcash_qr_url: null }` on null/error.

- [ ] **Step 2: Write `uploadGCashQR`**

  Use `createAdminClient()`. Upload to path `gcash/qr-${Date.now()}.{ext}` in bucket `settings`, `upsert: true`. Return `supabase.storage.from('settings').getPublicUrl(path).data.publicUrl`.

- [ ] **Step 3: Write `saveGCashSettings`**

  Use `createAdminClient()`. Upsert `{ id: 'gcash', ...data, updated_at: new Date().toISOString() }`. Return `{ error }` on failure.

- [ ] **Step 4: Run type check**

  `npx tsc --noEmit -p c:\Users\jedrik\Projects\pickle-wb\tsconfig.json`
  Expected: 0 errors

- [ ] **Step 5: Commit**

```
git add src/lib/services/settings.service.ts
git commit -m "feat: settings service — read/write gcash settings + storage upload"
```

---

## Task 3: Admin Settings page + Server Action

**Files:**
- Create: `src/app/admin/settings/page.tsx`
- Create: `src/app/admin/settings/loading.tsx`
- Create: `src/app/admin/settings/actions.ts`

**Interfaces:**
- Consumes: `getGCashSettings`, `saveGCashSettings`, `uploadGCashQR` from Task 2
- Produces: route `/admin/settings`, server action `saveGCashSettingsAction(formData: FormData)`

- [ ] **Step 1: Create `actions.ts`**

  `'use server'` action `saveGCashSettingsAction(formData: FormData)`:
  1. Call `getCurrentProfile()` from `@/lib/services/auth.server`; throw/return error if not admin
  2. Extract `gcash_number` (string), `gcash_name` (string), `qr_file` (File | null) from formData
  3. Validate: both text fields non-empty, max 50 chars each
  4. If `qr_file` size > 0 and MIME starts with `image/`: call `uploadGCashQR(qr_file)`, set `gcash_qr_url` to returned URL; on upload error return `{ error }`
  5. Call `saveGCashSettings({ gcash_number, gcash_name, gcash_qr_url? })`
  6. Call `revalidatePath('/book/confirmation')` and `revalidatePath('/admin/settings')`
  7. Return `{ success: true }` or `{ error: string }`

- [ ] **Step 2: Create `loading.tsx`**

  Skeleton matching the admin page style — two input skeletons + an image placeholder square. Model it on `src/app/admin/payments/loading.tsx`.

- [ ] **Step 3: Create `page.tsx`**

  Server component. Fetches `getGCashSettings()`. Renders:
  - Page header: "Settings" with subtitle "GCash Payment Details"
  - A `<SettingsForm>` client component (inline in same file is fine, or a sibling `SettingsForm.tsx`) pre-populated with fetched values
  - If `gcash_qr_url` exists, shows current QR image with an `<Image>` tag

  `SettingsForm` is a `"use client"` component that:
  - Has controlled inputs for GCash Number and GCash Name
  - Has a file input (accept `image/*`) for the QR image
  - Shows a preview of the selected new image via `URL.createObjectURL`
  - On submit calls `saveGCashSettingsAction` via `useTransition` / `startTransition`; shows inline success or error message
  - Submit button disabled while pending

- [ ] **Step 4: Run type check**

  `npx tsc --noEmit -p c:\Users\jedrik\Projects\pickle-wb\tsconfig.json`
  Expected: 0 errors

- [ ] **Step 5: Commit**

```
git add src/app/admin/settings/
git commit -m "feat: admin settings page — gcash number, name, qr upload"
```

---

## Task 4: Add "Settings" to admin Sidebar

**Files:**
- Modify: `src/components/admin/Sidebar.tsx`

**Interfaces:**
- Consumes: existing `navSections` array in Sidebar
- Produces: "Settings" nav item under FINANCE section, below Payments, url `/admin/settings`, icon `Settings` from lucide-react

- [ ] **Step 1: Add Settings nav item to FINANCE section**

  Import `Settings` from `lucide-react`. Add to the `FINANCE` section items array after Payments:
  ```ts
  { title: "Settings", url: "/admin/settings", icon: Settings }
  ```

- [ ] **Step 2: Run type check**

  `npx tsc --noEmit -p c:\Users\jedrik\Projects\pickle-wb\tsconfig.json`
  Expected: 0 errors

- [ ] **Step 3: Commit**

```
git add src/components/admin/Sidebar.tsx
git commit -m "feat: add Settings link to admin sidebar"
```

---

## Task 5: Update `GCashPaymentCard` to use live settings

**Files:**
- Modify: `src/components/booking/GCashPaymentCard.tsx`
- Modify: `src/app/book/confirmation/page.tsx`

**Interfaces:**
- Consumes: `getGCashSettings()` from Task 2
- Produces: `GCashPaymentCard` is now a **server component** that receives `gcashNumber`, `gcashName`, `gcashQrUrl` as props (no more hardcoded values)

- [ ] **Step 1: Convert `GCashPaymentCard` to accept live-data props**

  Split the file:
  - `GCashPaymentCard` becomes a thin server component wrapper: receives `{ gcashNumber, gcashName, gcashQrUrl, bookingId, totalPrice, initialReference }`, passes them down to
  - `GCashPaymentCardClient` (rename the existing `"use client"` body) which keeps all the interactive state (copy, reference submit) and receives all values as props

  Remove the two hardcoded `const` lines:
  ```ts
  const gcashNumber = "0917-123-4567";
  const gcashName = "PICKLE CLUB INC / J*** D.";
  ```

  Fallback when values are null: show `"—"` for number/name; for QR image show a placeholder `<div>` with text "QR not configured — contact the venue".

- [ ] **Step 2: Update `src/app/book/confirmation/page.tsx`**

  `page.tsx` already imports `GCashPaymentCard`. Before rendering it, call `getGCashSettings()` (this is already a server component). Pass the result as props:

  ```tsx
  const gcashSettings = await getGCashSettings();
  // ...
  <GCashPaymentCard
    bookingId={booking.id}
    totalPrice={Number(booking.totalPrice)}
    initialReference={booking.paymentReference}
    gcashNumber={gcashSettings.gcash_number}
    gcashName={gcashSettings.gcash_name}
    gcashQrUrl={gcashSettings.gcash_qr_url}
  />
  ```

- [ ] **Step 3: Run type check + tests**

  ```
  npx tsc --noEmit -p c:\Users\jedrik\Projects\pickle-wb\tsconfig.json
  npm run test
  ```
  Expected: 0 errors, 13 tests pass

- [ ] **Step 4: Commit**

```
git add src/components/booking/GCashPaymentCard.tsx src/app/book/confirmation/page.tsx
git commit -m "feat: GCashPaymentCard reads live gcash details from site_settings"
```

