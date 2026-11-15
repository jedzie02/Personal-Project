# Supabase Custom SMTP Confirmation Email Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Configure custom Gmail SMTP and URL redirect whitelisting in the Supabase Dashboard to resolve sign-up confirmation email dispatch errors and verify end-to-end account registration.

**Architecture:** Supabase Auth is configured to route all authentication transactional emails (including user sign-up confirmation) through Gmail SMTP (`smtp.gmail.com:465`) using existing Google App Password credentials. Supabase URL Configuration is updated to allow callback redirects to `http://localhost:3000/auth/callback`.

**Tech Stack:** Supabase Auth, Google SMTP TLS/SSL, Next.js App Router ([src/app/auth/signup/page.tsx](file:///c:/Users/jedrik/Projects/pickle-wb/src/app/auth/signup/page.tsx), [src/app/auth/callback/route.ts](file:///c:/Users/jedrik/Projects/pickle-wb/src/app/auth/callback/route.ts), [src/app/auth/login/page.tsx](file:///c:/Users/jedrik/Projects/pickle-wb/src/app/auth/login/page.tsx)).

**Spec:** `docs/superpowers/specs/2026-11-15-supabase-custom-smtp-auth-design.md`

## Global Constraints

- Use exact credentials from `.env.local`: `GMAIL_USER=lamanilaojedrik01@gmail.com` and `GMAIL_APP_PASSWORD=eixz guwn vohy abnr`.
- Do not disable email confirmation in Supabase Auth settings.
- Do not alter client sign-up error-handling logic unless a regression or unhandled error state is uncovered during verification.

## Review Focus

- Supabase SMTP connection test fails if port 465 (SSL) or port 587 (TLS) mismatch Google SMTP protocol requirements.
- Confirmation email link redirects to an unlisted origin if `http://localhost:3000/**` is missing from Supabase Redirect URLs.
- User clicking confirmation link must be redirected to `/auth/login?confirmed=true` with the success banner displayed.
- Unconfirmed user attempting to log in must receive appropriate notice or error until the link is clicked.
- App codebase build and TypeScript checks must remain 100% green.

---

### Task 1: Configure Custom SMTP & URL Whitelist in Supabase Dashboard

**Files:**
- Reference: [.env.local](file:///c:/Users/jedrik/Projects/pickle-wb/.env.local#L4-L5)
- Reference: [src/app/auth/signup/page.tsx](file:///c:/Users/jedrik/Projects/pickle-wb/src/app/auth/signup/page.tsx#L45-L64)

- [ ] **Step 1: Open Supabase Project Authentication Settings**
  - Navigate to Supabase Dashboard: `https://supabase.com/dashboard/project/apfscgejxnmxgmnxxzrb`
  - In the left sidebar, click **Project Settings** (gear icon) -> **Authentication** (or **Authentication** -> **SMTP Settings**).

- [ ] **Step 2: Configure Custom SMTP Settings**
  - Toggle **Enable Custom SMTP** to `ON`.
  - Fill in the parameters:
    - **Sender email**: `lamanilaojedrik01@gmail.com`
    - **Sender name**: `DinkSync`
    - **Host**: `smtp.gmail.com`
    - **Port number**: `465` (SSL) (or `587` with TLS if requested by your Supabase UI)
    - **Username**: `lamanilaojedrik01@gmail.com`
    - **Password**: `eixz guwn vohy abnr` (Note: remove any spaces if prompted, or keep as 16 characters `eixzguwnvohyabnr`)
  - Click **Save**.

- [ ] **Step 3: Update URL Configuration**
  - In the left sidebar under **Authentication**, click **URL Configuration**.
  - Set **Site URL** to: `http://localhost:3000` (or your active production domain).
  - Under **Redirect URLs**, click **Add URL** and add:
    - `http://localhost:3000/**`
    - `http://localhost:3000/auth/callback`
  - Click **Save**.

---

### Task 2: End-to-End Verification of Sign-Up & Email Confirmation

**Files:**
- Reference: [src/app/auth/signup/page.tsx](file:///c:/Users/jedrik/Projects/pickle-wb/src/app/auth/signup/page.tsx)
- Reference: [src/app/auth/callback/route.ts](file:///c:/Users/jedrik/Projects/pickle-wb/src/app/auth/callback/route.ts)
- Reference: [src/app/auth/login/page.tsx](file:///c:/Users/jedrik/Projects/pickle-wb/src/app/auth/login/page.tsx)

- [ ] **Step 1: Run the Next.js development server or verify existing build**
  - Run: `npm run build`
  - Expected: Build succeeds with 0 errors.

- [ ] **Step 2: Trigger a test registration**
  - Navigate to `/auth/signup` in the browser.
  - Enter test account details:
    - Full Name: `Test Player`
    - Phone: `09171234567`
    - Email: (a test email address you can access)
    - Password: (minimum 6 characters)
  - Click **Sign Up**.
  - Expected: No `"Error sending confirmation email"`. The page cleanly redirects to `/auth/login?registered=true` showing the banner *"Account created! Please check your email inbox to confirm your email before signing in."*

- [ ] **Step 3: Confirm email delivery and callback exchange**
  - Open the inbox for the registered test email.
  - Locate the confirmation email sent from `lamanilaojedrik01@gmail.com` (Subject: `Confirm Your Signup` or similar).
  - Click the confirmation link in the email.
  - Expected: The link opens `http://localhost:3000/auth/callback?code=...` and cleanly redirects to `http://localhost:3000/auth/login?confirmed=true` showing *"✓ Email confirmed successfully! Please sign in with your credentials."*

- [ ] **Step 4: Verify login with confirmed account**
  - Enter the test account's email and password into the login form.
  - Click **Sign In**.
  - Expected: Authentication succeeds, profile record is linked, and user is redirected to the home page or customer dashboard.

