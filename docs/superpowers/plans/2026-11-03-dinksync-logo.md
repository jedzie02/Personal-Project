# DinkSync Logo (Option A) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the Option A ("Paddle + Dink Arc") `<DinkSyncLogoMark />` component and `src/app/icon.svg` browser tab icon, replacing `CircleDotDashed` in the Navbar, Admin Sidebar, and Auth pages.

**Architecture:** A single reusable `src/components/DinkSyncLogo.tsx` component exporting `DinkSyncLogoMark` (configurable size) and `DinkSyncWordmark` (`Dink` + blue `Sync`), paired with `src/app/icon.svg` for Next.js App Router tab favicon.

**Tech Stack:** Next.js App Router, React, Tailwind CSS, inline SVG.

**Spec:** `docs/superpowers/specs/2026-11-03-dinksync-logo-design.md`

## Global Constraints

- Use crisp inline SVG (`viewBox="0 0 40 40"`) with Option A's royal-blue gradient badge (`#2563eb` to `#1d4ed8`), angled white paddle, emerald trajectory arc (`#34d399`), and gold 3-hole pickleball (`#fbbf24`).
- Remove `src/app/favicon.ico` so Next.js serves `src/app/icon.svg` without conflict.
- Do not commit or push until explicitly requested by the user.

## Review Focus

- Ensure `DinkSyncLogoMark` scales cleanly in both `Navbar.tsx` (`size-9`) and `Sidebar.tsx` (`size-8`) in light and dark modes.

---

### Task 1: Create `DinkSyncLogo.tsx` & `icon.svg` and Wire Into Navbar, Sidebar & Auth Pages

**Files:**
- Create: `src/components/DinkSyncLogo.tsx`
- Create: `src/app/icon.svg`
- Delete: `src/app/favicon.ico`
- Modify: `src/components/Navbar.tsx`
- Modify: `src/components/admin/Sidebar.tsx`
- Modify: `src/app/auth/login/page.tsx`
- Modify: `src/app/auth/signup/page.tsx`
- Modify: `src/app/login/page.tsx`

**Interfaces:**
- Produces: `DinkSyncLogoMark({ className?: string; svgClassName?: string })` in `src/components/DinkSyncLogo.tsx`

- [ ] **Step 1: Create `src/components/DinkSyncLogo.tsx` and `src/app/icon.svg`, and remove `src/app/favicon.ico`**
- [ ] **Step 2: Replace `CircleDotDashed` in `Navbar.tsx`, `Sidebar.tsx`, `auth/login/page.tsx`, `auth/signup/page.tsx`, and `login/page.tsx`**
- [ ] **Step 3: Run TypeScript and unit test verification (`npx vitest run ; npx tsc --noEmit`)**

