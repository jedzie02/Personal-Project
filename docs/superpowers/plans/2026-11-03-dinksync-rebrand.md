# DinkSync Platform Rebrand Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebrand all user-facing brand copy, metadata, admin headers, CSV filenames, and Gmail receipt templates from `Paddlix` to `DinkSync`.

**Architecture:** Direct text and template updates across 13 existing files, plus a unit test assertion in `email.service.test.ts` verifying `DinkSync` appears in generated receipt subjects and bodies.

**Tech Stack:** Next.js App Router, TypeScript, Vitest.

**Spec:** `docs/superpowers/specs/2026-11-03-dinksync-rebrand-design.md`

## Global Constraints

- Replace `Paddlix` with `DinkSync` and `play@paddlix.com` with `play@dinksync.com` across all 13 target files.
- Keep `localStorage` / `sessionStorage` / `CustomEvent` keys (`paddlix_pending_cart`, `paddlix:select-slot`) untouched so existing browser sessions and slot-selection events never break.
- Do not commit or push until explicitly requested by the user.

## Review Focus

- Receipt emails for both Court Bookings (`buildReceiptEmailContent`) and Open Play (`buildOpenPlayReceiptContent`) must display `DinkSync` in their subject, plain text, and HTML header.

---

### Task 1: Rebrand Receipt Emails & Public/Admin UI to DinkSync

**Files:**
- Modify: `src/lib/services/email.service.ts`
- Modify: `src/lib/services/email.service.test.ts`
- Modify: `src/app/layout.tsx`
- Modify: `src/components/Navbar.tsx`
- Modify: `src/app/page.tsx`
- Modify: `src/app/about/page.tsx`
- Modify: `src/app/privacy/page.tsx`
- Modify: `src/app/terms/page.tsx`
- Modify: `src/app/auth/login/page.tsx`
- Modify: `src/app/auth/signup/page.tsx`
- Modify: `src/app/login/page.tsx`
- Modify: `src/components/admin/Sidebar.tsx`
- Modify: `src/components/admin/ScheduleTimeline.tsx`
- Modify: `src/app/admin/payments/PaymentsLedger.tsx`

**Interfaces:**
- Consumes: `buildReceiptEmailContent`, `buildOpenPlayReceiptContent` in `src/lib/services/email.service.ts`
- Produces: `DinkSync` branding across all 13 files

- [ ] **Step 1: Add `DinkSync` brand assertions to `src/lib/services/email.service.test.ts`**
  Assert `expect(out.subject).toContain("DinkSync")` and `expect(out.html).toContain("DinkSync Official Receipt")` in both `buildReceiptEmailContent` and `buildOpenPlayReceiptContent` tests.

- [ ] **Step 2: Run test to verify it fails**
  Run: `npx vitest run src/lib/services/email.service.test.ts`
  Expected: FAIL (`"Paddlix Payment Receipt..."` does not contain `"DinkSync"`).

- [ ] **Step 3: Update `email.service.ts` and the 12 UI/metadata files from `Paddlix` to `DinkSync`**
  Replace `Paddlix` -> `DinkSync`, `play@paddlix.com` -> `play@dinksync.com`, and `paddlix-payments-` -> `dinksync-payments-`.

- [ ] **Step 4: Run unit tests and TypeScript check**
  Run: `npx vitest run ; npx tsc --noEmit`
  Expected: `41 passed`, `0` TypeScript errors.

