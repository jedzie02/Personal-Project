import { createClient } from "@/lib/supabase/server";
import type { Court, CourtStatus, ServiceResult } from "@/lib/types/domain";

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
    status: string | null;
    hourly_rate?: number | null;
    created_at: string;
}): Court {
    return {
        id: row.id,
        name: row.name,
        description: row.description,
        isActive: row.is_active,
        status: (row.status as CourtStatus) || (row.is_active ? "Available" : "Not Available"),
        hourlyRate: row.hourly_rate != null ? Number(row.hourly_rate) : 25,
        createdAt: row.created_at,
    };
}

/**
 * Returns only ACTIVE courts, sorted naturally by name (Court 1, Court 2, Court 3, Court 4).
 */
export async function getActiveCourts(): Promise<Court[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("courts")
        .select("id, name, description, is_active, status, hourly_rate, created_at")
        .eq("status", "Available")
        .order("name", { ascending: true });

    if (error || !data) return [];

    return data
        .map(mapCourt)
        .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
}

/**
 * Returns ALL courts, active and inactive, sorted naturally by name (Court 1, Court 2, Court 3, Court 4).
 */
export async function getAllCourts(): Promise<Court[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("courts")
        .select("id, name, description, is_active, status, hourly_rate, created_at")
        .order("name", { ascending: true });

    if (error || !data) return [];

    return data
        .map(mapCourt)
        .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
}

export async function getCourtById(id: string): Promise<Court | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("courts")
        .select("id, name, description, is_active, status, hourly_rate, created_at")
        .eq("id", id)
        .single();

    if (error || !data) return null;

    return mapCourt(data);
}

export async function createCourt(
    name: string,
    description: string | null,
    status: CourtStatus = "Available"
): Promise<ServiceResult> {
    const supabase = await createClient();

    const { error } = await supabase.from("courts").insert({
        name,
        description,
        status,
        is_active: status === "Available",
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
 * Sets a court's status to one of the three allowed values.
 * Also keeps is_active in sync: only "Available" = active.
 */
export async function setCourtStatus(
    id: string,
    status: CourtStatus
): Promise<ServiceResult> {
    const supabase = await createClient();

    const { error } = await supabase
        .from("courts")
        .update({ status, is_active: status === "Available" })
        .eq("id", id);

    if (error) {
        return { success: false, error: error.message };
    }

    return { success: true };
}

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
