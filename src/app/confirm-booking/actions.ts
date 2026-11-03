"use server";

import { createBooking, cancelBooking } from "@/lib/services/booking.service";
import { getCurrentProfile } from "@/lib/services/auth.server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { getManilaNow } from "@/lib/utils/date";
import type { BookingSegment } from "@/lib/utils/court-jump";

export interface ConfirmBookingInput {
    courtId: string;
    courtName?: string;
    timeSlot?: string;
    date?: string;
    start?: string;
    end?: string;
    rate: number;
    paymentMethod: string;
    userId?: string;
    userEmail?: string;
    userName?: string;
    segments?: BookingSegment[];
}

export interface ConfirmBookingResult {
    success: boolean;
    bookingId?: string;
    error?: string;
    needsLogin?: boolean;
}

export async function submitConfirmBooking(input: ConfirmBookingInput): Promise<ConfirmBookingResult> {
    const supabase = await createServerClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    const profile = await getCurrentProfile();

    const customerId = user?.id || profile?.id || input.userId;
    if (!customerId) {
        return {
            success: false,
            needsLogin: true,
            error: "Please log in to confirm your booking.",
        };
    }

    const customerEmail = user?.email || profile?.email || input.userEmail || null;
    const rawName =
        user?.user_metadata?.full_name ||
        user?.user_metadata?.name ||
        profile?.full_name ||
        input.userName;
    const isGeneric =
        !rawName ||
        rawName.trim().toLowerCase() === "customer" ||
        rawName.trim().toLowerCase() === "customer user";
    const customerName =
        !isGeneric && rawName ? rawName.trim() : (customerEmail ? customerEmail.split("@")[0] : "Customer");

    // Ensure public.profiles has the user's latest name and email
    try {
        const { data: existingProfile } = await supabase
            .from("profiles")
            .select("id, full_name, email")
            .eq("id", customerId)
            .maybeSingle();

        if (!existingProfile) {
            await supabase.from("profiles").insert({
                id: customerId,
                email: customerEmail,
                full_name: customerName,
                role: "customer",
            });
        } else if (!existingProfile.full_name || existingProfile.full_name === "Customer" || !existingProfile.email) {
            await supabase
                .from("profiles")
                .update({
                    full_name: customerName,
                    email: customerEmail,
                })
                .eq("id", customerId);
        }
    } catch {
        // Continue if RLS restricts server profile write
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
                const match = val.match(/(\d+):(\d+)(?:\s*(AM|PM))?/i);
                if (match) {
                    let h = parseInt(match[1], 10);
                    const m = match[2];
                    const ampm = match[3]?.toUpperCase();
                    if (ampm === "PM" && h < 12) h += 12;
                    if (ampm === "AM" && h === 12) h = 0;
                    return `${h.toString().padStart(2, "0")}:${m}`;
                }
                return val;
            };
            startTime = parseAmPm(parts[0]);
            endTime = parseAmPm(parts[1]);
            if (startTime === "23:00" && endTime === "12:00") {
                endTime = "00:00";
            }
        }
    }

    if (!startTime || !endTime) {
        return { success: false, error: "Invalid time slot selected." };
    }

    if (input.segments && input.segments.length > 0) {
        // Group consecutive segments on the same court into contiguous blocks
        const mergedBlocks: {
            courtId: string;
            start: string;
            end: string;
            totalPrice: number;
        }[] = [];

        for (const seg of input.segments) {
            const prev = mergedBlocks[mergedBlocks.length - 1];
            if (prev && prev.courtId === seg.courtId && prev.end === seg.hour) {
                prev.end = seg.endHour;
                prev.totalPrice += seg.hourlyRate;
            } else {
                mergedBlocks.push({
                    courtId: seg.courtId,
                    start: seg.hour,
                    end: seg.endHour,
                    totalPrice: seg.hourlyRate,
                });
            }
        }

        // Shared payment reference linking court-jump segments together
        const paymentReference = mergedBlocks.length > 1
            ? `REF-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
            : undefined;

        const createdBookingIds: string[] = [];

        for (const block of mergedBlocks) {
            const res = await createBooking({
                courtId: block.courtId,
                customerId,
                customerName,
                customerEmail: customerEmail ?? undefined,
                bookingDate,
                startTime: block.start,
                endTime: block.end,
                totalPrice: block.totalPrice,
                markAsConfirmed: true,
                paymentStatus: "pending",
                paymentMethod: input.paymentMethod || "Cash walk in",
                paymentReference,
            });

            if (!res.success || !res.bookingId) {
                await Promise.all(
                    createdBookingIds.map((id) =>
                        cancelBooking(id, "Booking cancelled due to partial reservation failure")
                    )
                );
                return {
                    success: false,
                    error: res.error ?? "Failed to reserve slot. One of the continuous hours was just booked.",
                };
            }
            createdBookingIds.push(res.bookingId);
        }

        return {
            success: true,
            bookingId: createdBookingIds[0],
        };
    }

    const result = await createBooking({
        courtId: input.courtId,
        customerId,
        customerName,
        customerEmail: customerEmail ?? undefined,
        bookingDate,
        startTime,
        endTime,
        totalPrice: Number(input.rate) || 300,
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
