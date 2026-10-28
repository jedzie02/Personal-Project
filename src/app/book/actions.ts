"use server";

import { redirect } from "next/navigation";
import { createBooking } from "@/lib/services/booking.service";
import { getCurrentProfile } from "@/lib/services/auth.server";

export async function confirmBookingAction(prevState: unknown, formData: FormData) {
    // Re-check login here too, not just on the review page. The review
    // page's check stops a logged-out person from ever SEEING this
    // form, but this is the actual write — it needs its own guard,
    // since a page redirect doesn't stop someone from POSTing directly.
    const profile = await getCurrentProfile();
    if (!profile) {
        const courtId = formData.get("courtId") as string;
        const date = formData.get("date") as string;
        const start = formData.get("start") as string;
        const end = formData.get("end") as string;
        const returnUrl = `/book?date=${date}`;
        redirect(
            `/auth/login?message=${encodeURIComponent("Log in to finish booking your court")}&redirectTo=${encodeURIComponent(returnUrl)}`
        );
    }

    const courtId = formData.get("courtId") as string;
    const date = formData.get("date") as string;
    const start = formData.get("start") as string;
    const end = formData.get("end") as string;
    const totalPrice = Number(formData.get("totalPrice"));
    const paymentMethod = (formData.get("paymentMethod") as string) || "Cash walk in";

    const customerEmail = profile!.email || null;
    const rawName = profile!.full_name;
    const isGeneric =
        !rawName ||
        rawName.trim().toLowerCase() === "customer" ||
        rawName.trim().toLowerCase() === "customer user";
    const customerName =
        !isGeneric && rawName ? rawName.trim() : (customerEmail ? customerEmail.split("@")[0] : "Customer");

    // This is the FR-3.4 server-side re-validation: even though the
    // slot looked available when the review page rendered, someone
    // else could have booked it seconds ago. createBooking() runs the
    // overlap check again, right before inserting.
    const result = await createBooking({
        courtId,
        customerId: profile!.id,
        customerName,
        customerEmail: customerEmail ?? undefined,
        bookingDate: date,
        startTime: start,
        endTime: end,
        totalPrice,
        markAsConfirmed: true,
        paymentStatus: "pending",
        paymentMethod,
    });

    if (!result.success || !result.bookingId) {
        redirect(
            `/book?date=${date}&error=${encodeURIComponent(
                result.error ?? "That slot was just taken — please pick another."
            )}`
        );
    }

    redirect(`/book/confirmation?bookingId=${result.bookingId}`);
}
