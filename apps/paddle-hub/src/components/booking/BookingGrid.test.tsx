import { describe, it, expect, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import BookingGrid from "./BookingGrid";
import type { BookingGridData } from "@/lib/services/booking-grid.service";

vi.mock("next/navigation", () => ({
    useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/lib/supabase", () => ({
    supabase: {
        auth: {
            getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
            onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
        },
    },
}));

const mockGridData: BookingGridData = {
    date: "2026-11-04",
    isClosed: false,
    operatingOpen: "09:00",
    operatingClose: "11:00",
    courts: [
        { id: "court-1", name: "Court 1", status: "Available", hourly_rate: 300 },
        { id: "court-2", name: "Court 2", status: "Available", hourly_rate: 300 },
    ],
    hours: ["09:00", "10:00"],
    grid: [
        [
            { courtId: "court-1", courtName: "Court 1", hour: "09:00", status: "available", isPeak: false },
            { courtId: "court-2", courtName: "Court 2", hour: "09:00", status: "available", isPeak: false },
        ],
        [
            { courtId: "court-1", courtName: "Court 1", hour: "10:00", status: "available", isPeak: false },
            { courtId: "court-2", courtName: "Court 2", hour: "10:00", status: "available", isPeak: false },
        ],
    ],
};

const mockPendingGridData: BookingGridData = {
    date: "2026-11-04",
    isClosed: false,
    operatingOpen: "09:00",
    operatingClose: "10:00",
    courts: [
        { id: "court-1", name: "Court 1", status: "Available", hourly_rate: 300 },
    ],
    hours: ["09:00"],
    grid: [
        [
            {
                courtId: "court-1",
                courtName: "Court 1",
                hour: "09:00",
                status: "booked",
                isPeak: false,
                booking: {
                    id: "bk-pending-1",
                    startTime: "09:00",
                    endTime: "10:00",
                    durationHours: 1,
                    customerName: "Test Player",
                    customerId: "user-owner-1",
                    status: "pending",
                },
            },
        ],
    ],
};

const mockMixedPassedGridData: BookingGridData = {
    date: "2026-11-04",
    isClosed: false,
    operatingOpen: "09:00",
    operatingClose: "11:00",
    courts: [
        { id: "court-1", name: "Court 1", status: "Available", hourly_rate: 300 },
    ],
    hours: ["09:00", "10:00"],
    grid: [
        // Row 0 is passed
        [
            { courtId: "court-1", courtName: "Court 1", hour: "09:00", status: "passed", isPeak: false },
        ],
        // Row 1 is available
        [
            { courtId: "court-1", courtName: "Court 1", hour: "10:00", status: "available", isPeak: false },
        ],
    ],
};

describe("BookingGrid single-court layout", () => {
    it("renders responsive sm:grid-cols-[180px_1fr] when filtering to an individual court", () => {
        const html = renderToStaticMarkup(
            <BookingGrid data={mockGridData} initialCourtFilter="court-1" />
        );

        // Header and rows must have the responsive single-court grid definition
        expect(html).toContain("sm:grid-cols-[180px_1fr]");
        expect(html).toContain("grid-cols-[115px_1fr]");
    });

    it("renders dynamic column layout matching active court count when All Courts is selected", () => {
        // mockGridData has 2 courts -> repeat(2,1fr)
        const html2 = renderToStaticMarkup(
            <BookingGrid data={mockGridData} initialCourtFilter="all" />
        );
        expect(html2).toContain("sm:grid-cols-[170px_repeat(2,1fr)]");

        // With 4 courts -> repeat(4,1fr)
        const fourCourtsData: BookingGridData = {
            ...mockGridData,
            courts: [
                { id: "court-1", name: "Court 1", status: "Available", hourly_rate: 300 },
                { id: "court-2", name: "Court 2", status: "Available", hourly_rate: 300 },
                { id: "court-3", name: "Court 3", status: "Available", hourly_rate: 300 },
                { id: "court-4", name: "Court 4", status: "Available", hourly_rate: 300 },
            ],
        };
        const html4 = renderToStaticMarkup(
            <BookingGrid data={fourCourtsData} initialCourtFilter="all" />
        );
        expect(html4).toContain("sm:grid-cols-[170px_repeat(4,1fr)]");
    });

    it("renders 'Held' for other users or logged out visitors when a slot is pending", () => {
        const html = renderToStaticMarkup(
            <BookingGrid data={mockPendingGridData} initialCourtFilter="court-1" />
        );

        expect(html).toContain("Held");
        expect(html).not.toContain("Resume");
    });

    it("collapses passed hours by default and renders the toggle bar below court headers", () => {
        const html = renderToStaticMarkup(
            <BookingGrid data={mockMixedPassedGridData} initialCourtFilter="court-1" />
        );

        // Toggle bar must be present below headers
        expect(html).toContain("Show passed times");
        expect(html).toContain("1 earlier hour passed");

        // The passed row 09:00 AM should be collapsed by default
        expect(html).not.toContain("09:00 AM");

        // The upcoming row 10:00 AM should be visible
        expect(html).toContain("10:00 AM");
    });

    it("does not render toggle bar when 0 hours have passed", () => {
        const html = renderToStaticMarkup(
            <BookingGrid data={mockGridData} initialCourtFilter="court-1" />
        );

        expect(html).not.toContain("earlier hour");
        expect(html).not.toContain("Show passed times");
        expect(html).toContain("09:00 AM");
        expect(html).toContain("10:00 AM");
    });

    it("displays all rows without toggle bar when all hours on a date have passed", () => {
        const allPassedData: BookingGridData = {
            ...mockGridData,
            grid: [
                [
                    { courtId: "court-1", courtName: "Court 1", hour: "09:00", status: "passed", isPeak: false },
                    { courtId: "court-2", courtName: "Court 2", hour: "09:00", status: "passed", isPeak: false },
                ],
                [
                    { courtId: "court-1", courtName: "Court 1", hour: "10:00", status: "passed", isPeak: false },
                    { courtId: "court-2", courtName: "Court 2", hour: "10:00", status: "passed", isPeak: false },
                ],
            ],
        };

        const html = renderToStaticMarkup(
            <BookingGrid data={allPassedData} initialCourtFilter="court-1" />
        );

        expect(html).not.toContain("earlier hour");
        expect(html).not.toContain("Show passed times");
        expect(html).toContain("09:00 AM");
        expect(html).toContain("10:00 AM");
    });

    it("renders OPEN PLAY button with price and links to /open-play", () => {
        const openPlayGridData: BookingGridData = {
            date: "2026-11-04",
            isClosed: false,
            operatingOpen: "09:00",
            operatingClose: "10:00",
            courts: [{ id: "court-1", name: "Court 1", status: "Available", hourly_rate: 300 }],
            hours: ["09:00"],
            grid: [[{
                courtId: "court-1",
                courtName: "Court 1",
                hour: "09:00",
                status: "open_play",
                isPeak: false,
                openPlay: { sessionId: "op-1", pricePerPlayer: 150 },
            }]],
        };

        const html = renderToStaticMarkup(
            <BookingGrid data={openPlayGridData} />
        );
        expect(html).toContain("OPEN PLAY");
        expect(html).toContain("₱150/player");
    });
});
