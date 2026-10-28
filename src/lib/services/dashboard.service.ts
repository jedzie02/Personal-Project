import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveCourts } from "@/lib/services/court.service";
import { getTodaysBookings } from "@/lib/services/booking.service";
import { getCustomerDisplayName } from "@/lib/services/customer.service";
import type { DashboardStats } from "@/lib/types/domain";

async function getDbClient() {
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
        try {
            return createAdminClient();
        } catch {
            // fallback
        }
    }
    return await createClient();
}

/**
 * dashboard.service.ts
 *
 * Nothing here is stored anywhere — every number is computed fresh
 * from bookings/courts each time this is called, same philosophy as
 * availability (Goal G5): a dashboard showing stale cached numbers
 * would be worse than useless for an admin trying to run the venue.
 */
export async function getDashboardStats(): Promise<DashboardStats> {
    const supabase = await getDbClient();
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
    paymentMethod?: "card" | "cash" | "gcash";
    amount: number;
}

export interface SystemAlert {
    id: string;
    level: "warning" | "info" | "success";
    message: string;
}

/** Fetches real upcoming reservations from Supabase with resilient customer resolution. */
export async function getUpcomingReservations(limit: number = 5): Promise<UpcomingReservation[]> {
    const supabase = await getDbClient();
    const today = new Date().toISOString().split("T")[0];

    // 1. Primary query: attempt to join courts and profiles
    let { data, error } = await supabase
        .from("bookings")
        .select(
            `id, customer_id, booking_date, start_time, end_time, total_price, status, payment_status, payment_method,
             courts ( name ),
             profiles ( full_name, email )`
        )
        .gte("booking_date", today)
        .in("status", ["pending", "confirmed"])
        .order("booking_date", { ascending: true })
        .order("start_time", { ascending: true })
        .limit(limit);

    let rawBookings: any[] | null = data;

    // 2. Fallback query if foreign-key relationship had ambiguity in PostgREST
    if (error || !rawBookings) {
        const retry = await supabase
            .from("bookings")
            .select(
                `id, customer_id, booking_date, start_time, end_time, total_price, status, payment_status, payment_method,
                 courts ( name )`
            )
            .gte("booking_date", today)
            .in("status", ["pending", "confirmed"])
            .order("booking_date", { ascending: true })
            .order("start_time", { ascending: true })
            .limit(limit);
        rawBookings = retry.data as any[];
    }

    if (!rawBookings || rawBookings.length === 0) {
        return [];
    }

    // 3. Direct lookup into public.profiles to guarantee accurate customer name & email
    const customerIds = Array.from(
        new Set(
            rawBookings
                .map((row) => row.customer_id)
                .filter(Boolean)
        )
    );

    const profileMap = new Map<string, { full_name: string | null; email: string | null }>();
    if (customerIds.length > 0) {
        const { data: profileRows } = await supabase
            .from("profiles")
            .select("id, full_name, email")
            .in("id", customerIds);

        for (const p of profileRows || []) {
            profileMap.set(p.id, { full_name: p.full_name, email: p.email });
        }
    }

    return (rawBookings as unknown as Array<{
        id: string;
        customer_id?: string;
        booking_date: string;
        start_time: string;
        end_time: string;
        total_price: number;
        status: string;
        payment_status?: string;
        payment_method?: string;
        courts: { name: string } | { name: string }[] | null;
        profiles: { full_name: string | null; email: string | null } | { full_name: string | null; email: string | null }[] | null;
    }>).map((row) => {
        const courtObj = Array.isArray(row.courts) ? row.courts[0] : row.courts;
        const joinedProfile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
        const directProfile = row.customer_id ? profileMap.get(row.customer_id) : null;
        const profileObj = directProfile || joinedProfile;

        const isPaid = row.payment_status === "succeeded" || (!row.payment_status && row.status === "confirmed");

        let method: "card" | "cash" | "gcash" = "cash";
        const rawMethod = (row.payment_method || "").toLowerCase();
        if (rawMethod.includes("gcash") || rawMethod.includes("qr")) {
            method = "gcash";
        } else if (rawMethod.includes("card") || rawMethod.includes("stripe")) {
            method = "card";
        }

        const effectiveCustomerId = row.customer_id || null;
        const customerName = getCustomerDisplayName(profileObj?.full_name, effectiveCustomerId, profileObj?.email);
        const customerEmail = profileObj?.email || "—";

        return {
            id: row.id,
            customer: customerName,
            email: customerEmail,
            court: courtObj?.name ?? "Court",
            date: row.booking_date,
            time: `${row.start_time} – ${row.end_time}`,
            status: (row.status as UpcomingReservation["status"]) || "confirmed",
            paymentStatus: (row.payment_status as UpcomingReservation["paymentStatus"]) || (isPaid ? "succeeded" : "pending"),
            paymentMethod: method,
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
