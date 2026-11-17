export const OPEN_PLAY_HOLD_MINUTES = 30;
export const OPEN_PLAY_HOLD_LABEL = "Open Play hold";

export interface EntryLike {
    status: "pending" | "paid" | "cancelled" | "needs_refund";
    hold_expires_at: string | null;
}

export function computeSpotsLeft(
    playerCap: number,
    entries: EntryLike[],
    now: Date = new Date()
): number {
    const nowMs = now.getTime();
    let taken = 0;

    for (const entry of entries) {
        if (entry.status === "paid") {
            taken++;
        } else if (entry.status === "pending" && entry.hold_expires_at) {
            const expMs = new Date(entry.hold_expires_at).getTime();
            if (Number.isFinite(expMs) && expMs > nowMs) {
                taken++;
            }
        }
    }

    return Math.max(0, playerCap - taken);
}

export interface SessionInput {
    courtId: string;
    date: string;
    startTime: string;
    endTime: string;
    pricePerPlayer: number;
    playerCap: number;
}

function parseWholeHour(timeStr: string): number | null {
    const trimmed = timeStr?.trim().slice(0, 5);
    if (!/^\d{2}:\d{2}$/.test(trimmed)) return null;
    const [hStr, mStr] = trimmed.split(":");
    const h = Number(hStr);
    const m = Number(mStr);
    if (!Number.isInteger(h) || !Number.isInteger(m) || m !== 0) return null;
    if (h < 0 || h > 23) return null;
    return h;
}

export function validateSessionInput(
    input: SessionInput,
    todayISO: string,
    currentHour: number
): { ok: true } | { ok: false; error: string } {
    if (!input.courtId?.trim()) {
        return { ok: false, error: "Please select a court." };
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date || "")) {
        return { ok: false, error: "Please select a valid session date." };
    }

    const startH = parseWholeHour(input.startTime);
    const endH = parseWholeHour(input.endTime);

    if (startH === null || endH === null) {
        return { ok: false, error: "Start and end times must be whole hours (e.g. 18:00)." };
    }

    if (startH < 9 || endH > 23 || endH === 0) {
        return { ok: false, error: "Sessions must fall within venue operating hours (09:00 AM – 11:00 PM)." };
    }

    if (endH <= startH) {
        return { ok: false, error: "End time must be after start time." };
    }

    if (input.date < todayISO || (input.date === todayISO && startH < currentHour)) {
        return { ok: false, error: "Session cannot start in the past." };
    }

    if (!Number.isInteger(input.playerCap) || input.playerCap < 1) {
        return { ok: false, error: "Player cap must be a whole number of at least 1." };
    }

    if (!Number.isFinite(input.pricePerPlayer) || input.pricePerPlayer < 0) {
        return { ok: false, error: "Price per player must be a non-negative number." };
    }

    return { ok: true };
}

export type EntryOutcome = "paid" | "needs_refund" | "noop";

export function decideEntryOutcome(args: {
    entryStatus: EntryLike["status"];
    sessionStatus: "scheduled" | "cancelled";
    holdExpiresAt: string | null;
    spotsLeftExcludingThisEntry: number;
    now: Date;
}): EntryOutcome {
    if (args.entryStatus === "paid" || args.entryStatus === "needs_refund") {
        return "noop";
    }

    if (args.sessionStatus === "cancelled") {
        return "needs_refund";
    }

    const nowMs = args.now.getTime();
    const expMs = args.holdExpiresAt ? new Date(args.holdExpiresAt).getTime() : 0;
    const holdStillActive =
        args.entryStatus === "pending" && Number.isFinite(expMs) && expMs > nowMs;

    if (holdStillActive) {
        return "paid";
    }

    // Hold expired or entry was previously marked cancelled (e.g. session expired webhook arrived before paid):
    // if a spot is still open, honor the payment and grant the spot; if full, flag for refund.
    if (args.spotsLeftExcludingThisEntry > 0) {
        return "paid";
    }

    return "needs_refund";
}

