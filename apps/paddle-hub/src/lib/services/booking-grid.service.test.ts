import { describe, it, expect, vi } from "vitest";
import { getBookingGridForDate } from "./booking-grid.service";
import { OPEN_PLAY_HOLD_LABEL } from "@/lib/utils/open-play";

const mockCourts = [
    { id: "court-1", name: "Court 1", is_active: true, status: "Available", hourly_rate: 300 },
];

const mockOpenPlaySessions = [
    {
        id: "ops-1",
        court_id: "court-1",
        session_date: "2099-01-01",
        start_time: "18:00:00",
        end_time: "20:00:00",
        price_per_player: 200,
        status: "scheduled",
    },
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
    {
        id: "b-open-play-1",
        court_id: "court-1",
        start_time: "18:00:00",
        end_time: "20:00:00",
        status: "confirmed",
        customer_id: "admin-1",
        payment_method: OPEN_PLAY_HOLD_LABEL,
        created_at: new Date().toISOString(),
        profiles: { full_name: "Admin Hold" },
    },
];

vi.mock("@/lib/supabase/server", () => ({
    createClient: vi.fn().mockResolvedValue({
        from: (table: string) => {
            if (table === "courts") {
                return {
                    select: () => {
                        const courtQuery: any = {
                            eq: () => courtQuery,
                            order: () => Promise.resolve({ data: mockCourts }),
                        };
                        return courtQuery;
                    },
                };
            }
            if (table === "open_play_sessions") {
                return {
                    select: () => ({
                        eq: () => ({
                            neq: () => Promise.resolve({ data: mockOpenPlaySessions }),
                        }),
                    }),
                };
            }
            return {
                select: () => ({
                    eq: () => ({
                        in: () => Promise.resolve({ data: mockBookings }),
                    }),
                }),
            };
        },
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

    it("assigns status: 'open_play' and openPlay details when booking has OPEN_PLAY_HOLD_LABEL", async () => {
        const gridData = await getBookingGridForDate(futureDate);
        expect(gridData).not.toBeNull();

        const slot18 = gridData!.grid.find((row) => row[0].hour === "18:00")?.[0];
        expect(slot18).toBeDefined();
        expect(slot18?.status).toBe("open_play");
        expect(slot18?.openPlay?.pricePerPlayer).toBe(200);
        expect(slot18?.openPlay?.sessionId).toBe("ops-1");
    });

    it("only includes active courts and excludes deactivated courts", async () => {
        const gridData = await getBookingGridForDate(futureDate);
        expect(gridData).not.toBeNull();
        expect(gridData?.courts.map((c) => c.name)).toEqual(["Court 1"]);
    });

    it("excludes courts with status 'Not Available' or is_active: false while keeping 'Maintenance' courts visible", async () => {
        const { createClient } = await import("@/lib/supabase/server");
        const multiCourts = [
            { id: "court-1", name: "Court 1", is_active: true, status: "Available", hourly_rate: 300 },
            { id: "court-2", name: "Court 2", is_active: false, status: "Not Available", hourly_rate: 300 },
            { id: "court-3", name: "Court 3", is_active: true, status: "Maintenance", hourly_rate: 300 },
            { id: "court-4", name: "Court 4", is_active: true, status: "Not Available", hourly_rate: 300 },
        ];

        vi.mocked(createClient).mockResolvedValueOnce({
            from: (table: string) => {
                if (table === "courts") {
                    return {
                        select: () => ({
                            eq: () => ({
                                order: () => Promise.resolve({ data: multiCourts }),
                            }),
                        }),
                    };
                }
                if (table === "open_play_sessions") {
                    return {
                        select: () => ({
                            eq: () => ({
                                neq: () => Promise.resolve({ data: [] }),
                            }),
                        }),
                    };
                }
                return {
                    select: () => ({
                        eq: () => ({
                            in: () => Promise.resolve({ data: [] }),
                        }),
                    }),
                };
            },
        } as any);

        const gridData = await getBookingGridForDate(futureDate);
        expect(gridData).not.toBeNull();
        // Court 2 and Court 4 (Not Available) must be excluded; Court 1 and Court 3 (Maintenance) must be present
        expect(gridData?.courts.map((c) => c.id)).toEqual(["court-1", "court-3"]);
        expect(gridData?.courts.find((c) => c.id === "court-3")?.status).toBe("Maintenance");
    });
});
