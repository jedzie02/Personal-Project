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
function normalizeUrl(rawUrl?: string): string {
    if (!rawUrl) return "";
    let url = rawUrl.trim().replace(/^["']|["']$/g, "").trim();
    if (url && !url.startsWith("http://") && !url.startsWith("https://")) {
        url = `https://${url}`;
    }
    return url;
}

function normalizeKey(rawKey?: string): string {
    if (!rawKey) return "";
    return rawKey.trim().replace(/^["']|["']$/g, "").trim();
}

export function createAdminClient() {
    const url = normalizeUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
    const key = normalizeKey(process.env.SUPABASE_SERVICE_ROLE_KEY);

    if (!url || !key) {
        throw new Error(
            "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment."
        );
    }

    return createSupabaseClient(
        url,
        key,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        }
    );
}