"use server";

import { redirect } from "next/navigation";
import { createBooking } from "@/lib/services/booking.service";
import { getCurrentProfile } from "@/lib/services/auth.server";
import { getCourtById } from "@/lib/services/court.service";
import { createCheckoutSession } from "@/lib/services/payment.service";

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

    // This is the FR-3.4 server-side re-validation: even though the
    // slot looked available when the review page rendered, someone
    // else could have booked it seconds ago. createBooking() runs the
    // overlap check again, right before inserting.
    const result = await createBooking({
        courtId,
        customerId: profile!.id,
        bookingDate: date,
        startTime: start,
        endTime: end,
        totalPrice,
        // markAsConfirmed intentionally omitted: customer bookings always
        // start 'pending'. Only the Stripe webhook (Phase 9) is allowed
        // to move a booking to 'confirmed'.
    });

    if (!result.success || !result.bookingId) {
        redirect(
            `/book?date=${date}&error=${encodeURIComponent(
                result.error ?? "That slot was just taken — please pick another."
            )}`
        );
    }

    // We need the court's name for the line item shown on Stripe's
    // hosted payment page — "Court 2" reads better to the customer
    // than a raw UUID.
    const court = await getCourtById(courtId);

    const checkout = await createCheckoutSession({
        bookingId: result.bookingId!,
        courtName: court?.name ?? "Court booking",
        bookingDate: date,
        startTime: start,
        endTime: end,
        totalPrice,
        customerEmail: profile!.email,
    });

    if (!checkout.success || !checkout.url) {
        // The booking DOES exist at this point (still 'pending'), it's
        // just that starting checkout failed — a Stripe outage, bad
        // config, etc. We send them to the confirmation page rather than
        // losing the booking entirely; a "retry payment" button for this
        // exact situation is a good candidate for Phase 11 polish.
        redirect(
            `/book/confirmation?bookingId=${result.bookingId}&paymentError=${encodeURIComponent(
                checkout.error ?? "Could not start payment"
            )}`
        );
    }

    // redirect() works the same for an external URL (Stripe's hosted
    // checkout page) as it does for one of our own routes — Next.js
    // just sends the browser there.
    redirect(checkout.url);
}