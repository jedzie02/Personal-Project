"use server";

import { createBooking } from "@/lib/services/booking.service";
import { getCurrentProfile } from "@/lib/services/auth.server";
import { getManilaNow } from "@/lib/utils/date";

export interface ConfirmBookingInput {
    courtId: string;
    courtName?: string;
    timeSlot?: string;
    date?: string;
    start?: string;
    end?: string;
    rate: number;
    paymentMethod: string;
}

export interface ConfirmBookingResult {
    success: boolean;
    bookingId?: string;
    error?: string;
    needsLogin?: boolean;
}

export async function submitConfirmBooking(input: ConfirmBookingInput): Promise<ConfirmBookingResult> {
    const profile = await getCurrentProfile();
    if (!profile) {
        return {
            success: false,
            needsLogin: true,
            error: "Please log in to confirm your booking.",
        };
    }

    let bookingDate = input.date;
    let startTime = input.start;
    let endTime = input.end;

    if (!bookingDate) {
        bookingDate = getManilaNow().todayISO;
    }

    if (!startTime || !endTime) {
        // Fallback: parse from timeSlot e.g. "11:00 AM - 12:00 PM"
        if (input.timeSlot && input.timeSlot.includes("-")) {
            const parts = input.timeSlot.split("-").map((s) => s.trim());
            const parseAmPm = (val: string) => {
                const match = val.match(/(\d+):(\d+)\s*(AM|PM)/i);
                if (match) {
                    let h = parseInt(match[1], 10);
                    const m = match[2];
                    const ampm = match[3].toUpperCase();
                    if (ampm === "PM" && h < 12) h += 12;
                    if (ampm === "AM" && h === 12) h = 0;
                    return `${h.toString().padStart(2, "0")}:${m}`;
                }
                return val;
            };
            startTime = parseAmPm(parts[0]);
            endTime = parseAmPm(parts[1]);
        }
    }

    if (!startTime || !endTime) {
        return { success: false, error: "Invalid time slot selected." };
    }

    const result = await createBooking({
        courtId: input.courtId,
        customerId: profile.id,
        bookingDate,
        startTime,
        endTime,
        totalPrice: Number(input.rate) || 25,
        markAsConfirmed: true,
        paymentStatus: "pending",
        paymentMethod: input.paymentMethod || "Cash walk in",
    });

    if (!result.success || !result.bookingId) {
        return {
            success: false,
            error: result.error ?? "Failed to reserve slot. That time may have just been booked.",
        };
    }

    return {
        success: true,
        bookingId: result.bookingId,
    };
}
