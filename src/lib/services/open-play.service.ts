import { createClient } from "../supabase/server";
import { createAdminClient } from "../supabase/admin";
import { stripe } from "../stripe/client";
import { getManilaNow, doTimeRangesOverlap } from "../utils/date";
import {
    OPEN_PLAY_HOLD_LABEL,
    computeSpotsLeft,
    validateSessionInput,
    decideEntryOutcome,
    type EntryLike,
    type SessionInput,
} from "../utils/open-play";
import { sendOpenPlayReceiptEmail, sendOpenPlayRefundEmail } from "./email.service";

export interface OpenPlaySessionView {
    id: string;
    courtId: string;
    courtName: string;
    date: string;
    startTime: string;
    endTime: string;
    pricePerPlayer: number;
    playerCap: number;
    spotsLeft: number;
    status: "scheduled" | "cancelled";
}

export interface AdminSessionView extends OpenPlaySessionView {
    players: {
        entryId: string;
        name: string;
        email: string | null;
        phone?: string | null;
        status: "pending" | "paid" | "cancelled" | "needs_refund";
        isRefunded?: boolean;
        amount: number;
        paymentMethod: "GCash QR" | "Cash walk in";
        paymentReference: string | null;
    }[];
}

export function parseEntryPaymentMeta(raw?: string | null): {
    paymentMethod: "GCash QR" | "Cash walk in";
    paymentReference: string | null;
    isRefunded: boolean;
} {
    if (!raw) {
        return { paymentMethod: "GCash QR", paymentReference: null, isRefunded: false };
    }
    const isRefunded = raw.toLowerCase().includes("[refunded]");
    const cleaned = raw.replace(/\[refunded\]/gi, "").trim();
    const lower = cleaned.toLowerCase();
    if (lower.includes("gcash") || lower.includes("qr")) {
        if (cleaned.includes("Ref:")) {
            const ref = cleaned.split("Ref:")[1]?.replace(/[()]/g, "").trim() || null;
            return { paymentMethod: "GCash QR", paymentReference: ref, isRefunded };
        }
        return { paymentMethod: "GCash QR", paymentReference: null, isRefunded };
    }
    if (lower.includes("cash")) {
        return { paymentMethod: "Cash walk in", paymentReference: null, isRefunded };
    }
    return { paymentMethod: "GCash QR", paymentReference: null, isRefunded };
}

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

export function toSessionView(
    row: any,
    entries: EntryLike[],
    now: Date = new Date()
): OpenPlaySessionView {
    const courtObj = Array.isArray(row.courts) ? row.courts[0] : row.courts;
    const playerCap = Number(row.player_cap) || 1;
    return {
        id: row.id,
        courtId: row.court_id,
        courtName: courtObj?.name ?? "Pickleball Court",
        date: row.session_date,
        startTime: String(row.start_time).slice(0, 5),
        endTime: String(row.end_time).slice(0, 5),
        pricePerPlayer: Number(row.price_per_player) || 0,
        playerCap,
        spotsLeft: computeSpotsLeft(playerCap, entries, now),
        status: row.status === "cancelled" ? "cancelled" : "scheduled",
    };
}

export function isUpcoming(
    row: { session_date: string; start_time: string; status: string },
    todayISO: string,
    currentHour: number
): boolean {
    if (row.status !== "scheduled") return false;
    if (row.session_date > todayISO) return true;
    if (row.session_date < todayISO) return false;
    const startH = parseInt(String(row.start_time).slice(0, 2), 10);
    return startH >= currentHour;
}

