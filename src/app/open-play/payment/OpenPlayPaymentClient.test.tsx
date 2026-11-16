import { describe, it, expect, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { OpenPlayPaymentClient } from "./OpenPlayPaymentClient";

vi.mock("next/navigation", () => ({
    useRouter: () => ({ push: vi.fn() }),
}));

describe("OpenPlayPaymentClient", () => {
    it("renders QR code, price ₱100.00, Save QR to photos, and I've Completed Payment button", () => {
        const mockSubmit = vi.fn().mockResolvedValue({ success: true });
        const html = renderToStaticMarkup(
            <OpenPlayPaymentClient
                entryId="entry-12345678"
                totalPrice={100}
                courtName="Court 2"
                sessionDate="2026-11-20"
                startTime="18:00"
                endTime="20:00"
                qrImageUrl="/gcash-qr.jpg"
                completeAction={mockSubmit}
            />
        );

        // Scan header
        expect(html).toContain("Scan QR Ph to Pay");

        // Price below QR code
        expect(html).toContain("₱100.00");

        // Save QR to photos button
        expect(html).toContain("Save QR to photos");

        // I've Completed Payment button
        expect(html).toContain("I&#x27;ve Completed Payment");

        // Court details
        expect(html).toContain("Court 2");

        // Reference number input MUST NOT exist
        expect(html).not.toContain("Enter reference number");
    });
});
