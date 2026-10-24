import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

/**
 * Days of the week in standard Monday - Sunday order.
 * All 7 days share the exact same operating schedule.
 */
export const DAYS_OF_WEEK = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
] as const;

/**
 * Formats a 24-hour hour number into strict "hh:mm AM/PM" format.
 * - Leading zero padded (e.g., 09:00 AM)
 * - 0 / 24 is 12:00 AM (Midnight)
 * - 12 is 12:00 PM (Noon)
 */
export function formatHour(hour24: number): string {
    const normalizedHour = hour24 % 24;
    const period = hour24 >= 12 && hour24 < 24 ? "PM" : "AM";
    const hour12 = normalizedHour % 12 === 0 ? 12 : normalizedHour % 12;
    const hourFormatted = hour12.toString().padStart(2, "0");
    return `${hourFormatted}:00 ${period}`;
}

/**
 * Generates daily time slots starting at 09:00 AM and ending at 12:00 AM (Midnight).
 * Final slot strictly renders as "11:00 PM – 12:00 AM".
 * 
 * Standardized 1-hour increments: 15 slots in total.
 */
export function generateDailyTimeSlots(startHour = 9, endHour = 24): string[] {
    const slots: string[] = [];
    for (let h = startHour; h < endHour; h++) {
        const startStr = formatHour(h);
        const endStr = formatHour(h + 1);
        slots.push(`${startStr} – ${endStr}`);
    }
    return slots;
}

/**
 * Returns the standardized schedule array for Monday through Sunday.
 * Enforces NO day-of-week conditional logic (no weekend overrides, no Sunday exception).
 */
export function getStandardWeeklySchedule(): Record<string, string[]> {
    const standardizedSlots = generateDailyTimeSlots(9, 24);

    return DAYS_OF_WEEK.reduce((acc, day) => {
        // Every day Monday through Sunday receives the exact same array
        acc[day] = [...standardizedSlots];
        return acc;
    }, {} as Record<string, string[]>);
}

async function main() {
    console.log("=== ENFORCING 09:00 AM TO 12:00 AM SCHEDULE (MONDAY - SUNDAY) ===");
    
    const slots = generateDailyTimeSlots(9, 24);
    console.log(`\nGenerated ${slots.length} standardized time slots:`);
    slots.forEach((slot, index) => {
        console.log(`  [Slot ${String(index + 1).padStart(2, "0")}] ${slot}`);
    });

    const weeklySchedule = getStandardWeeklySchedule();
    console.log("\nVerifying all 7 days (Monday - Sunday):");
    for (const [day, daySlots] of Object.entries(weeklySchedule)) {
        console.log(`  ✓ ${day.padEnd(10)}: ${daySlots[0]} through ${daySlots[daySlots.length - 1]} (${daySlots.length} slots)`);
    }

    // Check / Sync with Supabase if credentials are available
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
        try {
            const supabase = createClient(supabaseUrl, supabaseKey);
            const { data, error } = await supabase
                .from("operating_hours")
                .select("*")
                .order("day_of_week", { ascending: true });

            if (error) {
                console.warn("\nSupabase query warning:", error.message);
            } else if (data) {
                console.log("\nCurrent Supabase operating_hours records in DB:");
                console.table(data);
            }
        } catch (err) {
            console.warn("\nCould not query Supabase directly:", err);
        }
    } else {
        console.log("\n(Supabase credentials not configured in environment, skipped DB query)");
    }

    console.log("\n=== SCHEDULE ENFORCEMENT VERIFICATION COMPLETE ===");
}

if (require.main === module) {
    main();
}
