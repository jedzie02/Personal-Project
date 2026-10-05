import { createClient } from "@/lib/supabase/server";
import { getActiveCourts } from "@/lib/services/court.service";
import { getTodaysBookings } from "@/lib/services/booking.service";
import type { DashboardStats } from "@/lib/types/domain";

/**
 * dashboard.service.ts
 *
 * Nothing here is stored anywhere — every number is computed fresh
 * from bookings/courts each time this is called, same philosophy as
 * availability (Goal G5): a dashboard showing stale cached numbers
 * would be worse than useless for an admin trying to run the venue.
 */
export async function getDashboardStats(): Promise<DashboardStats> {
    const supabase = await createClient();
    const today = new Date().toISOString().split("T")[0];

    const [todaysBookings, activeCourts, upcomingCountResult] = await Promise.all([
        getTodaysBookings(),
        getActiveCourts(),
        // { count: "exact", head: true } asks Postgres for JUST the row
        // count, not the actual rows — "head" means "don't send me the
        // body, just tell me how many there'd be." Much cheaper than
        // fetching every upcoming booking just to check .length.
        supabase
            .from("bookings")
            .select("id", { count: "exact", head: true })
            .gt("booking_date", today)
            .in("status", ["pending", "confirmed"]),
    ]);

    const todaysRevenue = todaysBookings
        .filter((b) => b.status === "confirmed" || b.status === "completed")
        .reduce((sum, b) => sum + b.totalPrice, 0);

    return {
        todaysBookingsCount: todaysBookings.length,
        todaysRevenue,
        upcomingBookingsCount: upcomingCountResult.count ?? 0,
        activeCourtsCount: activeCourts.length,
    };
}