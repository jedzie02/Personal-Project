import { describe, it, expect, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import OpenPlayPaymentPage from "./page";

vi.mock("@/lib/services/auth.server", () => ({
    getCurrentProfile: vi.fn().mockResolvedValue({ id: "user-1", email: "user@test.com" }),
}));

vi.mock("@/lib/services/open-play.service", () => ({
    getEntryForCustomer: vi.fn().mockResolvedValue({
        id: "entry-1",
        amount: 100,
        status: "pending",
        session: {
            courtName: "Court 1",
            date: "2026-11-20",
            startTime: "18:00",
            endTime: "20:00",
        },
    }),
}));

vi.mock("@/lib/services/settings.service", () => ({
    getGCashSettings: vi.fn().mockResolvedValue({
        gcash_name: "Admin User",
        gcash_number: "09171234567",
        gcash_qr_url: "/custom-qr.jpg",
    }),
}));

vi.mock("@/components/Navbar", () => ({
    Navbar: () => <nav data-testid="navbar">Navbar</nav>,
}));

vi.mock("next/navigation", () => ({
    redirect: vi.fn(),
    useRouter: () => ({ push: vi.fn() }),
}));

describe("OpenPlayPaymentPage", () => {
    it("renders payment page with session details", async () => {
        const jsx = await OpenPlayPaymentPage({
            searchParams: Promise.resolve({ entryId: "entry-1" }),
        });
        const html = renderToStaticMarkup(jsx);
        expect(html).toContain("Scan QR Ph to Pay");
        expect(html).toContain("Court 1");
        expect(html).toContain("₱100.00");
    });
});
