import { createClient } from "@/lib/supabase/server";
import type {
    AvailableSlot,
    Booking,
    BookingFilters,
    CreateBookingResult,
    ServiceResult,
} from "@/lib/types/domain";
import { getActiveCourts } from "@/lib/services/court.service";
import { getOperatingHoursForDay } from "@/lib/services/schedule.service";
import { generateTimeSlots, doTimeRangesOverlap } from "@/lib/utils/date";
import {
    SLOT_DURATION_MINUTES,
    CANCELLATION_CUTOFF_HOURS,
    canCancelBooking,
} from "@/lib/config/booking-rules";

/**
 * booking.service.ts
 *
 * The core of the whole system. Everything about reading and
 * writing bookings lives here — the admin manual-booking form,
 * the customer booking flow (Phase 6), and the dashboard (Phase 10)
 * will all call into these same functions rather than duplicating
 * query logic in three places.
 */

// Raw shape coming back from Supabase, joined with court/profile data.
interface BookingRow {
    id: string;
    court_id: string;
    courts: { name: string } | null;
    customer_id: string;
    profiles: { full_name: string | null; email: string | null } | null;
    booking_date: string;
    start_time: string;
    end_time: string;
    status: string;
    payment_status?: string;
    total_price: number;
    cancelled_reason: string | null;
    created_at: string;
}

function mapBooking(row: BookingRow): Booking {
    return {
        id: row.id,
        courtId: row.court_id,
        courtName: row.courts?.name ?? "Unknown court",
        customerId: row.customer_id,
        customerName: row.profiles?.full_name ?? null,
        customerEmail: row.profiles?.email ?? null,
        bookingDate: row.booking_date,
        startTime: row.start_time,
        endTime: row.end_time,
        status: row.status as Booking["status"],
        paymentStatus: (row.payment_status as Booking["paymentStatus"]) || (row.status === "confirmed" ? "succeeded" : "pending"),
        totalPrice: Number(row.total_price),
        cancelledReason: row.cancelled_reason,
        createdAt: row.created_at,
    };
}

// The columns/joins shared by every query in this file. `courts(name)`
// and `profiles(full_name, email)` are Supabase's shorthand for a SQL
// JOIN — "also pull in the related row from that table, following the
// foreign key." This is what lets mapBooking() read row.courts.name
// above, instead of us running a second query per booking to look up
// the court's name.
const BOOKING_SELECT = `
  id, court_id, booking_date, start_time, end_time, status, payment_status,
  total_price, cancelled_reason, created_at, customer_id,
  courts ( name ),
  profiles ( full_name, email )
`;

/**
 * Checks whether a proposed booking would overlap an existing
 * pending/confirmed booking on the same court and date.
 *
 * The overlap condition (`existing.start < new.end AND existing.end > new.start`)
 * is the standard way to test whether two time ranges intersect —
 * it's easier to picture as "they do NOT overlap" first: that's true
 * only if one range ends before the other starts. This is just that,
 * negated.
 *
 * excludeBookingId is used when editing an existing booking, so it
 * doesn't flag itself as a conflict — not used yet in Phase 5, but
 * the parameter is here so Phase 7 doesn't need to change this
 * function's signature.
 */
export async function checkOverlap(
    courtId: string,
    bookingDate: string,
    startTime: string,
    endTime: string,
    excludeBookingId?: string
): Promise<boolean> {
    const supabase = await createClient();

    let query = supabase
        .from("bookings")
        .select("id")
        .eq("court_id", courtId)
        .eq("booking_date", bookingDate)
        .in("status", ["pending", "confirmed"])
        .lt("start_time", endTime)
        .gt("end_time", startTime);

    if (excludeBookingId) {
        query = query.neq("id", excludeBookingId);
    }

    const { data, error } = await query;

    if (error) {
        // Fail safe: if we can't even check, don't claim it's clear.
        return true;
    }

    return (data?.length ?? 0) > 0;
}

export interface CreateBookingInput {
    courtId: string;
    customerId: string;
    bookingDate: string;
    startTime: string;
    endTime: string;
    totalPrice: number;
    /**
     * True only when an admin explicitly confirms payment was handled
     * outside the system (cash, etc.) — per PR-6, this must be a
     * conscious choice, so it defaults to false (pending) everywhere
     * this function is called from.
     */
    markAsConfirmed?: boolean;
    paymentStatus?: "pending" | "succeeded" | "failed" | "refunded";
}

