"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/lib/services/auth.server";
import {
    startOpenPlayJoin,
    completeOpenPlayPayment,
    submitOpenPlayGCashReference,
    type OpenPlayPaymentMethod,
} from "@/lib/services/open-play.service";

export async function joinOpenPlayAction(
    sessionId: string,
    paymentMethod: OpenPlayPaymentMethod = "QR Ph"
): Promise<{ url?: string; error?: string; needsLogin?: boolean }> {
    const profile = await getCurrentProfile();
    if (!profile) {
        return { needsLogin: true };
    }

    const res = await startOpenPlayJoin(
        sessionId,
        profile.id,
        profile.email ?? null,
        paymentMethod
    );
    if (!res.ok) {
        return { error: res.error };
    }

    revalidatePath("/");
    revalidatePath("/open-play");
    revalidatePath("/bookings");
    revalidatePath("/admin/open-play");

    return { url: res.url };
}

export async function completeOpenPlayPaymentAction(
    entryId: string
): Promise<{ success: boolean; error?: string }> {
    if (!entryId || typeof entryId !== "string" || !entryId.trim()) {
        return { success: false, error: "Missing entry identifier." };
    }

    const profile = await getCurrentProfile();
    if (!profile) {
        return { success: false, error: "Please log in to complete your payment." };
    }

    const res = await completeOpenPlayPayment(entryId.trim(), profile.id);
    if (!res.ok) {
        return { success: false, error: res.error || "Failed to confirm payment." };
    }

    revalidatePath("/");
    revalidatePath("/open-play");
    revalidatePath("/open-play/payment");
    revalidatePath("/open-play/confirmation");
    revalidatePath("/bookings");
    revalidatePath("/admin/open-play");
    revalidatePath("/admin/dashboard");

    return { success: true };
}

export async function submitOpenPlayPaymentReferenceAction(
    entryId: string,
    formData: FormData
): Promise<{ success: boolean; error?: string }> {
    const profile = await getCurrentProfile();
    if (!profile) {
        return { success: false, error: "Please log in to submit a GCash reference number." };
    }

    const referenceNo = (formData.get("referenceNo") as string)?.trim();
    if (!referenceNo) {
        return { success: false, error: "Please enter your GCash reference number." };
    }

    const sanitized = referenceNo.replace(/[\s-]/g, "");
    if (sanitized.length < 8 || sanitized.length > 20) {
        return {
            success: false,
            error: "GCash reference numbers are typically 13 digits (e.g. 1029 3847 5610 2).",
        };
    }

    const res = await submitOpenPlayGCashReference(entryId, profile.id, sanitized);
    if (!res.ok) {
        return { success: false, error: res.error || "Failed to save reference number." };
    }

    revalidatePath("/open-play/confirmation");
    revalidatePath("/bookings");
    revalidatePath("/admin/open-play");

    return { success: true };
}
