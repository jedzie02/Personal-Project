"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/services/auth.server";
import { cancelOwnBooking } from "@/lib/services/booking.service";

export async function cancelOwnBookingAction(bookingId: string, formData: FormData) {
    const profile = await getCurrentProfile();
    if (!profile) {
        redirect("/auth/login");
    }

    const reason = (formData.get("reason") as string)?.trim() || "Customer changed mind";

    const result = await cancelOwnBooking(profile!.id, bookingId, reason);

    if (!result.success) {
        redirect(`/bookings?error=${encodeURIComponent(result.error ?? "Could not cancel booking")}`);
    }

    revalidatePath("/bookings");
    revalidatePath("/");
}

export async function cancelOwnBookingClientAction(
    bookingId: string,
    reason: string = "Customer changed mind"
): Promise<{ success: boolean; error?: string }> {
    const profile = await getCurrentProfile();
    if (!profile) {
        return { success: false, error: "Please log in to manage your bookings." };
    }

    const result = await cancelOwnBooking(profile.id, bookingId, reason || "Customer changed mind");

    if (result.success) {
        revalidatePath("/bookings");
        revalidatePath("/");
    }

    return result;
}