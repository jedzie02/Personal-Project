import { describe, it, expect, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import BookPage from "./page";

vi.mock("next/navigation", () => ({
    useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/components/Navbar", () => ({
    Navbar: () => <header data-testid="mock-navbar">DinkSync Nav</header>,
}));

vi.mock("@/lib/supabase/server", () => ({
    createClient: vi.fn().mockResolvedValue({
        from: () => ({
            select: () => {
                const chain: any = {
                    eq: () => chain,
                    order: () => Promise.resolve({
                        data: [
                            { id: "court-1", name: "Court 1", status: "Available", hourly_rate: 300, is_active: true },
                            { id: "court-2", name: "Court 2", status: "Available", hourly_rate: 300, is_active: true },
                        ],
                    }),
                };
                return chain;
            },
        }),
    }),
}));

vi.mock("@/lib/services/booking-grid.service", () => ({
    getBookingGridForDate: vi.fn().mockResolvedValue({
        date: "2026-11-15",
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
    }),
}));

describe("BookPage", () => {
    it("renders the 3-step booking guide and booking grid", async () => {
        const PageComponent = await BookPage({
            searchParams: Promise.resolve({ date: "2026-11-15" }),
        });
        const html = renderToStaticMarkup(PageComponent);

        // Header / Navbar
        expect(html).toContain("DinkSync Nav");

        // 3-step guide
        expect(html).toContain("Book a court in 3 simple steps");
        expect(html).toContain("Select your slot");
        expect(html).toContain("Scan &amp; pay");
        expect(html).toContain("Take the court");

        // Court status overview & slot prices inside Available buttons
        expect(html).toContain("Court 1");
        expect(html).toContain("₱300");

        // Available Times
        expect(html).toContain("Available Times");
    });

    it("renders error banner when error param is present", async () => {
        const PageComponent = await BookPage({
            searchParams: Promise.resolve({ error: "Selected slot is no longer available" }),
        });
        const html = renderToStaticMarkup(PageComponent);

        expect(html).toContain("Selected slot is no longer available");
    });
});
