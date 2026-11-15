import { describe, it, expect, vi } from "vitest";
import { getBookingGridForDate } from "./booking-grid.service";

const mockCourts = [
    { id: "court-1", name: "Court 1", is_active: true, status: "Available", hourly_rate: 300 },
];

const mockBookings = [
    {
        id: "b-pending-1",
        court_id: "court-1",
        start_time: "14:00:00",
        end_time: "15:00:00",
        status: "pending",
        customer_id: "user-abc",
        created_at: new Date().toISOString(),
        profiles: { full_name: "Pending Player" },
    },
    {
        id: "b-expired-1",
        court_id: "court-1",
        start_time: "16:00:00",
        end_time: "17:00:00",
        status: "pending",
        customer_id: "user-def",
        // Created 30 mins ago — expired hold
        created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        profiles: { full_name: "Expired Player" },
    },
];

vi.mock("@/lib/supabase/server", () => ({
    createClient: vi.fn().mockResolvedValue({
        from: (table: string) => ({
            select: () => ({
                order: () => Promise.resolve({ data: mockCourts }),
                eq: () => ({
                    in: () => Promise.resolve({ data: mockBookings }),
                }),
            }),
        }),
    }),
}));

vi.mock("@/lib/services/schedule.service", () => ({
    getOperatingHoursForDate: vi.fn().mockResolvedValue({
        openTime: "09:00",
        closeTime: "22:00",
        isClosed: false,
    }),
}));

// Future date to avoid "passed" status
const futureDate = "2099-01-01";

describe("booking-grid.service pending holds", () => {
    it("attaches customerId and status: 'pending' to active pending holds", async () => {
        const gridData = await getBookingGridForDate(futureDate);
        expect(gridData).not.toBeNull();

        // 14:00 slot has active pending booking
        const slot14 = gridData!.grid.find((row) => row[0].hour === "14:00")?.[0];
        expect(slot14).toBeDefined();
        expect(slot14?.booking?.id).toBe("b-pending-1");
        expect(slot14?.booking?.customerId).toBe("user-abc");
        expect(slot14?.booking?.status).toBe("pending");

        // 16:00 slot had expired pending booking (>15m) -> should be open ("available")
        const slot16 = gridData!.grid.find((row) => row[0].hour === "16:00")?.[0];
        expect(slot16).toBeDefined();
        expect(slot16?.status).toBe("available");
        expect(slot16?.booking).toBeUndefined();
    });
});
