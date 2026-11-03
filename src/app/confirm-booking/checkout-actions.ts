"use server";

import { createCheckoutSession } from "@/lib/services/payment.service";

export interface StartCardCheckoutInput {
    bookingId: string;
    totalPrice: number;
    courtName: string;
    bookingDate: string;
    startTime: string;
    endTime: string;
    customerEmail: string | null;
}

export async function startCardCheckoutAction(
    input: StartCardCheckoutInput
): Promise<{ url?: string; error?: string }> {
    const result = await createCheckoutSession({
        bookingId: input.bookingId,
        totalPrice: input.totalPrice,
        courtName: input.courtName,
        bookingDate: input.bookingDate,
        startTime: input.startTime,
        endTime: input.endTime,
        customerEmail: input.customerEmail,
    });

    if (result.success && result.url) {
        return { url: result.url };
    }

    return { error: result.error ?? "Could not start card checkout. Please try again." };
}

