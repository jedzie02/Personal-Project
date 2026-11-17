import { describe, it, expect, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ConfirmBookingClient from "./ConfirmBookingClient";

vi.mock("next/navigation", () => ({
    useRouter: () => ({ push: vi.fn() }),
    useSearchParams: () => ({
        get: (param: string) => {
            if (param === "courtId") return "court-1";
            if (param === "courtName") return "Court 1";
            if (param === "rate") return "300";
            if (param === "timeSlot") return "11:00 AM - 12:00 PM";
            if (param === "date") return "2026-11-15";
            return null;
        },
    }),
}));

vi.mock("@/lib/supabase", () => ({
    supabase: {
        auth: {
            getUser: vi.fn().mockResolvedValue({ data: { user: { id: "u1", email: "test@example.com" } } }),
        },
        from: () => ({
            select: () => ({ eq: () => ({ maybeSingle: vi.fn().mockResolvedValue({ data: { full_name: "Test User" } }) }) }),
        }),
    },
}));

describe("ConfirmBookingClient", () => {
    it("renders the QR Ph CTA button with the amount and hides the Card option", () => {
        const html = renderToStaticMarkup(<ConfirmBookingClient />);

        // Must display the requested button with QR Ph
        expect(html).toContain("₱300 with QR Ph");

        // Must NOT display the Card selection option
        expect(html).not.toContain("Debit / Credit");
        expect(html).not.toContain("Confirm &amp; Pay with Card");
    });
});