export async function createBooking(
    input: CreateBookingInput
): Promise<CreateBookingResult> {
    // --- Validation (Phase 11) ---
    // These guard against a request that never went through our own
    // UI at all — someone editing devtools, or POSTing directly to a
    // Server Action. The HTML `min`/`required` attributes on our forms
    // are a nice UX nicety, but they're not enforcement; this is.
    if (input.startTime >= input.endTime) {
        return { success: false, error: "End time must be after start time." };
    }

    if (input.totalPrice <= 0) {
        return { success: false, error: "Price must be greater than zero." };
    }

    const slotStart = new Date(`${input.bookingDate}T${input.startTime}`);
    if (Number.isNaN(slotStart.getTime())) {
        return { success: false, error: "Invalid date or time." };
    }

    // BR-5: bookings must be for a future date/time. This applies to
    // BOTH the customer flow and admin manual bookings, since createBooking
    // is the single shared entry point for creating a booking either way.
    if (slotStart.getTime() < Date.now()) {
        return { success: false, error: "Cannot book a time slot in the past." };
    }
    // --- End validation ---

    const supabase = await createClient();

    // Court status gate: only "Available" courts can be booked.
    // This blocks direct-POST attempts for maintenance/disabled courts.
    const { data: courtRow } = await supabase
        .from("courts")
        .select("status, is_active")
        .eq("id", input.courtId)
        .single();

    const courtStatus = courtRow?.status || (courtRow?.is_active ? "Available" : "Not Available");
    if (courtStatus !== "Available") {
        return {
            success: false,
            error: `This court is currently "${courtStatus}" and cannot be booked.`,
        };
    }

    const hasConflict = await checkOverlap(
        input.courtId,
        input.bookingDate,
        input.startTime,
        input.endTime
    );

    if (hasConflict) {
        return {
            success: false,
            error: "This court is already booked for part of that time range.",
        };
    }

    const { data, error } = await supabase
        .from("bookings")
        .insert({
            court_id: input.courtId,
            customer_id: input.customerId,
            booking_date: input.bookingDate,
            start_time: input.startTime,
            end_time: input.endTime,
            total_price: input.totalPrice,
            status: input.markAsConfirmed ? "confirmed" : "pending",
            payment_status: input.paymentStatus || (input.markAsConfirmed ? "succeeded" : "pending"),
        })
        .select("id")
        .single();

    if (error) {
        // Postgres error code 23P01 = "exclusion_violation" — this means
        // our checkOverlap() call above said the slot was clear, but by
        // the time this INSERT actually ran, someone else's booking beat
        // us to it. The database's exclusion constraint (Phase 7) is what
        // caught it. This is the rare race-condition case; everything
        // else in the normal flow gets caught earlier, by checkOverlap().
        if (error.code === "23P01") {
            return {
                success: false,
                error: "This court is already booked for part of that time range.",
            };
        }
        return { success: false, error: error.message };
    }

    return { success: true, bookingId: data.id };
}

export async function cancelBooking(
    id: string,
    reason: string
): Promise<ServiceResult> {
    const supabase = await createClient();

    const { error } = await supabase
        .from("bookings")
        .update({
            status: "cancelled",
            cancelled_reason: reason,
            updated_at: new Date().toISOString(),
        })
        .eq("id", id);

    if (error) {
        return { success: false, error: error.message };
    }

    return { success: true };
}

/**
 * Admin bookings list with optional filters (FR-8.1). Every filter
 * is optional — .eq()/.ilike() calls are only added to the query
 * when that filter was actually provided.
 */
export async function getAllBookings(
    filters: BookingFilters = {}
): Promise<Booking[]> {
    const supabase = await createClient();

    let query = supabase
        .from("bookings")
        .select(BOOKING_SELECT)
        .order("booking_date", { ascending: false })
        .order("start_time", { ascending: false });

    if (filters.dateFrom) query = query.gte("booking_date", filters.dateFrom);
    if (filters.dateTo) query = query.lte("booking_date", filters.dateTo);
    if (filters.courtId) query = query.eq("court_id", filters.courtId);
    if (filters.status) query = query.eq("status", filters.status);

    const { data, error } = await query;

    if (error || !data) return [];

    let results = (data as unknown as BookingRow[]).map(mapBooking);

    // Customer name/email search happens after the fetch rather than
    // in the query, since it needs to match across a joined table
    // (profiles) by partial text — simplest to filter in JS for now
    // given the expected data volume (single venue, not millions of rows).
    if (filters.customerSearch) {
        const term = filters.customerSearch.toLowerCase();
        results = results.filter(
            (b) =>
                b.customerName?.toLowerCase().includes(term) ||
                b.customerEmail?.toLowerCase().includes(term)
        );
    }

    return results;
}

