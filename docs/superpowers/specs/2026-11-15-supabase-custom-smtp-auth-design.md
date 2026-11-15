# Supabase Custom SMTP Confirmation Email Design

## Intent & Why
During user signup on `/auth/signup`, Supabase Auth fails with `"Error sending confirmation email"` because Supabase's default mailer has strict rate limits (3/hour) and low reliability. To reliably deliver sign-up confirmation emails so users can verify their accounts, we configure custom SMTP in the Supabase project dashboard using the existing Gmail credentials.

## Goals, Non-Goals & Anti-Goals
- **Goals**:
  - Enable reliable sign-up confirmation email dispatch directly from Supabase Auth using custom Gmail SMTP.
  - Retain full email verification flow so users must verify their email before logging in.
  - Ensure redirect URLs in Supabase allow seamless verification callback to `/auth/callback` in local and production environments.
- **Non-Goals**:
  - Setting up a custom DNS domain or paid third-party email provider like Resend at this stage.
  - Disabling email verification in Supabase Auth.
- **Anti-Goals**:
  - Rewriting or modifying application authentication logic when client-side signup and callback routes already support email verification properly.

## Constraints
- Supabase Auth is cloud-hosted at `https://apfscgejxnmxgmnxxzrb.supabase.co`; SMTP settings cannot be modified via local git code or environment variables alone and must be configured via the Supabase Dashboard.
- Gmail SMTP requires TLS/SSL and a 16-character Google App Password (free limit of 500 emails/day).

## Approaches Considered
1. **Approach 1: Gmail SMTP with existing App Password (Chosen)**
   - *Pros*: Zero cost, uses already working credentials in `.env.local`, no DNS record management required.
   - *Tradeoffs*: Sender address is `@gmail.com` rather than a custom domain; capped at 500 emails/day.
2. **Approach 2: Dedicated transactional service (Resend / SendGrid)**
   - *Pros*: Custom branded domain (`noreply@dinksync.com`) and deliverability metrics.
   - *Tradeoffs*: Requires domain ownership, DNS record verification (SPF/DKIM), and account creation.

## Decided Design
- **Supabase SMTP Configuration** (in Supabase Dashboard > Project Settings > Authentication > SMTP Settings):
  - **Enable Custom SMTP**: `ON`
  - **Sender Email**: `lamanilaojedrik01@gmail.com`
  - **Sender Name**: `DinkSync`
  - **Host**: `smtp.gmail.com`
  - **Port Number**: `465` (SSL) or `587` (TLS)
  - **Username**: `lamanilaojedrik01@gmail.com`
  - **Password**: `eixz guwn vohy abnr` (from `.env.local`)
- **Supabase URL Configuration** (in Supabase Dashboard > Authentication > URL Configuration):
  - **Site URL**: `http://localhost:3000` (or production domain)
  - **Redirect URLs**: Add `http://localhost:3000/**` and `http://localhost:3000/auth/callback` (plus production equivalents)
- **Application Code**:
  - [src/app/auth/signup/page.tsx](file:///c:/Users/jedrik/Projects/pickle-wb/src/app/auth/signup/page.tsx) and [src/app/auth/callback/route.ts](file:///c:/Users/jedrik/Projects/pickle-wb/src/app/auth/callback/route.ts) already handle the flow and require no alterations.

## What's Left to the Builder
- Provide the user with the exact step-by-step walkthrough and copy-paste values for the Supabase Dashboard.
- Provide a signup verification test checklist to confirm end-to-end receipt of the confirmation email and successful sign-in.

