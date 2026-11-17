import { describe, it, expect, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import DateSelector, { getBookingDateUrl } from "./DateSelector";

vi.mock("next/navigation", () => ({
    useRouter: () => ({ push: vi.fn() }),
}));

describe("DateSelector", () => {
    it("generates booking URLs targeted to /book instead of the landing page", () => {
        const url = getBookingDateUrl("2026-11-20");
        expect(url).toBe("/book?date=2026-11-20#book-a-court");
        expect(url.startsWith("/book?")).toBe(true);
        expect(url.startsWith("/?")).toBe(false);
    });

    it("renders calendar days and custom date picker input", () => {
        const html = renderToStaticMarkup(
            <DateSelector selectedDate="2026-11-16" today="2026-11-16" />
        );

        expect(html).toContain("TODAY");
        expect(html).toContain("More");
        expect(html).toContain("Date");
        expect(html).toContain('type="date"');
    });
});
