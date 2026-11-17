import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Creates a Supabase client meant to run on the SERVER
 * (Server Components, Server Actions, Route Handlers).
 *
 * Supabase keeps track of who's logged in using cookies. On the
 * server, there's no "browser" to hold those cookies in memory —
 * so this client reads/writes them through Next.js's `cookies()`
 * helper instead. That's the whole reason this can't just be the
 * same file as client.ts.
 *
 * Call this fresh on every request (don't cache/reuse the instance
 * across requests) since it's tied to that request's cookies.
 */
function normalizeUrl(rawUrl?: string): string {
    if (!rawUrl) return "";
    let url = rawUrl.trim().replace(/^["']|["']$/g, "").trim();
    if (url && !url.startsWith("http://") && !url.startsWith("https://")) {
        url = `https://${url}`;
    }
    url = url.replace(/\/rest\/v1\/?$/, "");
    url = url.replace(/\/+$/, "");
    return url;
}

function normalizeKey(rawKey?: string): string {
    if (!rawKey) return "";
    return rawKey.trim().replace(/^["']|["']$/g, "").trim();
}

export async function createClient() {
    let cookieStore: any = null;
    try {
        cookieStore = await cookies();
    } catch {
        // Called outside an active Next.js request scope (e.g. scripts or background execution)
    }

    const url = normalizeUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
    const key = normalizeKey(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

    if (!url || !key) {
        throw new Error(
            "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in environment."
        );
    }

    return createServerClient(
        url,
        key,
        {
            cookies: {
                getAll() {
                    return cookieStore ? cookieStore.getAll() : [];
                },
                setAll(cookiesToSet) {
                    if (!cookieStore) return;
                    try {
                        cookiesToSet.forEach(({ name, value, options }) => {
                            cookieStore.set(name, value, options as CookieOptions);
                        });
                    } catch {
                        // setAll is called from a Server Component in some cases,
                        // where Next.js doesn't allow writing cookies. That's fine —
                        // middleware.ts (below) is responsible for actually refreshing
                        // the session cookie on those requests. This try/catch just
                        // stops that expected case from crashing the render.
                    }
                },
            },
        }
    );
}