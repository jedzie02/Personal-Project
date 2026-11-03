import { describe, it, expect } from "vitest";
import { resolveContinuousSlots, MasterCourt } from "./court-jump";

describe("resolveContinuousSlots", () => {
    const masterCourts: MasterCourt[] = [
        { id: "court-1", name: "Court 1", hourly_rate: 300, status: "Available" },
        { id: "court-2", name: "Court 2", hourly_rate: 300, status: "Available" },
        { id: "court-3", name: "Court 3", hourly_rate: 300, status: "Available" },
        { id: "court-4", name: "Court 4", hourly_rate: 300, status: "Available" },
    ];

    const hours = ["09:00", "10:00", "11:00", "12:00", "13:00", "21:00", "22:00"];

    it("resolves a 1-hour booking on the requested court", () => {
        const grid = [
            // 09:00
            [
                { courtId: "court-1", hour: "09:00", status: "available" },
                { courtId: "court-2", hour: "09:00", status: "available" },
            ],
        ];

        const result = resolveContinuousSlots(
            "court-1",
            "Court 1",
            "09:00",
            1,
            hours,
            grid,
            masterCourts
        );

        expect(result.available).toBe(true);
        expect(result.segments).toHaveLength(1);
        expect(result.segments[0].courtId).toBe("court-1");
        expect(result.hasCourtJump).toBe(false);
        expect(result.totalPrice).toBe(300);
    });

    it("resolves multiple hours on the same court when free", () => {
        const grid = [
            // 09:00
            [
                { courtId: "court-1", hour: "09:00", status: "available" },
                { courtId: "court-2", hour: "09:00", status: "available" },
            ],
            // 10:00
            [
                { courtId: "court-1", hour: "10:00", status: "available" },
                { courtId: "court-2", hour: "10:00", status: "available" },
            ],
            // 11:00
            [
                { courtId: "court-1", hour: "11:00", status: "available" },
                { courtId: "court-2", hour: "11:00", status: "available" },
            ],
        ];

        const result = resolveContinuousSlots(
            "court-1",
            "Court 1",
            "09:00",
            3,
            hours,
            grid,
            masterCourts
        );

        expect(result.available).toBe(true);
        expect(result.segments).toHaveLength(3);
        expect(result.hasCourtJump).toBe(false);
        expect(result.segments.every((s) => s.courtId === "court-1")).toBe(true);
        expect(result.totalPrice).toBe(900);
    });

    it("smart court jump: switches to Court 2 when Court 1 is booked at 10:00", () => {
        const grid = [
            // 09:00 (Court 1 free)
            [
                { courtId: "court-1", hour: "09:00", status: "available" },
                { courtId: "court-2", hour: "09:00", status: "available" },
            ],
            // 10:00 (Court 1 is BOOKED, Court 2 is free)
            [
                { courtId: "court-1", hour: "10:00", status: "booked" },
                { courtId: "court-2", hour: "10:00", status: "available" },
            ],
        ];

        const result = resolveContinuousSlots(
            "court-1",
            "Court 1",
            "09:00",
            2,
            hours,
            grid,
            masterCourts
        );

        expect(result.available).toBe(true);
        expect(result.segments).toHaveLength(2);
        expect(result.segments[0].courtId).toBe("court-1");
        expect(result.segments[1].courtId).toBe("court-2");
        expect(result.segments[1].isJump).toBe(true);
        expect(result.hasCourtJump).toBe(true);
        expect(result.totalPrice).toBe(600);
    });

    it("disallows bookings exceeding venue close time (23:00)", () => {
        const grid = [
            // 21:00
            [
                { courtId: "court-1", hour: "21:00", status: "available" },
            ],
            // 22:00
            [
                { courtId: "court-1", hour: "22:00", status: "available" },
            ],
        ];

        // 3 hours starting at 21:00 would end at 24:00 (past 23:00)
        const result = resolveContinuousSlots(
            "court-1",
            "Court 1",
            "21:00",
            3,
            hours,
            grid,
            masterCourts,
            "23:00"
        );

        expect(result.available).toBe(false);
        expect(result.disabledReason).toContain("Exceeds closing time");
    });

    it("disables duration when no courts are available for a subsequent hour", () => {
        const grid = [
            // 09:00 (Court 1 free)
            [
                { courtId: "court-1", hour: "09:00", status: "available" },
                { courtId: "court-2", hour: "09:00", status: "available" },
            ],
            // 10:00 (ALL courts booked)
            [
                { courtId: "court-1", hour: "10:00", status: "booked" },
                { courtId: "court-2", hour: "10:00", status: "booked" },
                { courtId: "court-3", hour: "10:00", status: "booked" },
                { courtId: "court-4", hour: "10:00", status: "booked" },
            ],
        ];

        const result = resolveContinuousSlots(
            "court-1",
            "Court 1",
            "09:00",
            2,
            hours,
            grid,
            masterCourts
        );

        expect(result.available).toBe(false);
        expect(result.disabledReason).toContain("No court available");
    });
});

