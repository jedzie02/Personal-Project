import { getActiveCourts } from "@/lib/services/court.service";
import { createClient } from "@/lib/supabase/server";

/**
 * A single cell in the booking grid — represents what's happening
 * on one court at one particular hour slot.
 */
export interface GridCell {
    courtId: string;
    courtName: string;
    hour: string; // "HH:MM"
    /**
     * - "available": slot is open for booking
     * - "booked": there's a pending/confirmed booking here
     * - "fulfilled": the booking is completed
     * - "passed": the hour is in the past (can't book anymore)
     * - "closed": outside operating hours
     * - "maintenance": court is in maintenance
     * - "not_available": court is not available
     */
    status: "available" | "booked" | "fulfilled" | "passed" | "closed" | "maintenance" | "not_available";
    /** If this cell is the START of a multi-hour booking block, how many rows it spans */
    rowSpan?: number;
    /** If this cell is in the middle of a booking block, skip rendering it */
    hidden?: boolean;
    /** Booking details when status is booked/fulfilled */
    booking?: {
        id: string;
        startTime: string;
        endTime: string;
        durationHours: number;
        customerName: string | null;
    };
    /** Whether this hour falls within peak hours (for the accent bar) */
    isPeak: boolean;
}

export interface BookingGridData {
    date: string;
    courts: { id: string; name: string; status: string; hourly_rate?: number }[];
    hours: string[]; // All hours in the operating window, e.g. ["05:00", "06:00", ...]
    grid: GridCell[][]; // grid[hourIndex][courtIndex]
    operatingOpen: string;
    operatingClose: string;
}


/**
 * Peak hours: 6 PM – 12 AM (18:00 – 00:00) are peak on weekdays.
 * Weekends: all day is peak.
 * This is a simplified heuristic matching the reference image's color bar.
 */
function isPeakHour(hour: string): boolean {
    const h = parseInt(hour.split(":")[0], 10);
    // Standard peak: 6 PM onwards across all 7 days (no weekend overrides)
    return h >= 18;
}

function hoursBetween(start: string, end: string): number {
    const [sh, sm] = start.split(":").map(Number);
    let [eh, em] = end.split(":").map(Number);
    // Midnight close time arrives as "00:00" — treat it as hour 24 so
    // the arithmetic stays positive (e.g. 09:00 → 00:00 = 15 h).
    if (eh === 0 && em === 0) eh = 24;
    return (eh * 60 + em - (sh * 60 + sm)) / 60;
}

/**
 * Generates all hour labels between open and close times.
 * e.g. ("09:00", "00:00") -> ["09:00", "10:00", ..., "23:00"]  (15 slots ending at midnight)
 * The final rendered slot is always "[last hour]:00 – [last hour + 1]:00",
 * so the last entry "23:00" represents the START of the 11:00 PM – 12:00 AM block.
 */
function generateHourSlots(open: string = "09:00", close: string = "00:00"): string[] {
    const hours: string[] = [];
    const startH = parseInt(open.split(":")[0], 10);
    // Midnight close time arrives as "00:00" — treat it as 24
    const rawEndH = parseInt(close.split(":")[0], 10);
    const endH = rawEndH === 0 ? 24 : rawEndH;
    for (let h = startH; h < endH; h++) {
        hours.push(`${h.toString().padStart(2, "0")}:00`);
    }
    return hours;
}

/**
 * Builds the full grid data for the booking calendar view.
 * Standardizes Monday through Sunday with the exact same 9 AM to 12 AM schedule.
 */
