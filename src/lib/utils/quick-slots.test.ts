import { describe, it, expect } from "vitest";
import { extractQuickSlotsSummary } from "./quick-slots";
import type { BookingGridData } from "../services/booking-grid.service";

function makeGridData(overrides?: Partial<BookingGridData>): BookingGridData {
    return {
        date: "2026-11-03",
        operatingOpen: "09:00",
        operatingClose: "23:00",
        courts: [
            { id: "c1", name: "Court 1", status: "Available", hourly_rate: 300 },
            { id: "c2", name: "Court 2", status: "Available", hourly_rate: 300 },
            { id: "c3", name: "Court 3", status: "Maintenance", hourly_rate: 300 },
            { id: "c4", name: "Court 4", status: "Available", hourly_rate: 400 },
        ],
        hours: ["16:00", "17:00", "18:00", "19:00"],
        grid: [
            // 16:00 -> 2 courts available (c1, c2) -> Next Available (emerald)
            [
                { courtId: "c1", courtName: "Court 1", hour: "16:00", status: "available", isPeak: false },
                { courtId: "c2", courtName: "Court 2", hour: "16:00", status: "available", isPeak: false },
                { courtId: "c3", courtName: "Court 3", hour: "16:00", status: "maintenance", isPeak: false },
                { courtId: "c4", courtName: "Court 4", hour: "16:00", status: "booked", isPeak: false },
            ],
            // 17:00 -> 2 courts available (c2, c4) -> Prime Time (amber)
            [
                { courtId: "c1", courtName: "Court 1", hour: "17:00", status: "booked", isPeak: false },
                { courtId: "c2", courtName: "Court 2", hour: "17:00", status: "available", isPeak: false },
                { courtId: "c3", courtName: "Court 3", hour: "17:00", status: "maintenance", isPeak: false },
                { courtId: "c4", courtName: "Court 4", hour: "17:00", status: "available", isPeak: false },
            ],
            // 18:00 -> 1 court available (c4 @ 400/hr) -> Only 1 Court Left! (rose) overrides Prime Time
            [
                { courtId: "c1", courtName: "Court 1", hour: "18:00", status: "booked", isPeak: true },
                { courtId: "c2", courtName: "Court 2", hour: "18:00", status: "booked", isPeak: true },
                { courtId: "c3", courtName: "Court 3", hour: "18:00", status: "maintenance", isPeak: true },
                { courtId: "c4", courtName: "Court 4", hour: "18:00", status: "available", isPeak: true },
            ],
            // 19:00 -> 1 court available (c1)
            [
                { courtId: "c1", courtName: "Court 1", hour: "19:00", status: "available", isPeak: true },
                { courtId: "c2", courtName: "Court 2", hour: "19:00", status: "booked", isPeak: true },
                { courtId: "c3", courtName: "Court 3", hour: "19:00", status: "maintenance", isPeak: true },
                { courtId: "c4", courtName: "Court 4", hour: "19:00", status: "booked", isPeak: true },
            ],
        ],
        ...overrides,
    };
}

describe("extractQuickSlotsSummary", () => {
    it("returns safe defaults when gridData is null", () => {
        const res = extractQuickSlotsSummary(null);
        expect(res.totalOpenSlots).toBe(0);
        expect(res.lowestHourlyRate).toBe(300);
        expect(res.lowestSplitPerPlayer).toBe(75);
        expect(res.slots).toEqual([]);
    });

    it("counts total open slots and extracts slots across all available courts", () => {
        const res = extractQuickSlotsSummary(makeGridData(), 4);
        expect(res.totalOpenSlots).toBe(6);
        expect(res.openCourtsCount).toBe(3);
        expect(res.lowestHourlyRate).toBe(300);
        expect(res.lowestSplitPerPlayer).toBe(75);
        expect(res.slots).toHaveLength(4);

        // Every available court (c1, c2, c4) must be represented
        const courtIds = res.slots.map((s) => s.courtId);
        expect(courtIds).toContain("c1");
        expect(courtIds).toContain("c2");
        expect(courtIds).toContain("c4");

        expect(res.slots[0]).toMatchObject({
            courtId: "c1",
            courtName: "Court 1",
            hour: "16:00",
            endHour: "17:00",
            timeLabel: "04:00 PM – 05:00 PM",
            hourlyRate: 300,
            splitPerPlayer: 75,
            openCourtsAtHour: 2,
            badgeLabel: "Next Available",
            badgeTone: "emerald",
        });

        expect(res.slots[1]).toMatchObject({
            courtId: "c2",
            courtName: "Court 2",
            hour: "16:00",
            endHour: "17:00",
            timeLabel: "04:00 PM – 05:00 PM",
            badgeLabel: "Next Available",
            badgeTone: "emerald",
        });

        expect(res.slots[2]).toMatchObject({
            courtId: "c2",
            courtName: "Court 2",
            hour: "17:00",
            endHour: "18:00",
            timeLabel: "05:00 PM – 06:00 PM",
            hourlyRate: 300,
            splitPerPlayer: 75,
            openCourtsAtHour: 2,
            badgeLabel: "Prime Time",
            badgeTone: "amber",
        });

        expect(res.slots[3]).toMatchObject({
            courtId: "c4",
            courtName: "Court 4",
            hour: "17:00",
            endHour: "18:00",
            timeLabel: "05:00 PM – 06:00 PM",
            hourlyRate: 400,
            splitPerPlayer: 100,
            openCourtsAtHour: 2,
            badgeLabel: "Prime Time",
            badgeTone: "amber",
        });
    });

    it("ignores cells marked available if the parent court status is Maintenance or Not Available", () => {
        const grid = makeGridData({
            courts: [
                { id: "c1", name: "Court 1", status: "Maintenance", hourly_rate: 300 },
            ],
            hours: ["10:00"],
            grid: [
                [
                    { courtId: "c1", courtName: "Court 1", hour: "10:00", status: "available", isPeak: false },
                ],
            ],
        });
        const res = extractQuickSlotsSummary(grid);
        expect(res.totalOpenSlots).toBe(0);
        expect(res.openCourtsCount).toBe(0);
        expect(res.slots).toEqual([]);
    });

    it("returns 0 slots and empty array when grid is marked isClosed", () => {
        const grid = makeGridData({
            isClosed: true,
            hours: [],
            grid: [],
        });
        const res = extractQuickSlotsSummary(grid);
        expect(res.totalOpenSlots).toBe(0);
        expect(res.openCourtsCount).toBe(0);
        expect(res.slots).toEqual([]);
    });
});

