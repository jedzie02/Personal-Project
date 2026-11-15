import { describe, it, expect, vi } from "vitest";
import { completePaymentAction } from "./actions";

vi.mock("@/lib/services/auth.server", () => ({
    getCurrentProfile: vi.fn().mockResolvedValue({ id: "user-1", email: "player@example.com" }),
}));

vi.mock("@/lib/services/booking.service", () => ({
    updateBookingPaymentReference: vi.fn().mockResolvedValue({ success: true }),
    getBookingById: vi.fn().mockResolvedValue({ id: "booking-1", customerId: "user-1", totalPrice: 300 }),
}));

vi.mock("next/cache", () => ({
    revalidatePath: vi.fn(),
}));

describe("completePaymentAction", () => {
    it("marks booking payment as completed/submitted when authenticated", async () => {
        const result = await completePaymentAction("booking-1");
        expect(result.success).toBe(true);
    });

    it("fails when bookingId is missing", async () => {
        const result = await completePaymentAction("");
        expect(result.success).toBe(false);
        expect(result.error).toMatch(/Missing booking identifier/i);
    });
});