export async function createOpenPlaySession(
    input: SessionInput,
    adminProfileId: string
): Promise<{ ok: true; sessionId: string } | { ok: false; error: string }> {
    const { todayISO, currentHour } = getManilaNow();
    const validation = validateSessionInput(input, todayISO, currentHour);
    if (!validation.ok) {
        return validation;
    }

    const supabase = await getDbClient();

    const { data: existingBookings, error: overlapErr } = await supabase
        .from("bookings")
        .select("id, start_time, end_time")
        .eq("court_id", input.courtId)
        .eq("booking_date", input.date)
        .in("status", ["pending", "confirmed"]);

    const overlaps =
        Boolean(overlapErr) ||
        (existingBookings ?? []).some((b: any) =>
            doTimeRangesOverlap(
                String(b.start_time).slice(0, 5),
                String(b.end_time).slice(0, 5),
                input.startTime,
                input.endTime
            )
        );

    if (overlaps) {
        return {
            ok: false,
            error: "That court already has a booking during the selected time window.",
        };
    }

    // 1. Insert hold booking to block the court on the grid
    const { data: holdBooking, error: holdErr } = await supabase
        .from("bookings")
        .insert({
            court_id: input.courtId,
            customer_id: adminProfileId,
            booking_date: input.date,
            start_time: input.startTime,
            end_time: input.endTime,
            total_price: 0,
            status: "confirmed",
            payment_status: "succeeded",
            payment_method: OPEN_PLAY_HOLD_LABEL,
        })
        .select("id")
        .single();

    if (holdErr || !holdBooking) {
        return {
            ok: false,
            error: `Could not create court hold booking: ${holdErr?.message ?? "unknown error"}`,
        };
    }

    // 2. Insert open_play_sessions row
    const { data: sessionRow, error: sessionErr } = await supabase
        .from("open_play_sessions")
        .insert({
            court_id: input.courtId,
            session_date: input.date,
            start_time: input.startTime,
            end_time: input.endTime,
            price_per_player: input.pricePerPlayer,
            player_cap: input.playerCap,
            status: "scheduled",
            hold_booking_id: holdBooking.id,
        })
        .select("id")
        .single();

    if (sessionErr || !sessionRow) {
        await supabase
            .from("bookings")
            .update({ status: "cancelled", cancelled_reason: "Rollback failed session creation" })
            .eq("id", holdBooking.id);
        await supabase.from("bookings").delete().eq("id", holdBooking.id);
        return {
            ok: false,
            error: `Could not create open play session: ${sessionErr?.message ?? "unknown error"}`,
        };
    }

    return { ok: true, sessionId: sessionRow.id };
}

export async function listUpcomingSessions(): Promise<OpenPlaySessionView[]> {
    try {
        const supabase = await getDbClient();
        const { todayISO, currentHour } = getManilaNow();

        const { data: rows, error } = await supabase
            .from("open_play_sessions")
            .select(
                "id, court_id, session_date, start_time, end_time, price_per_player, player_cap, status, courts ( name ), open_play_entries ( status, hold_expires_at )"
            )
            .eq("status", "scheduled")
            .gte("session_date", todayISO)
            .order("session_date", { ascending: true })
            .order("start_time", { ascending: true });

        if (error || !rows) return [];

        const now = new Date();
        return rows
            .filter((r: any) => isUpcoming(r, todayISO, currentHour))
            .map((r: any) =>
                toSessionView(r, Array.isArray(r.open_play_entries) ? r.open_play_entries : [], now)
            )
            .sort(
                (a, b) =>
                    a.date.localeCompare(b.date) ||
                    a.startTime.localeCompare(b.startTime) ||
                    a.courtName.localeCompare(b.courtName, undefined, { numeric: true })
            );
    } catch {
        return [];
    }
}

export async function startOpenPlayJoin(
    sessionId: string,
    customerId: string,
    _customerEmail: string | null,
    paymentMethod: "GCash QR" | "Cash walk in" = "GCash QR"
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
    const supabase = await getDbClient();

    const { data: existingEntry } = await supabase
        .from("open_play_entries")
        .select("id, status, hold_expires_at")
        .eq("session_id", sessionId)
        .eq("customer_id", customerId)
        .maybeSingle();

    if (
        existingEntry &&
        (existingEntry.status === "paid" ||
            (existingEntry.status === "pending" &&
                existingEntry.hold_expires_at &&
                new Date(existingEntry.hold_expires_at).getTime() > Date.now()))
    ) {
        return {
            ok: false,
            error: "You already reserved a spot in this Open Play session.",
        };
    }

    // Atomically claim a spot via RPC (525600 mins = 1 year hold so spot stays reserved for GCash/Cash)
    const { data: claimResult, error: rpcError } = await supabase.rpc(
        "claim_open_play_spot",
        {
            p_session_id: sessionId,
            p_customer_id: customerId,
            p_hold_minutes: 525600,
        }
    );

    if (rpcError || !claimResult) {
        return {
            ok: false,
            error: rpcError?.message || "Could not claim an open play spot.",
        };
    }

    if (!claimResult.ok) {
        return {
            ok: false,
            error: claimResult.error || "Could not join this open play session.",
        };
    }

    const entryId = String(claimResult.entry_id);

    await supabase
        .from("open_play_entries")
        .update({ stripe_checkout_session_id: paymentMethod })
        .eq("id", entryId);

    return {
        ok: true,
        url: `/open-play/confirmation?entryId=${encodeURIComponent(entryId)}`,
    };
}

