import { createClient as createSupabaseClient } from "@supabase/supabase-js";

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
  const key =
    normalizeKey(process.env.SUPABASE_SERVICE_ROLE_KEY) ||
    normalizeKey(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment."
    );
  }

  return createSupabaseClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
