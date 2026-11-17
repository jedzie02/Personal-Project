import { describe, it, expect, vi } from "vitest";
import { submitConfirmBooking } from "./actions";

vi.mock("@/lib/supabase/server", () => ({
    createClient: vi.fn().mockResolvedValue({
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-123", email: "test@example.com" } } }) },
        from: () => ({
            select: () => ({ eq: () => ({ maybeSingle: vi.fn().mockResolvedValue({ data: null }) }) }),
            insert: vi.fn().mockResolvedValue({}),
        }),
    }),
}));

vi.mock("@/lib/services/auth.server", () => ({
    getCurrentProfile: vi.fn().mockResolvedValue({ id: "user-123", email: "test@example.com", full_name: "Test User" }),
}));

const mockCreateBooking = vi.fn().mockResolvedValue({ success: true, bookingId: "bk-999" });
vi.mock("@/lib/services/booking.service", () => ({
    createBooking: (...args: any[]) => mockCreateBooking(...args),
    cancelBooking: vi.fn(),
}));

describe("submitConfirmBooking", () => {
    it("creates the booking with markAsConfirmed: false so it remains pending payment", async () => {
        await submitConfirmBooking({
            courtId: "court-1",
            rate: 300,
            paymentMethod: "QR Ph",
            date: "2026-11-15",
            start: "14:00",
            end: "15:00",
        });

        expect(mockCreateBooking).toHaveBeenCalledWith(
            expect.objectContaining({
                markAsConfirmed: false,
                paymentStatus: "pending",
            })
        );
    });
});
