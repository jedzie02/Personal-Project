import { describe, it, expect, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PaymentClient } from "./PaymentClient";

vi.mock("next/navigation", () => ({
    useRouter: () => ({ push: vi.fn() }),
}));

describe("PaymentClient", () => {
    it("renders QR code, price ₱300, Save QR to photos, and I've Completed Payment button", () => {
        const mockSubmit = vi.fn().mockResolvedValue({ success: true });
        const html = renderToStaticMarkup(
            <PaymentClient
                bookingId="b1234567"
                totalPrice={300}
                courtName="Court 1"
                bookingDate="2026-11-15"
                startTime="14:00"
                endTime="15:00"
                qrImageUrl="/gcash-qr.jpg"
                completeAction={mockSubmit}
            />
        );

        // Price below QR code
        expect(html).toContain("₱300.00");

        // Save QR to photos button
        expect(html).toContain("Save QR to photos");

        // I've Completed Payment button
        expect(html).toContain("I&#x27;ve Completed Payment");

        // Court details
        expect(html).toContain("Court 1");

        // Reference number input MUST NOT exist
        expect(html).not.toContain("Enter reference number");
    });
});