export async function submitOpenPlayGCashReference(
    entryId: string,
    customerId: string,
    referenceNo: string
): Promise<{ ok: boolean; error?: string }> {
    const supabase = await getDbClient();
    const encoded = `GCash QR (Ref: ${referenceNo})`;

    const { error } = await supabase
        .from("open_play_entries")
        .update({ stripe_checkout_session_id: encoded })
        .eq("id", entryId)
        .eq("customer_id", customerId);

    if (error) {
        return { ok: false, error: error.message || "Failed to save GCash reference number." };
    }
    return { ok: true };
}

export async function markOpenPlayEntryPaidByAdmin(
    entryId: string
): Promise<{ ok: boolean; error?: string }> {
    const supabase = await getDbClient();
    const { data: updatedRows, error } = await supabase
        .from("open_play_entries")
        .update({ status: "paid" })
        .eq("id", entryId)
        .neq("status", "paid")
        .select("id");

    if (error) {
        return { ok: false, error: error.message || "Could not mark entry as paid." };
    }

    if (updatedRows && updatedRows.length > 0) {
        await sendOpenPlayReceiptEmail(entryId);
    }

    return { ok: true };
}

export async function markOpenPlayEntryRefundedByAdmin(
    entryId: string
): Promise<{ ok: boolean; error?: string }> {
    const supabase = await getDbClient();
    const { data: existing } = await supabase
        .from("open_play_entries")
        .select("id, stripe_checkout_session_id")
        .eq("id", entryId)
        .maybeSingle();

    const currentMeta = existing?.stripe_checkout_session_id || "GCash QR";
    const updatedMeta = currentMeta.toLowerCase().includes("[refunded]")
        ? currentMeta
        : `${currentMeta} [Refunded]`;

    const { error } = await supabase
        .from("open_play_entries")
        .update({
            status: "cancelled",
            hold_expires_at: null,
            stripe_checkout_session_id: updatedMeta,
        })
        .eq("id", entryId);

    if (error) {
        return { ok: false, error: error.message || "Could not mark entry as refunded." };
    }

    await sendOpenPlayRefundEmail(entryId);

    return { ok: true };
}

export async function markEntryPaid(
    checkoutSessionId: string,
    _paymentIntentId: string | null
): Promise<void> {
    const supabase = await getDbClient();

    const { data: entry } = await supabase
        .from("open_play_entries")
        .select(
            "id, session_id, customer_id, status, hold_expires_at, open_play_sessions ( id, player_cap, status )"
        )
        .eq("stripe_checkout_session_id", checkoutSessionId)
        .maybeSingle();

    if (!entry) return;

    const sessionObj: any = Array.isArray(entry.open_play_sessions)
        ? entry.open_play_sessions[0]
        : entry.open_play_sessions;
    if (!sessionObj) return;

    const { data: siblingEntries } = await supabase
        .from("open_play_entries")
        .select("id, status, hold_expires_at")
        .eq("session_id", entry.session_id)
        .neq("id", entry.id);

    const now = new Date();
    const spotsLeftExcludingThisEntry = computeSpotsLeft(
        Number(sessionObj.player_cap) || 1,
        (siblingEntries ?? []) as EntryLike[],
        now
    );

    const outcome = decideEntryOutcome({
        entryStatus: entry.status as EntryLike["status"],
        sessionStatus: sessionObj.status === "cancelled" ? "cancelled" : "scheduled",
        holdExpiresAt: entry.hold_expires_at,
        spotsLeftExcludingThisEntry,
        now,
    });

    if (outcome === "noop") return;

    if (outcome === "needs_refund") {
        await supabase
            .from("open_play_entries")
            .update({ status: "needs_refund" })
            .eq("id", entry.id)
            .neq("status", "needs_refund");
        return;
    }

    const { data: updatedRows } = await supabase
        .from("open_play_entries")
        .update({ status: "paid" })
        .eq("id", entry.id)
        .neq("status", "paid")
        .select("id");

    if (updatedRows && updatedRows.length > 0) {
        await sendOpenPlayReceiptEmail(entry.id);
    }
}

export async function markEntryExpired(checkoutSessionId: string): Promise<void> {
    const supabase = await getDbClient();
    await supabase
        .from("open_play_entries")
        .update({ status: "cancelled", hold_expires_at: null })
        .eq("stripe_checkout_session_id", checkoutSessionId)
        .eq("status", "pending");
}

