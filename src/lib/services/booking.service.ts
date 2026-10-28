import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
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
import { getCustomerDisplayName } from "@/lib/services/customer.service";

async function getDbClient() {
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
        try {
            return createAdminClient();
        } catch {
            // fallback
        }
    }
    return await createClient();
}

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
    payment_method?: string;
    payment_reference?: string | null;
    total_price: number;
    cancelled_reason: string | null;
    created_at: string;
}

function mapBooking(
    row: BookingRow,
    profileMap?: Map<string, { full_name: string | null; email: string | null }>
): Booking {
    let paymentRef = row.payment_reference || null;
    let paymentMethod = row.payment_method || "Cash walk in";

    // Extract reference if encoded in paymentMethod fallback format "GCash QR (Ref: XXXXX)"
    if (!paymentRef && paymentMethod.includes("Ref:")) {
        const parts = paymentMethod.split("Ref:");
        paymentRef = parts[1]?.replace(/[()]/g, "").trim() || null;
        paymentMethod = "GCash QR";
    }

    const effectiveCustomerId = row.customer_id || null;
    const directProfile = row.customer_id && profileMap ? profileMap.get(row.customer_id) : null;
    const profile = directProfile || row.profiles;

    const customerName = getCustomerDisplayName(profile?.full_name, effectiveCustomerId, profile?.email);
    const customerEmail = profile?.email || null;

    return {
        id: row.id,
        courtId: row.court_id,
        courtName: row.courts?.name ?? "Unknown court",
        customerId: effectiveCustomerId ?? "",
        customerName,
        customerEmail,
        bookingDate: row.booking_date,
        startTime: row.start_time,
        endTime: row.end_time,
        status: row.status as Booking["status"],
        paymentStatus: (row.payment_status as Booking["paymentStatus"]) || (row.status === "confirmed" ? "succeeded" : "pending"),
        paymentMethod,
        paymentReference: paymentRef,
        totalPrice: Number(row.total_price),
        cancelledReason: row.cancelled_reason,
        createdAt: row.created_at,
    };
}

