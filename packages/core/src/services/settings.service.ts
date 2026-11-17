import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export interface GCashSettings {
    gcash_number: string | null;
    gcash_name: string | null;
    gcash_qr_url: string | null;
}

const DEFAULT_GCASH_SETTINGS: GCashSettings = {
    gcash_number: "0917-123-4567",
    gcash_name: "PICKLE CLUB INC / J*** D.",
    gcash_qr_url: "/gcash-qr.jpg",
};

/**
 * Safely get the best available Supabase client.
 * Uses service role if present, otherwise falls back to authenticated server client.
 */
async function getDbClient() {
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
        try {
            return createAdminClient();
        } catch {
            // fallback
        }
    }
    return await createClient();
}

/**
 * Retrieve current GCash settings.
 * Falls back to default values if database table is empty or not yet migrated.
 */
export async function getGCashSettings(): Promise<GCashSettings> {
    try {
        const supabase = await getDbClient();

        const { data, error } = await supabase
            .from("site_settings")
            .select("gcash_number, gcash_name, gcash_qr_url")
            .eq("id", "gcash")
            .maybeSingle();

        if (error || !data) {
            return DEFAULT_GCASH_SETTINGS;
        }

        return {
            gcash_number: data.gcash_number || DEFAULT_GCASH_SETTINGS.gcash_number,
            gcash_name: data.gcash_name || DEFAULT_GCASH_SETTINGS.gcash_name,
            gcash_qr_url: data.gcash_qr_url || DEFAULT_GCASH_SETTINGS.gcash_qr_url,
        };
    } catch (err) {
        console.warn("Failed to retrieve site_settings:", err);
        return DEFAULT_GCASH_SETTINGS;
    }
}

/**
 * Uploads a QR code image.
 * Attempts Supabase Storage bucket 'settings' first (with auto-create).
 * If the bucket is not found or fails, gracefully falls back to storing as a
 * self-contained base64 data URL so saving always succeeds without blocking.
 */
export async function uploadGCashQR(file: File): Promise<{ url?: string; error?: string }> {
    try {
        const client = await getDbClient();
        const fileExt = file.name.split(".").pop()?.toLowerCase() || "png";
        const fileName = `gcash-qr-${Date.now()}.${fileExt}`;
        const filePath = `gcash/${fileName}`;

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        let uploadError: any = null;

        // 1. Try Supabase Storage upload
        try {
            const res = await client.storage
                .from("settings")
                .upload(filePath, buffer, {
                    contentType: file.type || "image/png",
                    upsert: true,
                });
            uploadError = res.error;

            // If bucket not found, attempt to auto-create the bucket
            if (uploadError && uploadError.message?.toLowerCase().includes("not found")) {
                const { error: createErr } = await client.storage.createBucket("settings", {
                    public: true,
                });
                if (!createErr) {
                    const retry = await client.storage
                        .from("settings")
                        .upload(filePath, buffer, {
                            contentType: file.type || "image/png",
                            upsert: true,
                        });
                    uploadError = retry.error;
                }
            }
        } catch (e: any) {
            uploadError = e;
        }

        // If storage upload succeeded, return the public CDN URL
        if (!uploadError) {
            const { data: publicData } = client.storage
                .from("settings")
                .getPublicUrl(filePath);

            if (publicData?.publicUrl) {
                return { url: publicData.publicUrl };
            }
        }

        // 2. Resilient Fallback: If bucket is not found or storage is unavailable,
        // encode image as a direct Data URL so it saves to postgres and renders immediately.
        const mimeType = file.type || "image/png";
        const dataUrl = `data:${mimeType};base64,${buffer.toString("base64")}`;
        return { url: dataUrl };
    } catch (err: any) {
        return { error: err?.message || "Storage upload failed" };
    }
}

/**
 * Save or update GCash configuration in site_settings.
 */
export async function saveGCashSettings(data: {
    gcash_number: string;
    gcash_name: string;
    gcash_qr_url?: string;
}): Promise<{ error?: string }> {
    try {
        const client = await getDbClient();

        const payload: Record<string, any> = {
            id: "gcash",
            gcash_number: data.gcash_number.trim(),
            gcash_name: data.gcash_name.trim(),
            updated_at: new Date().toISOString(),
        };

        if (data.gcash_qr_url) {
            payload.gcash_qr_url = data.gcash_qr_url;
        }

        const { error } = await client
            .from("site_settings")
            .upsert(payload, { onConflict: "id" });

        if (error) {
            if (error.message?.includes("site_settings") || error.message?.includes("schema cache")) {
                return {
                    error: "The 'site_settings' table does not exist in Supabase yet. Please run the migration SQL in your Supabase SQL Editor.",
                };
            }
            return { error: error.message };
        }

        return {};
    } catch (err: any) {
        return { error: err?.message || "Failed to save settings" };
    }
}
