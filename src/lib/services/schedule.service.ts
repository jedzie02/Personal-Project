import { createClient } from "@/lib/supabase/server";
import type { OperatingHours, ServiceResult } from "@/lib/types/domain";

/**
 * schedule.service.ts
 *
 * Manages the 7-row operating_hours table. Unlike courts, there's
 * no "create" here — the 7 rows already exist (seeded by the
 * migration), so this service only reads and updates.
 */

function mapOperatingHours(row: {
    day_of_week: number;
    open_time: string | null;
    close_time: string | null;
    is_closed: boolean;
}): OperatingHours {
    const rawClose = row.close_time?.slice(0, 5);
    // Standard facility close is 23:00 (11:00 PM). If database has the legacy 21:00 (9:00 PM) seed,
    // upgrade it to 23:00 so 9:00 PM - 10:00 PM and 10:00 PM - 11:00 PM are always available.
    const closeTime = !rawClose || rawClose === "21:00" || rawClose < "23:00"
        ? "23:00"
        : rawClose;

    return {
        dayOfWeek: row.day_of_week,
        openTime: row.open_time?.slice(0, 5) || "09:00",
        closeTime,
        isClosed: row.is_closed,
    };
}

/** Returns all 7 days, ordered Sunday (0) through Saturday (6). */
export async function getOperatingHours(): Promise<OperatingHours[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("operating_hours")
        .select("day_of_week, open_time, close_time, is_closed")
        .order("day_of_week", { ascending: true });

    if (error || !data) return [];

    return data.map(mapOperatingHours);
}

/**
 * Returns hours for a single day of the week. This is the function
 * Phase 7's availability calculation will lean on most — "what are
 * today's operating hours?" is the first question that logic asks.
 */
export async function getOperatingHoursForDay(
    dayOfWeek: number
): Promise<OperatingHours | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("operating_hours")
        .select("day_of_week, open_time, close_time, is_closed")
        .eq("day_of_week", dayOfWeek)
        .single();

    if (error || !data) return null;

    return mapOperatingHours(data);
}

export async function updateOperatingHoursForDay(
    dayOfWeek: number,
    openTime: string | null,
    closeTime: string | null,
    isClosed: boolean
): Promise<ServiceResult> {
    const supabase = await createClient();

    const { error } = await supabase
        .from("operating_hours")
        .update({
            // When a day is marked closed, we clear the times rather than
            // leaving stale values sitting in the row — avoids a future bug
            // where someone reads open_time without checking is_closed first.
            open_time: isClosed ? null : openTime,
            close_time: isClosed ? null : closeTime,
            is_closed: isClosed,
        })
        .eq("day_of_week", dayOfWeek);

    if (error) {
        return { success: false, error: error.message };
    }

    return { success: true };
}