"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/lib/services/auth.server";
import { createClient } from "@/lib/supabase/server";
import { updateBookingPaymentReference } from "@/lib/services/booking.service";

export interface CompletePaymentResult {
    success: boolean;
    error?: string;
}

export async function completePaymentAction(bookingId: string): Promise<CompletePaymentResult> {
    if (!bookingId || typeof bookingId !== "string" || !bookingId.trim()) {
        return { success: false, error: "Missing booking identifier." };
    }

    const profile = await getCurrentProfile();
    if (!profile) {
        return { success: false, error: "Please log in to complete your payment." };
    }

    const cleanId = bookingId.trim();
    const referenceToken = `QRPH-${cleanId.slice(0, 8).toUpperCase()}`;

    // Transition status to confirmed and record QR Ph token
    try {
        const supabase = await createClient();
        await supabase
            .from("bookings")
            .update({
                status: "confirmed",
                payment_reference: referenceToken,
                updated_at: new Date().toISOString(),
            })
            .eq("id", cleanId);
    } catch {
        // Fallback to updateBookingPaymentReference if direct update fails
        await updateBookingPaymentReference(cleanId, referenceToken);
    }

    revalidatePath("/");
    revalidatePath("/book/confirmation");
    revalidatePath("/bookings");
    revalidatePath("/admin/bookings");
    revalidatePath("/admin/dashboard");

    return { success: true };
}
