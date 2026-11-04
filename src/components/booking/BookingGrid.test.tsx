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

describe("BookingGrid single-court layout", () => {
    it("renders responsive sm:grid-cols-[180px_1fr] when filtering to an individual court", () => {
        const html = renderToStaticMarkup(
            <BookingGrid data={mockGridData} initialCourtFilter="court-1" />
        );

        // Header and rows must have the responsive single-court grid definition
        expect(html).toContain("sm:grid-cols-[180px_1fr]");
        expect(html).toContain("grid-cols-[115px_1fr]");
    });

    it("renders 4-column layout when All Courts is selected", () => {
        const html = renderToStaticMarkup(
            <BookingGrid data={mockGridData} initialCourtFilter="all" />
        );

        expect(html).toContain("sm:grid-cols-[170px_repeat(4,1fr)]");
    });
});
