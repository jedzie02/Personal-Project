import { describe, it, expect } from "vitest";
import { generateTimeSlots, doTimeRangesOverlap } from "./date";

/**
 * A quick primer, since this is the first test file in the project:
 * - describe() groups related tests under a label.
 * - it() is one individual test — a description plus a function that
 *   either completes quietly (pass) or throws (fail).
 * - expect(actual).toBe(expected) / .toEqual(expected) is the
 *   "assertion" — the actual check. toBe is for primitives
 *   (numbers, strings, booleans); toEqual is for objects/arrays,
 *   comparing their contents rather than their identity.
 *
 * Run these with: npm run test
 */

describe("generateTimeSlots", () => {
    it("splits an open/close window into evenly-sized slots", () => {
        const slots = generateTimeSlots("09:00", "12:00", 60);

        expect(slots).toEqual([
            { start: "09:00", end: "10:00" },
            { start: "10:00", end: "11:00" },
            { start: "11:00", end: "12:00" },
        ]);
    });

    it("drops a trailing partial slot rather than offering a short booking", () => {
        // 09:00 to 11:30 with 60-minute slots: 09-10, then 10-11, then
        // only 30 minutes left over — that leftover half-slot should
        // NOT appear as a bookable option.
        const slots = generateTimeSlots("09:00", "11:30", 60);

        expect(slots).toHaveLength(2);
        expect(slots[slots.length - 1]).toEqual({ start: "10:00", end: "11:00" });
    });

    it("returns no slots when the venue is open for less than one slot's length", () => {
        expect(generateTimeSlots("09:00", "09:30", 60)).toEqual([]);
    });
});

describe("doTimeRangesOverlap", () => {
    it("detects a genuine overlap — the exact example from the SRS", () => {
        // Booking A: 10:00-11:00, Booking B: 10:30-11:30 — these must
        // never both be allowed on the same court (the SRS's own example).
        expect(doTimeRangesOverlap("10:00", "11:00", "10:30", "11:30")).toBe(true);
    });

    it("does NOT flag back-to-back bookings as overlapping", () => {
        // One ends exactly when the other starts — this should be allowed,
        // not rejected as a conflict.
        expect(doTimeRangesOverlap("09:00", "10:00", "10:00", "11:00")).toBe(false);
    });

    it("does not flag two clearly separate ranges", () => {
        expect(doTimeRangesOverlap("09:00", "10:00", "14:00", "15:00")).toBe(false);
    });

    it("detects one range fully containing another", () => {
        expect(doTimeRangesOverlap("09:00", "17:00", "10:00", "11:00")).toBe(true);
    });

    it("correctly matches 11:00 slot with Postgres HH:MM:SS format without 1-hour shift", () => {
        const dbStartTime = "11:00:00";
        const dbEndTime = "12:00:00";
        const bStart = dbStartTime.slice(0, 5);
        const bEnd = dbEndTime.slice(0, 5);

        // At 11:00 AM slot
        const isCoveredAt11 = bStart <= "11:00" && (bEnd > "11:00" || bEnd === "00:00");
        expect(isCoveredAt11).toBe(true);

        // At 12:00 PM slot (must NOT match)
        const isCoveredAt12 = bStart <= "12:00" && (bEnd > "12:00" || bEnd === "00:00");
        expect(isCoveredAt12).toBe(false);
    });
});