export async function syncOpenPlayEntryIfNeeded(entryId: string): Promise<void> {
    try {
        const supabase = await getDbClient();
        const { data: entry } = await supabase
            .from("open_play_entries")
            .select("stripe_checkout_session_id, status")
            .eq("id", entryId)
            .maybeSingle();

        if (
            !entry ||
            entry.status === "paid" ||
            entry.status === "needs_refund" ||
            !entry.stripe_checkout_session_id ||
            !entry.stripe_checkout_session_id.startsWith("cs_")
        ) {
            return;
        }

        const session = await stripe.checkout.sessions.retrieve(
            entry.stripe_checkout_session_id
        );
        if (session.payment_status === "paid") {
            const paymentIntentId =
                typeof session.payment_intent === "string"
                    ? session.payment_intent
                    : (session.payment_intent?.id ?? null);
            await markEntryPaid(session.id, paymentIntentId);
        }
    } catch {
        // Non-fatal fallback
    }
}

export async function cancelOpenPlaySession(
    sessionId: string
): Promise<{ ok: boolean; error?: string }> {
    const supabase = await getDbClient();
    const { todayISO, currentHour } = getManilaNow();

    const { data: sessionRow, error: fetchErr } = await supabase
        .from("open_play_sessions")
        .select("id, session_date, start_time, status, hold_booking_id")
        .eq("id", sessionId)
        .maybeSingle();

    if (fetchErr || !sessionRow) {
        return { ok: false, error: "Session not found." };
    }

    if (sessionRow.status === "cancelled") {
        return { ok: true };
    }

    if (!isUpcoming(sessionRow, todayISO, currentHour)) {
        return { ok: false, error: "Past sessions cannot be cancelled." };
    }

    await supabase
        .from("open_play_sessions")
        .update({ status: "cancelled" })
        .eq("id", sessionId);

    await supabase
        .from("open_play_entries")
        .update({ status: "needs_refund" })
        .eq("session_id", sessionId)
        .eq("status", "paid");

    await supabase
        .from("open_play_entries")
        .update({ status: "cancelled", hold_expires_at: null })
        .eq("session_id", sessionId)
        .eq("status", "pending");

    if (sessionRow.hold_booking_id) {
        await supabase
            .from("bookings")
            .update({
                status: "cancelled",
                cancelled_reason: "Open play session cancelled",
            })
            .eq("id", sessionRow.hold_booking_id);
    }

    return { ok: true };
}

export async function listSessionsForAdmin(): Promise<AdminSessionView[]> {
    try {
        const supabase = await getDbClient();
        const { data: rows, error } = await supabase
            .from("open_play_sessions")
            .select(
                "id, court_id, session_date, start_time, end_time, price_per_player, player_cap, status, hold_booking_id, courts ( name ), open_play_entries ( id, customer_id, status, amount, hold_expires_at, stripe_checkout_session_id, profiles ( full_name, email, phone ) )"
            )
            .order("session_date", { ascending: false })
            .order("start_time", { ascending: false });

        if (error || !rows) return [];

        // Auto-sync any 'needs_refund' entries if the admin already refunded a booking for that customer or session in /admin/payments
        const needsRefundCustomerIds = new Set<string>();
        const holdBookingIds = new Set<string>();
        for (const r of rows as any[]) {
            if (r.hold_booking_id) holdBookingIds.add(r.hold_booking_id);
            const entries = Array.isArray(r.open_play_entries) ? r.open_play_entries : [];
            for (const e of entries) {
                if (e.status === "needs_refund" && e.customer_id) {
                    needsRefundCustomerIds.add(e.customer_id);
                }
            }
        }

        if (needsRefundCustomerIds.size > 0) {
            const { data: refundedBookings } = await supabase
                .from("bookings")
                .select("id, customer_id, court_id, booking_date, payment_status")
                .eq("payment_status", "refunded");

            if (refundedBookings && refundedBookings.length > 0) {
                const refundedBookingIds = new Set(refundedBookings.map((b: any) => b.id));
                const refundedCustomerIds = new Set(
                    refundedBookings.map((b: any) => b.customer_id).filter(Boolean)
                );

                for (const r of rows as any[]) {
                    const entries = Array.isArray(r.open_play_entries) ? r.open_play_entries : [];
                    for (const e of entries) {
                        if (
                            e.status === "needs_refund" &&
                            ((r.hold_booking_id && refundedBookingIds.has(r.hold_booking_id)) ||
                                (e.customer_id && refundedCustomerIds.has(e.customer_id)))
                        ) {
                            await markOpenPlayEntryRefundedByAdmin(e.id);
                            e.status = "cancelled";
                            e.stripe_checkout_session_id = `${e.stripe_checkout_session_id || "GCash QR"} [Refunded]`;
                        }
                    }
                }
            }
        }

        const now = new Date();
        return rows.map((r: any) => {
            const rawEntries = Array.isArray(r.open_play_entries) ? r.open_play_entries : [];
            const base = toSessionView(r, rawEntries, now);
            const players = rawEntries.map((e: any) => {
                const prof = Array.isArray(e.profiles) ? e.profiles[0] : e.profiles;
                const { paymentMethod, paymentReference, isRefunded } = parseEntryPaymentMeta(
                    e.stripe_checkout_session_id
                );
                return {
                    entryId: e.id,
                    name: prof?.full_name?.trim() || prof?.email?.split("@")[0] || "Player",
                    email: prof?.email ?? null,
                    phone: prof?.phone ?? null,
                    status: e.status as AdminSessionView["players"][0]["status"],
                    isRefunded,
                    amount: Number(e.amount) || 0,
                    paymentMethod,
                    paymentReference,
                };
            });
            return {
                ...base,
                players,
            };
        }).sort(
            (a, b) =>
                b.date.localeCompare(a.date) ||
                b.startTime.localeCompare(a.startTime) ||
                a.courtName.localeCompare(b.courtName, undefined, { numeric: true })
        );
    } catch {
        return [];
    }
}

