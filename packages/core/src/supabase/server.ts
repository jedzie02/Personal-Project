import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

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

export async function createClient() {
  let cookieStore: any = null;
  try {
    cookieStore = await cookies();
  } catch {
    // Outside active Next.js request scope
  }

  const url = normalizeUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const key = normalizeKey(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in environment."
    );
  }

  return createServerClient(url, key, {
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
          // Ignore Server Component cookie set restrictions
        }
      },
    },
  });
}
