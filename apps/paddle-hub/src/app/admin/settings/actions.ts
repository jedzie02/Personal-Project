"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/services/auth.server";
import { uploadGCashQR, saveGCashSettings } from "@/lib/services/settings.service";

export async function saveGCashSettingsAction(formData: FormData): Promise<{ success?: boolean; error?: string }> {
    try { await requireAdmin(); } catch { return { error: "Unauthorized. Admin access required." }; }

    const gcashNumber = formData.get("gcash_number")?.toString().trim();
    const gcashName = formData.get("gcash_name")?.toString().trim();

    if (!gcashNumber || !gcashName) {
        return { error: "GCash number and account name are required." };
    }

    let gcashQrUrl: string | undefined = undefined;
    const qrFile = formData.get("qr_file") as File | null;

    if (qrFile && qrFile.size > 0) {
        if (!qrFile.type.startsWith("image/")) {
            return { error: "Uploaded QR file must be an image (PNG, JPG, WebP)." };
        }
        if (qrFile.size > 5 * 1024 * 1024) {
            return { error: "QR image must be smaller than 5MB." };
        }

        const uploadRes = await uploadGCashQR(qrFile);
        if (uploadRes.error || !uploadRes.url) {
            return { error: uploadRes.error || "Failed to upload QR code image." };
        }
        gcashQrUrl = uploadRes.url;
    }

    const saveRes = await saveGCashSettings({
        gcash_number: gcashNumber,
        gcash_name: gcashName,
        gcash_qr_url: gcashQrUrl,
    });

    if (saveRes.error) {
        return { error: saveRes.error };
    }

    revalidatePath("/admin/settings");
    revalidatePath("/book/confirmation");

    return { success: true };
}

