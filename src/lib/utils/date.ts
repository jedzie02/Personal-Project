/**
 * Small date/time helpers shared across the app. Keeping this in one
 * place means the "0 = Sunday" convention only has to be written
 * down once, instead of every component re-deriving it (and
 * potentially getting the order wrong).
 */

export const DAY_LABELS = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
] as const;

/** Turns "14:30:00" or "14:30" (Postgres time) into "2:30 PM" for display. */
export function formatTime(time: string | null): string {
    if (!time) return "—";

    const [hoursStr, minutesStr] = time.split(":");
    const hours = parseInt(hoursStr, 10);
    const minutes = minutesStr;

    const period = hours >= 12 ? "PM" : "AM";
    const displayHour = hours % 12 === 0 ? 12 : hours % 12;

    return `${displayHour}:${minutes} ${period}`;
}

/** "14:30" (or "14:30:00") -> 870 (minutes since midnight). Makes time arithmetic simple. */
function timeToMinutes(time: string): number {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
}

/** 870 -> "14:30". The reverse of timeToMinutes, for turning math back into a storable time string. */
function minutesToTime(totalMinutes: number): string {
    const h = Math.floor(totalMinutes / 60)
        .toString()
        .padStart(2, "0");
    const m = (totalMinutes % 60).toString().padStart(2, "0");
    return `${h}:${m}`;
}

/**
 * Pure overlap test: do two time ranges intersect at all? This is
 * the same rule expressed as a SQL comparison inside checkOverlap()
 * in booking.service.ts (lt()/gt() against the database) — here it's
 * the plain-JS version, used by the in-memory availability
 * calculation. Naming it explicitly, in one place, means the rule
 * only has to be understood (and tested) once, even though it's
 * applied in two different forms.
 */
export function doTimeRangesOverlap(
    aStart: string,
    aEnd: string,
    bStart: string,
    bEnd: string
): boolean {
    return aStart < bEnd && aEnd > bStart;
}

/**
 * Splits an open/close window into fixed-length slots.
 * e.g. generateTimeSlots("09:00", "12:00", 60) ->
 *   [{start:"09:00", end:"10:00"}, {start:"10:00", end:"11:00"}, {start:"11:00", end:"12:00"}]
 *
 * A trailing partial slot (e.g. 30 minutes left when slots are 60)
 * is dropped rather than offered as a short booking.
 */
export function generateTimeSlots(
    openTime: string,
    closeTime: string,
    durationMinutes: number
): { start: string; end: string }[] {
    const slots: { start: string; end: string }[] = [];
    const openMinutes = timeToMinutes(openTime);
    const closeMinutes = timeToMinutes(closeTime);

    for (
        let start = openMinutes;
        start + durationMinutes <= closeMinutes;
        start += durationMinutes
    ) {
        slots.push({
            start: minutesToTime(start),
            end: minutesToTime(start + durationMinutes),
        });
    }

    return slots;
}