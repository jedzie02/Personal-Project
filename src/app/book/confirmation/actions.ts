"use server";

import { revalidatePath } from "next/cache";
import { updateBookingPaymentReference } from "@/lib/services/booking.service";

export async function submitPaymentReferenceAction(
    bookingId: string,
    formData: FormData
): Promise<{ success: boolean; error?: string }> {
    const referenceNo = (formData.get("referenceNo") as string)?.trim();

    if (!referenceNo) {
        return { success: false, error: "Please enter your GCash reference number." };
    }

    // Clean any spaces or dashes from user input
    const sanitized = referenceNo.replace(/[\s-]/g, "");

    if (sanitized.length < 8 || sanitized.length > 20) {
        return {
            success: false,
            error: "GCash reference numbers are typically 13 digits (e.g. 1029 3847 5610 2).",
        };
    }

    const res = await updateBookingPaymentReference(bookingId, sanitized);

    if (!res.success) {
        return { success: false, error: res.error || "Failed to save reference number." };
    }

    revalidatePath("/book/confirmation");
    revalidatePath("/bookings");
    revalidatePath("/admin/bookings");
    revalidatePath("/admin/dashboard");

    return { success: true };
}