export async function getTodaysBookings(): Promise<Booking[]> {
    const today = new Date().toISOString().split("T")[0];
    return getAllBookings({ dateFrom: today, dateTo: today });
}

export async function getBookingById(id: string): Promise<Booking | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("bookings")
        .select(BOOKING_SELECT)
        .eq("id", id)
        .single();

    if (error || !data) return null;

    return mapBooking(data as unknown as BookingRow);
}

/** A customer's own booking history — powers the "My Bookings" page. */
export async function getBookingsForCustomer(customerId: string): Promise<Booking[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("bookings")
        .select(BOOKING_SELECT)
        .eq("customer_id", customerId)
        .order("booking_date", { ascending: false })
        .order("start_time", { ascending: false });

    if (error || !data) return [];

    return (data as unknown as BookingRow[]).map(mapBooking);
}

/**
 * Raw pending/confirmed bookings for one date, across ALL courts —
 * this is the "existing commitments" half of the availability
 * calculation below. Kept lightweight (no joins) since we only need
 * court_id + the time range here, not customer/court names.
 */
async function getActiveBookingsForDate(
    date: string
): Promise<{ courtId: string; startTime: string; endTime: string }[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("bookings")
        .select("court_id, start_time, end_time")
        .eq("booking_date", date)
        .in("status", ["pending", "confirmed"]);

    if (error || !data) return [];

    return data.map((row) => ({
        courtId: row.court_id,
        startTime: row.start_time,
        endTime: row.end_time,
    }));
}

/**
 * The heart of the customer booking flow: "what can I actually book
 * on this date?" Combines two things computed elsewhere — operating
 * hours (Phase 4) and active bookings (this file) — rather than
 * trusting any stored "available" flag, per SRS Goal G5.
 *
 * Note: `new Date(date + "T00:00:00").getDay()` assumes the venue's
 * local timezone matches the server's. Per NFR-9 we're treating this
 * as a single-timezone system for now — worth revisiting in Phase 11
 * if the venue's timezone differs from wherever this app is hosted.
 */
export async function getAvailableSlotsForDate(date: string): Promise<AvailableSlot[]> {
    // All 7 days (Monday - Sunday) use the exact same 09:00 AM to 12:00 AM schedule
    const openTime = "09:00";
    const closeTime = "00:00";

    const [courts, activeBookings] = await Promise.all([
        getActiveCourts(),
        getActiveBookingsForDate(date),
    ]);

    const slots = generateTimeSlots(openTime, closeTime, SLOT_DURATION_MINUTES);

    return slots.map((slot) => {
        const availableCourts = courts.filter((court) => {
            // A court is unavailable for this slot if ANY active booking on
            // it overlaps the slot's time range — same overlap RULE as
            // checkOverlap() above (now literally the same tested function),
            // run in memory instead of as a query since we already fetched
            // everything for the whole day at once.
            const hasConflict = activeBookings.some(
                (booking) =>
                    booking.courtId === court.id &&
                    doTimeRangesOverlap(booking.startTime, booking.endTime, slot.start, slot.end)
            );
            return !hasConflict;
        });

        return {
            startTime: slot.start,
            endTime: slot.end,
            availableCourts: availableCourts.map((c) => ({ id: c.id, name: c.name })),
        };
    });
}

/**
 * Customer self-cancel, with the BR-7 cutoff enforced here in code
 * (RLS only enforces ownership + the pending/confirmed -> cancelled
 * transition — it has no easy way to express "more than N hours
 * before start time").
 */
export async function cancelOwnBooking(
    customerId: string,
    bookingId: string,
    reason: string
): Promise<ServiceResult> {
    const booking = await getBookingById(bookingId);

    if (!booking || booking.customerId !== customerId) {
        return { success: false, error: "Booking not found." };
    }

    if (booking.status !== "pending" && booking.status !== "confirmed") {
        return { success: false, error: "This booking can no longer be cancelled." };
    }

    if (!canCancelBooking(booking.bookingDate, booking.startTime)) {
        return {
            success: false,
            error: `Bookings can only be cancelled at least ${CANCELLATION_CUTOFF_HOURS} hours before the start time.`,
        };
    }

    // Reuses the same cancelBooking() the admin side already calls —
    // cancellation itself is identical either way, only who's allowed
    // to trigger it (and when) differs.
    return cancelBooking(bookingId, reason);
}

/** Finds a customer's profile id by email — used by the admin manual-booking form. */
export async function findCustomerIdByEmail(
    email: string
): Promise<{ id: string; fullName: string | null } | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name")
        .eq("email", email)
        .eq("role", "customer")
        .single();

    if (error || !data) return null;

    return { id: data.id, fullName: data.full_name };
}