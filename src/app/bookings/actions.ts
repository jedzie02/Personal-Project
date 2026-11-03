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


export async function updateOwnPhoneClientAction(
    phone: string
): Promise<{ success: boolean; error?: string }> {
    const profile = await getCurrentProfile();
    if (!profile) {
        return { success: false, error: "Please log in to update your phone number." };
    }

    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const cleaned = phone.replace(/\D/g, "");

    if (!/^\d{11}$/.test(cleaned)) {
        return { success: false, error: "Phone number must be exactly 11 digits." };
    }

    const { error } = await supabase
        .from("profiles")
        .update({ phone: cleaned })
        .eq("id", profile.id);

    if (error) {
        return { success: false, error: error.message || "Could not update phone number." };
    }

    revalidatePath("/");
    revalidatePath("/bookings");
    revalidatePath("/admin/open-play");
    revalidatePath("/admin/customers");
    return { success: true };
}

export async function updateCustomerPhoneByAdminAction(
    customerId: string,
    formData: FormData
): Promise<void> {
    const { requireAdmin } = await import("@/lib/services/auth.server");
    await requireAdmin();

    const phone = String(formData.get("phone") ?? "").replace(/\D/g, "");
    if (!/^\d{11}$/.test(phone)) {
        return;
    }
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    await supabase
        .from("profiles")
        .update({ phone })
        .eq("id", customerId);

    revalidatePath(`/admin/customers/${customerId}`);
    revalidatePath("/admin/customers");
    revalidatePath("/admin/open-play");
}
