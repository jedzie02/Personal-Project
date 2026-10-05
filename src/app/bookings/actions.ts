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

    const reason = (formData.get("reason") as string) || "Cancelled by customer";

    const result = await cancelOwnBooking(profile!.id, bookingId, reason);

    if (!result.success) {
        redirect(`/bookings?error=${encodeURIComponent(result.error ?? "Could not cancel booking")}`);
    }

    revalidatePath("/bookings");
}