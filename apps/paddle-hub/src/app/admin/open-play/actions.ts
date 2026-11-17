"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/services/auth.server";
import {
    createOpenPlaySession,
    cancelOpenPlaySession,
    markOpenPlayEntryPaidByAdmin,
    markOpenPlayEntryRefundedByAdmin,
} from "@/lib/services/open-play.service";

export async function createOpenPlaySessionAction(
    formData: FormData
): Promise<{ ok: boolean; error?: string }> {
    const profile = await requireAdmin();

    const courtId = String(formData.get("courtId") ?? "").trim();
    const date = String(formData.get("date") ?? "").trim();
    const startTime = String(formData.get("startTime") ?? "").trim();
    const endTime = String(formData.get("endTime") ?? "").trim();
    const pricePerPlayer = Number(formData.get("pricePerPlayer"));
    const playerCap = Number(formData.get("playerCap"));

    const res = await createOpenPlaySession(
        {
            courtId,
            date,
            startTime,
            endTime,
            pricePerPlayer,
            playerCap,
        },
        profile.id
    );

    if (!res.ok) {
        return { ok: false, error: res.error };
    }

    revalidatePath("/admin/open-play");
    revalidatePath("/admin/schedule");
    revalidatePath("/admin/bookings");
    revalidatePath("/");
    return { ok: true };
}

export async function cancelOpenPlaySessionAction(
    sessionId: string
): Promise<{ ok: boolean; error?: string }> {
    await requireAdmin();

    const res = await cancelOpenPlaySession(sessionId);
    if (!res.ok) {
        return { ok: false, error: res.error };
    }

    revalidatePath("/admin/open-play");
    revalidatePath("/admin/schedule");
    revalidatePath("/admin/bookings");
    revalidatePath("/");
    return { ok: true };
}

export async function markOpenPlayEntryPaidAction(
    entryId: string
): Promise<{ ok: boolean; error?: string }> {
    await requireAdmin();

    const res = await markOpenPlayEntryPaidByAdmin(entryId);
    if (!res.ok) {
        return { ok: false, error: res.error };
    }

    revalidatePath("/admin/open-play");
    revalidatePath("/admin/payments");
    revalidatePath("/bookings");
    revalidatePath("/open-play/confirmation");
    revalidatePath("/");
    return { ok: true };
}

export async function markOpenPlayEntryRefundedAction(
    entryId: string
): Promise<{ ok: boolean; error?: string }> {
    await requireAdmin();

    const res = await markOpenPlayEntryRefundedByAdmin(entryId);
    if (!res.ok) {
        return { ok: false, error: res.error };
    }

    revalidatePath("/admin/open-play");
    revalidatePath("/admin/payments");
    revalidatePath("/bookings");
    revalidatePath("/open-play/confirmation");
    revalidatePath("/");
    return { ok: true };
}
