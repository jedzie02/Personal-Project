import { createBrowserClient } from "@supabase/ssr";

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

export function createClient() {
  const url = normalizeUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const key = normalizeKey(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in environment."
    );
  }

  return createBrowserClient(url, key);
}