export async function getEntryForCustomer(
    entryId: string,
    customerId: string
): Promise<{
    status: string;
    session: OpenPlaySessionView;
    amount: number;
    paymentMethod: "GCash QR" | "Cash walk in";
    paymentReference: string | null;
} | null> {
    try {
        const supabase = await getDbClient();
        const { data: entry } = await supabase
            .from("open_play_entries")
            .select(
                "id, customer_id, status, amount, stripe_checkout_session_id, open_play_sessions ( id, court_id, session_date, start_time, end_time, price_per_player, player_cap, status, courts ( name ), open_play_entries ( status, hold_expires_at ) )"
            )
            .eq("id", entryId)
            .eq("customer_id", customerId)
            .maybeSingle();

        if (!entry) return null;
        const sRow: any = Array.isArray(entry.open_play_sessions)
            ? entry.open_play_sessions[0]
            : entry.open_play_sessions;
        if (!sRow) return null;

        const sessionView = toSessionView(
            sRow,
            Array.isArray(sRow.open_play_entries) ? sRow.open_play_entries : [],
            new Date()
        );
        const { paymentMethod, paymentReference } = parseEntryPaymentMeta(
            entry.stripe_checkout_session_id
        );

        return {
            status: entry.status,
            session: sessionView,
            amount: Number(entry.amount) || 0,
            paymentMethod,
            paymentReference,
        };
    } catch {
        return null;
    }
}

export async function listPaidEntriesForCustomer(
    customerId: string
): Promise<
    {
        entryId: string;
        status: string;
        session: OpenPlaySessionView;
        amount: number;
        paymentMethod: "GCash QR" | "Cash walk in";
        paymentReference: string | null;
    }[]
> {
    try {
        const supabase = await getDbClient();
        const { data: entries } = await supabase
            .from("open_play_entries")
            .select(
                "id, amount, status, stripe_checkout_session_id, open_play_sessions ( id, court_id, session_date, start_time, end_time, price_per_player, player_cap, status, courts ( name ), open_play_entries ( status, hold_expires_at ) )"
            )
            .eq("customer_id", customerId)
            .in("status", ["pending", "paid", "needs_refund"])
            .order("created_at", { ascending: false });

        if (!entries) return [];

        const now = new Date();
        return entries
            .map((e: any) => {
                const sRow = Array.isArray(e.open_play_sessions)
                    ? e.open_play_sessions[0]
                    : e.open_play_sessions;
                if (!sRow) return null;
                const { paymentMethod, paymentReference } = parseEntryPaymentMeta(
                    e.stripe_checkout_session_id
                );
                return {
                    entryId: e.id,
                    status: e.status as string,
                    session: toSessionView(
                        sRow,
                        Array.isArray(sRow.open_play_entries) ? sRow.open_play_entries : [],
                        now
                    ),
                    amount: Number(e.amount) || 0,
                    paymentMethod,
                    paymentReference,
                };
            })
            .filter((item): item is NonNullable<typeof item> => item !== null);
    } catch {
        return [];
    }
}
