import { describe, it, expect, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import BookingConfirmationPage from "./page";

vi.mock("@/lib/services/booking.service", () => ({
    getBookingById: vi.fn().mockResolvedValue({
        id: "b-test-1234",
        courtName: "Court 1",
        bookingDate: "2026-11-15",
        startTime: "14:00",
        endTime: "15:00",
        totalPrice: 300,
        status: "confirmed",
        paymentStatus: "pending",
        paymentMethod: "QR Ph",
        paymentReference: "QRPH-BTEST123",
    }),
    getBookingsForCustomer: vi.fn().mockResolvedValue([]),
    getBookingsByPaymentReference: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/lib/services/payment.service", () => ({
    syncStripePaymentIfNeeded: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/services/auth.server", () => ({
    getCurrentProfile: vi.fn().mockResolvedValue({ id: "user-1", email: "player@example.com" }),
}));

vi.mock("@/lib/services/settings.service", () => ({
    getGCashSettings: vi.fn().mockResolvedValue({
        gcash_number: "0917-123-4567",
        gcash_name: "PICKLEBALL CLUB",
        gcash_qr_url: "/gcash-qr.jpg",
    }),
}));

describe("BookingConfirmationPage", () => {
    it("renders confirmation without GCash reference input form", async () => {
        const page = await BookingConfirmationPage({
            searchParams: Promise.resolve({ bookingId: "b-test-1234" }),
        });
        const html = renderToStaticMarkup(page);

        // Header
        expect(html).toContain("Booking Confirmed!");

        // Payment status banner
        expect(html).toContain("QR Ph Payment Recorded");

        // Must NOT render input for reference number
        expect(html).not.toContain("Enter 13-digit reference");
        expect(html).not.toContain("name=\"referenceNo\"");
    });
});