// The columns/joins shared by every query in this file.
const BOOKING_SELECT = `
  id, court_id, booking_date, start_time, end_time, status, payment_status, payment_method,
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
    customerName?: string;
    customerEmail?: string;
    /**
     * True only when an admin explicitly confirms payment was handled
     * outside the system (cash, etc.) — per PR-6, this must be a
     * conscious choice, so it defaults to false (pending) everywhere
     * this function is called from.
     */
    markAsConfirmed?: boolean;
    paymentStatus?: "pending" | "succeeded" | "failed" | "refunded";
    paymentMethod?: string;
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

    const timeFormatted = input.startTime.length === 5 ? `${input.startTime}:00` : input.startTime;
    const slotStart = new Date(`${input.bookingDate}T${timeFormatted}+08:00`);
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

    // Ensure customer profile row exists in public.profiles with valid name and email
    if (input.customerId) {
        try {
            const { data: existingProfile } = await supabase
                .from("profiles")
                .select("id, full_name, email")
                .eq("id", input.customerId)
                .maybeSingle();

            const currentName = existingProfile?.full_name?.trim();
            const currentEmail = existingProfile?.email?.trim();
            const isGeneric =
                !currentName ||
                currentName.toLowerCase() === "customer" ||
                currentName.toLowerCase() === "customer user";

            const nameToSet =
                input.customerName ||
                (!isGeneric && currentName ? currentName : input.customerEmail?.split("@")[0] || "Customer");
            const emailToSet = input.customerEmail || currentEmail;

            if (!existingProfile) {
                await supabase.from("profiles").insert({
                    id: input.customerId,
                    full_name: nameToSet,
                    email: emailToSet,
                    role: "customer",
                });
            } else if (isGeneric || !currentEmail) {
                await supabase
                    .from("profiles")
                    .update({
                        full_name: nameToSet,
                        email: emailToSet,
                    })
                    .eq("id", input.customerId);
            }
        } catch {
            // ignore if permissions prevent direct upsert
        }
    }

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

    const bookingPayload: Record<string, any> = {
        court_id: input.courtId,
        customer_id: input.customerId,
        booking_date: input.bookingDate,
        start_time: input.startTime,
        end_time: input.endTime,
        total_price: input.totalPrice,
        status: input.markAsConfirmed ? "confirmed" : "pending",
        payment_status: input.paymentStatus || (input.markAsConfirmed ? "succeeded" : "pending"),
        payment_method: input.paymentMethod || "Cash walk in",
    };

    const { data, error } = await supabase
        .from("bookings")
        .insert(bookingPayload)
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
        return { success: false, error: error?.message || "Booking creation failed." };
    }

    if (!data) {
        return { success: false, error: "No booking record returned." };
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

export async function updateBookingPaymentReference(
    bookingId: string,
    referenceNo: string
): Promise<ServiceResult> {
    const supabase = await createClient();
    const cleanRef = referenceNo.trim();

    // 1. Try updating direct payment_reference column
    const { error } = await supabase
        .from("bookings")
        .update({
            payment_reference: cleanRef,
            updated_at: new Date().toISOString(),
        })
        .eq("id", bookingId);

    // 2. If column doesn't exist in Supabase yet (Postgres code 42703), fallback to encoding in payment_method
    if (error) {
        const fallback = await supabase
            .from("bookings")
            .update({
                payment_method: `GCash QR (Ref: ${cleanRef})`,
                updated_at: new Date().toISOString(),
            })
            .eq("id", bookingId);

        if (fallback.error) {
            return { success: false, error: fallback.error.message };
        }
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
    const supabase = await getDbClient();

    let query = supabase
        .from("bookings")
        .select(BOOKING_SELECT)
        .order("booking_date", { ascending: false })
        .order("start_time", { ascending: false });

    if (filters.dateFrom) query = query.gte("booking_date", filters.dateFrom);
    if (filters.dateTo) query = query.lte("booking_date", filters.dateTo);
    if (filters.courtId) query = query.eq("court_id", filters.courtId);
    if (filters.status) query = query.eq("status", filters.status);

    let { data, error } = await query;
    let rawBookings: any[] | null = data;

    // Resilient fallback if relationship join had PostgREST ambiguity
    if (error || !rawBookings) {
        let fallbackQuery = supabase
            .from("bookings")
            .select(`
                id, court_id, booking_date, start_time, end_time, status, payment_status, payment_method,
                total_price, cancelled_reason, created_at, customer_id,
                courts ( name )
            `)
            .order("booking_date", { ascending: false })
            .order("start_time", { ascending: false });

        if (filters.dateFrom) fallbackQuery = fallbackQuery.gte("booking_date", filters.dateFrom);
        if (filters.dateTo) fallbackQuery = fallbackQuery.lte("booking_date", filters.dateTo);
        if (filters.courtId) fallbackQuery = fallbackQuery.eq("court_id", filters.courtId);
        if (filters.status) fallbackQuery = fallbackQuery.eq("status", filters.status);

        const retry = await fallbackQuery;
        rawBookings = retry.data as any[];
    }

    if (!rawBookings) return [];

    // Direct profile lookup to guarantee accurate customerName and customerEmail
    const customerIds = Array.from(
        new Set(
            rawBookings
                .map((row) => row.customer_id)
                .filter(Boolean)
        )
    );

    const profileMap = new Map<string, { full_name: string | null; email: string | null }>();
    if (customerIds.length > 0) {
        const { data: profileRows } = await supabase
            .from("profiles")
            .select("id, full_name, email")
            .in("id", customerIds);

        for (const p of profileRows || []) {
            profileMap.set(p.id, { full_name: p.full_name, email: p.email });
        }
    }

    let results = rawBookings.map((row) => mapBooking(row as BookingRow, profileMap));

    // Customer name/email search happens after the fetch rather than
    // in the query, since it needs to match across a joined table
    // (profiles) by partial text — simplest to filter in JS for now
    // given the expected data volume (single venue, not millions of rows).
    if (filters.customerSearch) {
        const term = filters.customerSearch.toLowerCase();
        results = results.filter(
            (b) =>
                b.customerName?.toLowerCase().includes(term) ||
                b.customerEmail?.toLowerCase().includes(term) ||
                b.paymentReference?.toLowerCase().includes(term) ||
                b.id.toLowerCase().includes(term)
        );
    }

    return results;
}

export async function getTodaysBookings(): Promise<Booking[]> {
    const today = new Date().toISOString().split("T")[0];
    return getAllBookings({ dateFrom: today, dateTo: today });
}

export async function getBookingById(id: string): Promise<Booking | null> {
    const supabase = await getDbClient();

    let { data, error } = await supabase
        .from("bookings")
        .select(BOOKING_SELECT)
        .eq("id", id)
        .single();

    let rawBooking: any = data;

    if (error || !rawBooking) {
        const retry = await supabase
            .from("bookings")
            .select(`
                id, court_id, booking_date, start_time, end_time, status, payment_status, payment_method,
                total_price, cancelled_reason, created_at, customer_id,
                courts ( name )
            `)
            .eq("id", id)
            .single();
        rawBooking = retry.data;
    }

    if (!rawBooking) return null;

    const row = rawBooking as BookingRow;
    const cid = row.customer_id;
    let profileMap: Map<string, { full_name: string | null; email: string | null }> | undefined;
    if (cid) {
        const { data: pData } = await supabase
            .from("profiles")
            .select("id, full_name, email")
            .eq("id", cid)
            .maybeSingle();
        if (pData) {
            profileMap = new Map([[pData.id, { full_name: pData.full_name, email: pData.email }]]);
        }
    }

    return mapBooking(row, profileMap);
}

/** A customer's own booking history — powers the "My Bookings" page. */
export async function getBookingsForCustomer(customerId: string): Promise<Booking[]> {
    const supabase = await createClient();

    let { data, error } = await supabase
        .from("bookings")
        .select(BOOKING_SELECT)
        .eq("customer_id", customerId)
        .order("booking_date", { ascending: false })
        .order("start_time", { ascending: false });

    let rawBookings: any[] | null = data;

    if (error || !rawBookings) {
        const retry = await supabase
            .from("bookings")
            .select(`
                id, court_id, booking_date, start_time, end_time, status, payment_status, payment_method,
                total_price, cancelled_reason, created_at, customer_id,
                courts ( name )
            `)
            .eq("customer_id", customerId)
            .order("booking_date", { ascending: false })
            .order("start_time", { ascending: false });
        rawBookings = retry.data as any[];
    }

    if (!rawBookings) return [];

    const { data: pData } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .eq("id", customerId)
        .maybeSingle();

    const profileMap = pData
        ? new Map([[pData.id, { full_name: pData.full_name, email: pData.email }]])
        : undefined;

    return rawBookings.map((row) => mapBooking(row as BookingRow, profileMap));
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
    const supabase = await getDbClient();

    const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name")
        .eq("email", email)
        .single();

    if (error || !data) return null;

    return { id: data.id, fullName: data.full_name };
}