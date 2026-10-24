import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Next.js middleware runs BEFORE every matched request reaches a
 * page or API route. We use it for two things:
 *
 * 1. **Session refresh** — Supabase auth tokens expire. Calling
 *    `getUser()` here forces a token refresh on every navigation,
 *    so the user's session stays alive without them noticing. This
 *    is the standard pattern from the Supabase + Next.js docs.
 *
 * 2. **Route protection** — after confirming who the user is, we
 *    apply two guard rules:
 *      • Unauthenticated user hitting /admin/* → /auth/login
 *      • Non-admin user hitting /admin/*      → /
 *
 *    NOTE: The post-login redirect to /admin is handled in loginAction
 *    itself (not here) to avoid cookie-timing issues with server-side
 *    redirect chains.
 *
 * Why middleware instead of checking in every page? Because
 * middleware intercepts the request before the page even starts
 * rendering — the user never sees a flash of unauthorized content,
 * and we avoid duplicating auth checks across dozens of pages.
 *
 * NOTE: We CAN'T reuse the `createClient` from lib/supabase/server.ts
 * here, because that one reads cookies via `next/headers` `cookies()`,
 * which isn't available in middleware. Middleware receives the raw
 * request/response objects, so we build a Supabase client that reads
 * and writes cookies through those instead.
 */
export async function proxy(request: NextRequest) {
    // Start with a "pass-through" response that carries the original
    // request forward. We hold onto this variable (let, not const)
    // because Supabase's cookie-refresh logic may need to replace it
    // with a new response that has updated cookie headers.
    let supabaseResponse = NextResponse.next({ request });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        console.error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in middleware.");
        return supabaseResponse;
    }

    try {
        const supabase = createServerClient(
            supabaseUrl,
            supabaseAnonKey,
            {
                cookies: {
                    getAll() {
                        return request.cookies.getAll();
                    },
                    setAll(cookiesToSet) {
                        cookiesToSet.forEach(({ name, value }) =>
                            request.cookies.set(name, value)
                        );
                        supabaseResponse = NextResponse.next({ request });
                        cookiesToSet.forEach(({ name, value, options }) =>
                            supabaseResponse.cookies.set(name, value, options)
                        );
                    },
                },
            }
        );

        // --- Session refresh (always runs) ---
        const {
            data: { user },
        } = await supabase.auth.getUser();

        const pathname = request.nextUrl.pathname;

        // --- Unauthenticated user trying to access /admin/* ---
        if (!user && pathname.startsWith("/admin")) {
            const url = request.nextUrl.clone();
            url.pathname = "/auth/login";
            url.searchParams.set("redirectTo", pathname);
            return NextResponse.redirect(url);
        }

        // --- Non-admin guard for /admin/* ---
        // Only query the profile when the route actually needs a role check.
        if (user && pathname.startsWith("/admin")) {
            const { data: profile } = await supabase
                .from("profiles")
                .select("role")
                .eq("id", user.id)
                .single();

            const isAdmin = profile?.role === "admin";

            // Non-admin trying to access /admin/* → bounce to homepage
            if (!isAdmin) {
                const url = request.nextUrl.clone();
                url.pathname = "/";
                return NextResponse.redirect(url);
            }
        }
    } catch (err) {
        console.error("Middleware auth verification failed:", err);
    }

    // Everything else: let the request through with refreshed cookies.
    return supabaseResponse;
}

/**
 * The matcher tells Next.js which routes this middleware should run on.
 * This regex excludes static assets (_next/static, images, favicon)
 * so we don't waste time refreshing sessions on CSS/JS/image requests.
 */
export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};
/* YES */