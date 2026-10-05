import { getActiveCourts } from "@/lib/services/court.service";
import { getOperatingHoursForDay } from "@/lib/services/schedule.service";
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
     */
    status: "available" | "booked" | "fulfilled" | "passed" | "closed";
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
    courts: { id: string; name: string }[];
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
function isPeakHour(hour: string, dayOfWeek: number): boolean {
    const h = parseInt(hour.split(":")[0], 10);
    // Weekend = all peak
    if (dayOfWeek === 0 || dayOfWeek === 6) return true;
    // Weekday peak: 6 PM onwards
    return h >= 18;
}

function hoursBetween(start: string, end: string): number {
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    return (eh * 60 + em - (sh * 60 + sm)) / 60;
}

/**
 * Generates all hour labels between open and close times.
 * e.g. ("05:00", "23:00") -> ["05:00", "06:00", ..., "22:00"]
 */
function generateHourSlots(open: string, close: string): string[] {
    const hours: string[] = [];
    const startH = parseInt(open.split(":")[0], 10);
    const endH = parseInt(close.split(":")[0], 10);
    for (let h = startH; h < endH; h++) {
        hours.push(`${h.toString().padStart(2, "0")}:00`);
    }
    return hours;
}

/**
 * Builds the full grid data for the booking calendar view.
 * This is the single data-fetch for the entire page — one call,
 * all the data, organized for direct rendering.
 */
export async function getBookingGridForDate(
    date: string
): Promise<BookingGridData | null> {
    const dayOfWeek = new Date(`${date}T00:00:00`).getDay();

    const operatingHours = await getOperatingHoursForDay(dayOfWeek);
    if (
        !operatingHours ||
        operatingHours.isClosed ||
        !operatingHours.openTime ||
        !operatingHours.closeTime
    ) {
        return null; // Venue is closed
    }

    const courts = await getActiveCourts();
    if (courts.length === 0) return null;

    // Sort courts alphabetically (e.g. COURT 1, COURT 2, COURT 3, COURT 4)
    courts.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

    // Fetch all active bookings for the date
    const supabase = await createClient();
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

    const hours = generateHourSlots(
        operatingHours.openTime,
        operatingHours.closeTime
    );

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
            const booking = bookings.find(
                (b) =>
                    b.court_id === court.id &&
                    b.start_time <= hour &&
                    b.end_time > hour
            );

            const isPeak = isPeakHour(hour, dayOfWeek);

            // Check if this hour is in the past
            if (isToday && hourNum < currentHour) {
                if (booking) {
                    const isStart = booking.start_time === hour;
                    const duration = hoursBetween(
                        booking.start_time,
                        booking.end_time
                    );
                    const startHourNum = parseInt(
                        booking.start_time.split(":")[0],
                        10
                    );

                    if (booking.status === "completed") {
                        return {
                            courtId: court.id,
                            courtName: court.name,
                            hour,
                            status: "fulfilled" as const,
                            isPeak,
                            ...(isStart
                                ? {
                                      rowSpan: Math.min(
                                          duration,
                                          hours.length -
                                              hours.indexOf(hour)
                                      ),
                                  }
                                : { hidden: true }),
                            booking: {
                                id: booking.id,
                                startTime: booking.start_time,
                                endTime: booking.end_time,
                                durationHours: duration,
                                customerName:
                                    booking.profiles?.full_name ?? null,
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
                        ...(isStart
                            ? { rowSpan: 1 }
                            : hourNum > startHourNum
                              ? { hidden: true }
                              : {}),
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

            if (booking) {
                const isStart = booking.start_time === hour;
                const duration = hoursBetween(
                    booking.start_time,
                    booking.end_time
                );

                if (booking.status === "completed") {
                    return {
                        courtId: court.id,
                        courtName: court.name,
                        hour,
                        status: "fulfilled" as const,
                        isPeak,
                        ...(isStart
                            ? {
                                  rowSpan: Math.min(
                                      duration,
                                      hours.length -
                                          hours.indexOf(hour)
                                  ),
                              }
                            : { hidden: true }),
                        booking: {
                            id: booking.id,
                            startTime: booking.start_time,
                            endTime: booking.end_time,
                            durationHours: duration,
                            customerName:
                                booking.profiles?.full_name ?? null,
                        },
                    };
                }

                return {
                    courtId: court.id,
                    courtName: court.name,
                    hour,
                    status: "booked" as const,
                    isPeak,
                    ...(isStart
                        ? {
                              rowSpan: Math.min(
                                  duration,
                                  hours.length - hours.indexOf(hour)
                              ),
                          }
                        : { hidden: true }),
                    booking: {
                        id: booking.id,
                        startTime: booking.start_time,
                        endTime: booking.end_time,
                        durationHours: duration,
                        customerName:
                            booking.profiles?.full_name ?? null,
                    },
                };
            }

            // No booking — available
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
        courts: courts.map((c) => ({ id: c.id, name: c.name })),
        hours,
        grid,
        operatingOpen: operatingHours.openTime,
        operatingClose: operatingHours.closeTime,
    };
}
