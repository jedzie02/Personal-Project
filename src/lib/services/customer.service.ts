import { createClient } from "@/lib/supabase/server";
import type { CustomerSummary, Profile } from "@/lib/types/domain";

/**
 * customer.service.ts
 *
 * Admin-facing views into the profiles table. getBookingsForCustomer
 * (a customer's actual booking rows) already exists in
 * booking.service.ts from Phase 6 — the admin customer detail page
 * reuses that directly rather than duplicating it here.
 */

export async function getAllCustomersWithBookingCounts(): Promise<CustomerSummary[]> {
    const supabase = await createClient();

    const { data: customers, error } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .eq("role", "customer")
        .order("created_at", { ascending: false });

    if (error || !customers) return [];

    // One count query per customer, all fired concurrently rather than
    // awaited one at a time — same Promise.all pattern used for the
    // weekly schedule save back in Phase 4.
    return Promise.all(
        customers.map(async (customer) => {
            const { count } = await supabase
                .from("bookings")
                .select("id", { count: "exact", head: true })
                .eq("customer_id", customer.id);

            return {
                id: customer.id,
                fullName: customer.full_name,
                email: customer.email,
                bookingCount: count ?? 0,
            };
        })
    );
}

export async function getCustomerProfile(id: string): Promise<Profile | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, phone, role, created_at")
        .eq("id", id)
        .eq("role", "customer")
        .single();

    if (error || !data) return null;

    return {
        id: data.id,
        fullName: data.full_name,
        email: data.email,
        phone: data.phone,
        role: data.role,
        createdAt: data.created_at,
    };
}