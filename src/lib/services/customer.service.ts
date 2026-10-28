import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { CustomerSummary, Profile } from "@/lib/types/domain";

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
 * customer.service.ts
 *
 * 100% real, live customer directory powered directly by Supabase.
 * Reads live customer profiles from public.profiles and live bookings from public.bookings.
 */

export function getCustomerDisplayName(
    fullName?: string | null,
    customerId?: string | null,
    email?: string | null
): string {
    const trimmed = fullName?.trim();
    if (trimmed && trimmed.toLowerCase() !== "customer" && trimmed.toLowerCase() !== "customer user") {
        return trimmed;
    }
    if (email && email.trim()) {
        const username = email.split("@")[0]?.trim();
        if (username) return username;
    }
    if (customerId && customerId.trim()) return `Customer (${customerId.slice(0, 8)})`;
    return "Walk-in Guest";
}

export async function getAllCustomersWithBookingCounts(): Promise<CustomerSummary[]> {
    const supabase = await getDbClient();

    // 1. Fetch live profiles from profiles table (include all profiles, not just role='customer')
    const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email, role")
        .order("created_at", { ascending: false });

    // 2. Fetch live bookings to aggregate counts and spend
    const { data: bookings } = await supabase
        .from("bookings")
        .select("id, customer_id, total_price, payment_status, created_at");

    // Group live bookings by customer_id
    const bookingsByCustomer = new Map<string, { count: number; totalSpend: number }>();
    for (const b of bookings || []) {
        if (!b.customer_id) continue;
        const current = bookingsByCustomer.get(b.customer_id) || { count: 0, totalSpend: 0 };
        current.count += 1;
        current.totalSpend += Number(b.total_price) || 0;
        bookingsByCustomer.set(b.customer_id, current);
    }

    const customersMap = new Map<string, CustomerSummary>();

    // Add registered profiles
    for (const p of profiles || []) {
        const stats = bookingsByCustomer.get(p.id) || { count: 0, totalSpend: 0 };
        // If an admin has never booked, don't display them in customer list
        if (p.role === "admin" && stats.count === 0) {
            continue;
        }

        const fullName = getCustomerDisplayName(p.full_name, p.id, p.email);

        customersMap.set(p.id, {
            id: p.id,
            fullName,
            email: p.email,
            bookingCount: stats.count,
            totalSpend: stats.totalSpend,
        });
    }

    // Include any active customer from live bookings who doesn't have a profile row yet
    for (const [customerId, stats] of bookingsByCustomer.entries()) {
        if (!customersMap.has(customerId)) {
            customersMap.set(customerId, {
                id: customerId,
                fullName: `Customer (${customerId.slice(0, 8)})`,
                email: null,
                bookingCount: stats.count,
                totalSpend: stats.totalSpend,
            });
        }
    }

    // Return sorted by booking count then total spend descending
    return Array.from(customersMap.values()).sort(
        (a, b) => b.bookingCount - a.bookingCount || (b.totalSpend ?? 0) - (a.totalSpend ?? 0)
    );
}

export async function getCustomerProfile(id: string): Promise<Profile | null> {
    const supabase = await getDbClient();

    const { data } = await supabase
        .from("profiles")
        .select("id, full_name, email, phone, role, created_at")
        .eq("id", id)
        .maybeSingle();

    if (data) {
        return {
            id: data.id,
            fullName: getCustomerDisplayName(data.full_name, data.id, data.email),
            email: data.email,
            phone: data.phone,
            role: data.role,
            createdAt: data.created_at,
        };
    }

    // If profile row has not yet synced to profiles table, verify against live bookings
    const { data: customerBookings } = await supabase
        .from("bookings")
        .select("created_at")
        .eq("customer_id", id)
        .order("created_at", { ascending: true })
        .limit(1);

    if (customerBookings && customerBookings.length > 0) {
        return {
            id,
            fullName: `Customer (${id.slice(0, 8)})`,
            email: null,
            phone: null,
            role: "customer",
            createdAt: customerBookings[0].created_at,
        };
    }

    return null;
}