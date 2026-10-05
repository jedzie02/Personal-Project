import { createClient } from "@/lib/supabase/server";
import type { Court, ServiceResult } from "@/lib/types/domain";

/**
 * court.service.ts
 *
 * All court-related reads/writes live here. Pages and Server Actions
 * call these functions instead of talking to Supabase directly, so
 * this logic is reusable (e.g. the same getActiveCourts() function
 * will be used by both the admin dashboard stats AND the customer
 * booking flow in later phases).
 */

/** Maps a raw Supabase row (snake_case) to our app's Court type (camelCase). */
function mapCourt(row: {
    id: string;
    name: string;
    description: string | null;
    is_active: boolean;
    created_at: string;
}): Court {
    return {
        id: row.id,
        name: row.name,
        description: row.description,
        isActive: row.is_active,
        createdAt: row.created_at,
    };
}

/**
 * Returns only ACTIVE courts. This is what customers will see —
 * a deactivated court should never appear in a customer-facing list.
 */
export async function getActiveCourts(): Promise<Court[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("courts")
        .select("id, name, description, is_active, created_at")
        .eq("is_active", true)
        .order("created_at", { ascending: true });

    if (error || !data) return [];

    return data.map(mapCourt);
}

/**
 * Returns ALL courts, active and inactive. Admin-only — the RLS
 * policy on the courts table already enforces this at the database
 * level, so even if this function were called by a non-admin, the
 * query would just come back empty rather than leaking data.
 */
export async function getAllCourts(): Promise<Court[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("courts")
        .select("id, name, description, is_active, created_at")
        .order("created_at", { ascending: true });

    if (error || !data) return [];

    return data.map(mapCourt);
}

export async function getCourtById(id: string): Promise<Court | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("courts")
        .select("id, name, description, is_active, created_at")
        .eq("id", id)
        .single();

    if (error || !data) return null;

    return mapCourt(data);
}

export async function createCourt(
    name: string,
    description: string | null
): Promise<ServiceResult> {
    const supabase = await createClient();

    const { error } = await supabase.from("courts").insert({
        name,
        description,
    });

    if (error) {
        return { success: false, error: error.message };
    }

    return { success: true };
}

export async function updateCourt(
    id: string,
    name: string,
    description: string | null
): Promise<ServiceResult> {
    const supabase = await createClient();

    const { error } = await supabase
        .from("courts")
        .update({ name, description })
        .eq("id", id);

    if (error) {
        return { success: false, error: error.message };
    }

    return { success: true };
}

/**
 * Counts a court's PENDING/CONFIRMED bookings that are still in the
 * future. Used to warn an admin before deactivating a court out from
 * under real, upcoming reservations (FR-6.5) — this is the check
 * that was flagged as missing back in Phase 3, now that bookings
 * actually exist.
 */
export async function getFutureActiveBookingsCountForCourt(
    courtId: string
): Promise<number> {
    const supabase = await createClient();
    const today = new Date().toISOString().split("T")[0];

    const { count } = await supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("court_id", courtId)
        .gte("booking_date", today)
        .in("status", ["pending", "confirmed"]);

    return count ?? 0;
}

/**
 * Flips is_active. This is how "deactivate" and "reactivate" both
 * work — one function, one boolean, rather than two near-duplicate
 * functions.
 *
 * NOTE: this function itself stays "dumb" on purpose — it just does
 * the update, no matter what. The FR-6.5 warning-before-deactivating
 * logic lives in the Server Action (admin/courts/actions.ts) instead,
 * since deciding "should we warn, and has the admin confirmed" is a
 * flow-control concern, not a data-write concern.
 */
export async function setCourtActiveStatus(
    id: string,
    isActive: boolean
): Promise<ServiceResult> {
    const supabase = await createClient();

    const { error } = await supabase
        .from("courts")
        .update({ is_active: isActive })
        .eq("id", id);

    if (error) {
        return { success: false, error: error.message };
    }

    return { success: true };
}