import { describe, it, expect, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import OpenPlayPage from "./page";

vi.mock("@/lib/services/open-play.service", () => ({
    listUpcomingSessions: vi.fn().mockResolvedValue([
        {
            id: "session-1",
            courtId: "c1",
            courtName: "Court 1",
            date: "2099-01-01",
            startTime: "18:00",
            endTime: "20:00",
            pricePerPlayer: 150,
            playerCap: 8,
            spotsLeft: 5,
            status: "scheduled",
        },
    ]),
}));

vi.mock("@/components/Navbar", () => ({
    Navbar: () => <nav data-testid="navbar">Navbar</nav>,
}));

vi.mock("@/components/booking/JoinOpenPlayButton", () => ({
    default: () => <button>Join</button>,
}));

describe("OpenPlayPage", () => {
    it("renders the Open Play page with header and session cards", async () => {
        const jsx = await OpenPlayPage();
        const html = renderToStaticMarkup(jsx);
        expect(html).toContain("Open Play Sessions");
        expect(html).toContain("Court 1");
        expect(html).toContain("₱150");
    });
});