export async function getBookingGridForDate(
    date: string
): Promise<BookingGridData | null> {
    const supabase = await createClient();

    // Fetch live courts from Supabase
    const { data: dbCourts } = await supabase
        .from("courts")
        .select("id, name, is_active, status, hourly_rate")
        .order("name", { ascending: true });

    let courts: { id: string; name: string; status: string; hourly_rate?: number }[] = [];
    if (dbCourts && dbCourts.length > 0) {
        courts = dbCourts.map((c: any) => {
            const rawStatus = c.status || (c.is_active === false ? "Not Available" : "Available");
            const status = rawStatus === "Maintenance"
                ? "Maintenance"
                : rawStatus === "Not Available" || rawStatus === "Deactivated" || c.is_active === false
                ? "Not Available"
                : "Available";
            return {
                id: c.id,
                name: c.name,
                status,
                hourly_rate: c.hourly_rate != null ? Number(c.hourly_rate) : 25,
            };
        });
    } else {
        courts = [
            { id: "court-1", name: "Court 1", status: "Available", hourly_rate: 25 },
            { id: "court-2", name: "Court 2", status: "Available", hourly_rate: 25 },
            { id: "court-3", name: "Court 3", status: "Available", hourly_rate: 25 },
            { id: "court-4", name: "Court 4", status: "Available", hourly_rate: 25 },
        ];
    }

    // Sort courts alphabetically
    courts.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

    // Fetch all active bookings for the date
    const { data: bookingRows } = await supabase
        .from("bookings")
        .select(
            "id, court_id, start_time, end_time, status, customer_id, profiles ( full_name )"
        )
        .eq("booking_date", date)
        .in("status", ["pending", "confirmed", "completed"]);


    const bookings = (bookingRows ?? []) as unknown as Array<{
        id: string;
        court_id: string;
        start_time: string;
        end_time: string;
        status: string;
        customer_id: string;
        profiles: { full_name: string | null } | null;
    }>;

    // Enforce 9 AM to 12 AM schedule (Monday - Sunday)
    const openTime = "09:00";
    const closeTime = "00:00";
    const hours = generateHourSlots(openTime, closeTime);

    // Figure out which hours are "passed" (in the past)
    const now = new Date();
    const todayISO = now.toISOString().split("T")[0];
    const currentHour = now.getHours();
    const isToday = date === todayISO;

    // Build the grid: grid[hourIndex][courtIndex]
    const grid: GridCell[][] = hours.map((hour, _hourIdx) => {
        const hourNum = parseInt(hour.split(":")[0], 10);
        const nextHour = `${(hourNum + 1).toString().padStart(2, "0")}:00`;

        return courts.map((court) => {
            // Find if there's a booking that covers this hour on this court
            // Normalizing to HH:MM prevents string length mismatch ('11:00:00' > '11:00') that causes off-by-one-hour shifts
            const booking = bookings.find((b) => {
                if (b.court_id !== court.id) return false;
                const bStart = b.start_time.slice(0, 5);
                const bEnd = b.end_time.slice(0, 5);
                return bStart <= hour && (bEnd > hour || bEnd === "00:00");
            });

            const isPeak = isPeakHour(hour);

            // 1. If court is not Available (Maintenance / Not Available), that status takes precedence
            if (court.status !== "Available") {
                const cellStatus: "maintenance" | "not_available" =
                    court.status === "Maintenance" ? "maintenance" : "not_available";
                return {
                    courtId: court.id,
                    courtName: court.name,
                    hour,
                    status: cellStatus,
                    isPeak,
                };
            }

            // 2. Check if this hour is in the past
            if (isToday && hourNum < currentHour) {
                if (booking) {
                    if (booking.status === "completed") {
                        return {
                            courtId: court.id,
                            courtName: court.name,
                            hour,
                            status: "fulfilled" as const,
                            isPeak,
                            rowSpan: 1,
                            booking: {
                                id: booking.id,
                                startTime: booking.start_time,
                                endTime: booking.end_time,
                                durationHours: hoursBetween(booking.start_time, booking.end_time),
                                customerName: booking.profiles?.full_name ?? null,
                            },
                        };
                    }

                    // Past but was booked (pending/confirmed) = "Passed"
                    return {
                        courtId: court.id,
                        courtName: court.name,
                        hour,
                        status: "passed" as const,
                        isPeak,
                        rowSpan: 1,
                    };
                }

                return {
                    courtId: court.id,
                    courtName: court.name,
                    hour,
                    status: "passed" as const,
                    isPeak,
                };
            }

            // 3. Current / Future Bookings
            if (booking) {
                const duration = hoursBetween(booking.start_time, booking.end_time);

                if (booking.status === "completed") {
                    return {
                        courtId: court.id,
                        courtName: court.name,
                        hour,
                        status: "fulfilled" as const,
                        isPeak,
                        rowSpan: 1,
                        booking: {
                            id: booking.id,
                            startTime: booking.start_time,
                            endTime: booking.end_time,
                            durationHours: duration,
                            customerName: booking.profiles?.full_name ?? null,
                        },
                    };
                }

                return {
                    courtId: court.id,
                    courtName: court.name,
                    hour,
                    status: "booked" as const,
                    isPeak,
                    rowSpan: 1,
                    booking: {
                        id: booking.id,
                        startTime: booking.start_time,
                        endTime: booking.end_time,
                        durationHours: duration,
                        customerName: booking.profiles?.full_name ?? null,
                    },
                };
            }

            // 4. No booking and court is available
            return {
                courtId: court.id,
                courtName: court.name,
                hour,
                status: "available" as const,
                isPeak,
            };
        });
    });

    return {
        date,
        courts: courts.map((c) => ({ id: c.id, name: c.name, status: c.status, hourly_rate: c.hourly_rate })),
        hours,
        grid,
        operatingOpen: "09:00",
        operatingClose: "00:00",
    };
}
