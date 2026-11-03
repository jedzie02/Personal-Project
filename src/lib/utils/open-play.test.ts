import { describe, it, expect } from "vitest";
import {
    OPEN_PLAY_HOLD_MINUTES,
    OPEN_PLAY_HOLD_LABEL,
    computeSpotsLeft,
    validateSessionInput,
    decideEntryOutcome,
    type EntryLike,
} from "./open-play";

describe("open-play pure rules", () => {
    it("exports the expected hold constants", () => {
        expect(OPEN_PLAY_HOLD_MINUTES).toBe(30);
        expect(OPEN_PLAY_HOLD_LABEL).toBe("Open Play hold");
    });

    it("computeSpotsLeft counts paid and unexpired pending entries and clamps at 0", () => {
        const now = new Date("2026-11-03T10:00:00Z");
        const entries: EntryLike[] = [
            { status: "paid", hold_expires_at: null },
            { status: "paid", hold_expires_at: null },
            { status: "paid", hold_expires_at: null },
            { status: "pending", hold_expires_at: "2026-11-03T10:15:00Z" },
            { status: "pending", hold_expires_at: "2026-11-03T10:20:00Z" },
            { status: "pending", hold_expires_at: "2026-11-03T09:55:00Z" }, // expired
            { status: "cancelled", hold_expires_at: "2026-11-03T10:20:00Z" },
            { status: "needs_refund", hold_expires_at: null },
        ];
        expect(computeSpotsLeft(8, entries, now)).toBe(3);

        // Clamps to 0 when over-counted
        expect(
            computeSpotsLeft(
                2,
                [
                    { status: "paid", hold_expires_at: null },
                    { status: "paid", hold_expires_at: null },
                    { status: "paid", hold_expires_at: null },
                ],
                now
            )
        ).toBe(0);
    });

    it("validateSessionInput accepts valid session and rejects all invalid cases", () => {
        const valid = {
            courtId: "court-1",
            date: "2026-11-04",
            startTime: "18:00",
            endTime: "20:00",
            pricePerPlayer: 100,
            playerCap: 8,
        };
        expect(validateSessionInput(valid, "2026-11-03", 10)).toEqual({ ok: true });

        // End equal to start
        expect(
            validateSessionInput({ ...valid, endTime: "18:00" }, "2026-11-03", 10).ok
        ).toBe(false);
        // Non-whole start hour
        expect(
            validateSessionInput({ ...valid, startTime: "18:30" }, "2026-11-03", 10).ok
        ).toBe(false);
        // Before 09:00
        expect(
            validateSessionInput({ ...valid, startTime: "08:00" }, "2026-11-03", 10).ok
        ).toBe(false);
        // Non-whole end hour
        expect(
            validateSessionInput({ ...valid, endTime: "23:30" }, "2026-11-03", 10).ok
        ).toBe(false);
        // Midnight / outside 09:00-23:00
        expect(
            validateSessionInput({ ...valid, endTime: "00:00" }, "2026-11-03", 10).ok
        ).toBe(false);
        // Past date
        expect(
            validateSessionInput({ ...valid, date: "2026-11-02" }, "2026-11-03", 10).ok
        ).toBe(false);
        // Today but past start hour
        expect(
            validateSessionInput(
                { ...valid, date: "2026-11-03", startTime: "09:00" },
                "2026-11-03",
                10
            ).ok
        ).toBe(false);
        // Cap 0
        expect(
            validateSessionInput({ ...valid, playerCap: 0 }, "2026-11-03", 10).ok
        ).toBe(false);
        // Fractional cap
        expect(
            validateSessionInput({ ...valid, playerCap: 2.5 }, "2026-11-03", 10).ok
        ).toBe(false);
        // Negative price
        expect(
            validateSessionInput({ ...valid, pricePerPlayer: -1 }, "2026-11-03", 10).ok
        ).toBe(false);
        // NaN price
        expect(
            validateSessionInput({ ...valid, pricePerPlayer: Number.NaN }, "2026-11-03", 10).ok
        ).toBe(false);
    });

    it("decideEntryOutcome handles idempotency, cancelled sessions, and expired holds", () => {
        const now = new Date("2026-11-03T10:00:00Z");

        expect(
            decideEntryOutcome({
                entryStatus: "paid",
                sessionStatus: "scheduled",
                holdExpiresAt: "2026-11-03T10:20:00Z",
                spotsLeftExcludingThisEntry: 4,
                now,
            })
        ).toBe("noop");

        expect(
            decideEntryOutcome({
                entryStatus: "needs_refund",
                sessionStatus: "scheduled",
                holdExpiresAt: null,
                spotsLeftExcludingThisEntry: 4,
                now,
            })
        ).toBe("noop");

        expect(
            decideEntryOutcome({
                entryStatus: "pending",
                sessionStatus: "cancelled",
                holdExpiresAt: "2026-11-03T10:20:00Z",
                spotsLeftExcludingThisEntry: 4,
                now,
            })
        ).toBe("needs_refund");

        expect(
            decideEntryOutcome({
                entryStatus: "pending",
                sessionStatus: "scheduled",
                holdExpiresAt: "2026-11-03T10:20:00Z",
                spotsLeftExcludingThisEntry: 0,
                now,
            })
        ).toBe("paid");

        expect(
            decideEntryOutcome({
                entryStatus: "pending",
                sessionStatus: "scheduled",
                holdExpiresAt: "2026-11-03T09:50:00Z", // expired
                spotsLeftExcludingThisEntry: 0,
                now,
            })
        ).toBe("needs_refund");

        expect(
            decideEntryOutcome({
                entryStatus: "pending",
                sessionStatus: "scheduled",
                holdExpiresAt: "2026-11-03T09:50:00Z", // expired, but spot still open
                spotsLeftExcludingThisEntry: 1,
                now,
            })
        ).toBe("paid");

        expect(
            decideEntryOutcome({
                entryStatus: "cancelled",
                sessionStatus: "scheduled",
                holdExpiresAt: null,
                spotsLeftExcludingThisEntry: 1,
                now,
            })
        ).toBe("paid");
    });
});

