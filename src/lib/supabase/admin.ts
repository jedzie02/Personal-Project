import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * A Supabase client authenticated with the SERVICE ROLE key instead
 * of the anon key. This bypasses Row Level Security entirely — it
 * can read and write ANY row, regardless of what any RLS policy
 * says.
 *
 * ONLY use this where there is genuinely no logged-in user to act
 * as — like the Stripe webhook below, which is Stripe's own servers
 * calling us directly, not a customer using the app. For every other
 * piece of server code (Server Components, Server Actions, normal
 * pages), keep using lib/supabase/server.ts instead, so RLS keeps
 * doing its job.
 *
 * SUPABASE_SERVICE_ROLE_KEY has no NEXT_PUBLIC_ prefix on purpose —
 * that's what keeps Next.js from ever bundling it into browser code.
 * If this key leaked to the client, anyone could read/write your
 * entire database, bypassing every policy we've written so far.
 */
export function createAdminClient() {
    return createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        }
    );
}