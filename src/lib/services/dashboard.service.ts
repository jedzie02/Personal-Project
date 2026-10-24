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
        .filter((b) => (b.status === "confirmed" || b.status === "completed") && b.paymentStatus === "succeeded")
        .reduce((sum, b) => sum + b.totalPrice, 0);

    const todaysUncollected = todaysBookings
        .filter((b) => (b.status === "confirmed" || b.status === "pending") && b.paymentStatus !== "succeeded")
        .reduce((sum, b) => sum + b.totalPrice, 0);

    return {
        todaysBookingsCount: todaysBookings.length,
        todaysRevenue,
        todaysUncollected,
        upcomingBookingsCount: upcomingCountResult.count ?? 0,
        activeCourtsCount: activeCourts.length,
    };
}

export interface UpcomingReservation {
    id: string;
    customer: string;
    email: string;
    court: string;
    date: string;
    time: string;
    status: "confirmed" | "pending" | "cancelled" | "completed";
    paymentStatus?: "pending" | "succeeded" | "failed" | "refunded";
    paymentMethod?: "card" | "cash";
    amount: number;
}

export interface SystemAlert {
    id: string;
    level: "warning" | "info" | "success";
    message: string;
}

/** Fetches real upcoming reservations from Supabase. */
export async function getUpcomingReservations(limit: number = 5): Promise<UpcomingReservation[]> {
    const supabase = await createClient();
    const today = new Date().toISOString().split("T")[0];

    const { data, error } = await supabase
        .from("bookings")
        .select(
            `id, booking_date, start_time, end_time, total_price, status, payment_status,
             courts ( name ),
             profiles ( full_name, email )`
        )
        .gte("booking_date", today)
        .in("status", ["pending", "confirmed"])
        .order("booking_date", { ascending: true })
        .order("start_time", { ascending: true })
        .limit(limit);

    if (error || !data || data.length === 0) {
        return [];
    }

    return (data as unknown as Array<{
        id: string;
        booking_date: string;
        start_time: string;
        end_time: string;
        total_price: number;
        status: string;
        payment_status?: string;
        courts: { name: string } | { name: string }[] | null;
        profiles: { full_name: string | null; email: string | null } | { full_name: string | null; email: string | null }[] | null;
    }>).map((row) => {
        const courtObj = Array.isArray(row.courts) ? row.courts[0] : row.courts;
        const profileObj = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
        const isPaid = row.payment_status === "succeeded" || (!row.payment_status && row.status === "confirmed");
        return {
            id: row.id,
            customer: profileObj?.full_name ?? "Walk-in Guest",
            email: profileObj?.email ?? "guest@pickle.com",
            court: courtObj?.name ?? "Court",
            date: row.booking_date,
            time: `${row.start_time} – ${row.end_time}`,
            status: (row.status as UpcomingReservation["status"]) || "confirmed",
            paymentStatus: (row.payment_status as UpcomingReservation["paymentStatus"]) || (isPaid ? "succeeded" : "pending"),
            paymentMethod: profileObj?.email && profileObj.email !== "guest@pickle.com" ? "card" : "cash",
            amount: Number(row.total_price ?? 0),
        };
    });
}

/** Dynamically computes live alerts from Supabase. */
export async function getLiveSystemAlerts(): Promise<SystemAlert[]> {
    const supabase = await createClient();
    const alerts: SystemAlert[] = [];

    // 1. Check courts under maintenance
    const { data: courts } = await supabase.from("courts").select("name, status, is_active");
    const maintenanceCourts = courts?.filter((c) => c.status === "Maintenance" || c.is_active === false) || [];
    if (maintenanceCourts.length > 0) {
        maintenanceCourts.forEach((c, idx) => {
            alerts.push({
                id: `alert-maint-${idx}`,
                level: "warning",
                message: `${c.name} is currently flagged for maintenance.`,
            });
        });
    } else {
        alerts.push({
            id: "alert-courts-ok",
            level: "success",
            message: "All courts are operational and running smoothly.",
        });
    }

    // 2. Check pending bookings
    const { count: pendingCount } = await supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending");

    if (pendingCount && pendingCount > 0) {
        alerts.push({
            id: "alert-pending-bookings",
            level: "info",
            message: `${pendingCount} booking${pendingCount > 1 ? "s" : ""} pending confirmation.`,
        });
    }

    return alerts;
}