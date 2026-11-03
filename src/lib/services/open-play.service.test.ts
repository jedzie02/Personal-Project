import { describe, it, expect } from "vitest";
import { toSessionView, isUpcoming, parseEntryPaymentMeta } from "./open-play.service";

describe("open-play.service pure mappers", () => {
    it("parseEntryPaymentMeta extracts GCash QR, GCash Ref #, Cash walk in, and [Refunded] tag", () => {
        expect(parseEntryPaymentMeta("GCash QR")).toEqual({
            paymentMethod: "GCash QR",
            paymentReference: null,
            isRefunded: false,
        });
        expect(parseEntryPaymentMeta("GCash QR (Ref: 1029384756102)")).toEqual({
            paymentMethod: "GCash QR",
            paymentReference: "1029384756102",
            isRefunded: false,
        });
        expect(parseEntryPaymentMeta("Cash walk in")).toEqual({
            paymentMethod: "Cash walk in",
            paymentReference: null,
            isRefunded: false,
        });
        expect(parseEntryPaymentMeta("GCash QR (Ref: 1029384756102) [Refunded]")).toEqual({
            paymentMethod: "GCash QR",
            paymentReference: "1029384756102",
            isRefunded: true,
        });
    });

    it("toSessionView normalizes HH:MM times, numeric price, court name, and spotsLeft", () => {
        const now = new Date("2026-11-03T10:00:00Z");
        const view = toSessionView(
            {
                id: "sess-1",
                court_id: "court-2",
                session_date: "2026-11-05",
                start_time: "18:00:00",
                end_time: "20:00:00",
                price_per_player: "120.00",
                player_cap: 8,
                status: "scheduled",
                courts: { name: "Court 2" },
            },
            [
                { status: "paid", hold_expires_at: null },
                { status: "pending", hold_expires_at: "2026-11-03T10:25:00Z" },
                { status: "pending", hold_expires_at: "2026-11-03T09:30:00Z" }, // expired
            ],
            now
        );

        expect(view).toEqual({
            id: "sess-1",
            courtId: "court-2",
            courtName: "Court 2",
            date: "2026-11-05",
            startTime: "18:00",
            endTime: "20:00",
            pricePerPlayer: 120,
            playerCap: 8,
            spotsLeft: 6,
            status: "scheduled",
        });
    });

    it("isUpcoming filters out cancelled and past sessions", () => {
        expect(
            isUpcoming(
                { session_date: "2026-11-04", start_time: "09:00:00", status: "scheduled" },
                "2026-11-03",
                15
            )
        ).toBe(true);

        expect(
            isUpcoming(
                { session_date: "2026-11-03", start_time: "16:00:00", status: "scheduled" },
                "2026-11-03",
                15
            )
        ).toBe(true);

        expect(
            isUpcoming(
                { session_date: "2026-11-03", start_time: "14:00:00", status: "scheduled" },
                "2026-11-03",
                15
            )
        ).toBe(false);

        expect(
            isUpcoming(
                { session_date: "2026-11-04", start_time: "18:00:00", status: "cancelled" },
                "2026-11-03",
                15
            )
        ).toBe(false);
    });
});

