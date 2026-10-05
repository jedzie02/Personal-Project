/**
 * These three values were left as open questions in the SRS. I've
 * set reasonable defaults so the booking flow actually works
 * end-to-end — all three are safe to change any time, and nothing
 * else in the codebase hardcodes these numbers separately.
 */

/** Fixed slot length. SRS open question #1. */
export const SLOT_DURATION_MINUTES = 60;

/** Flat rate applied to every court, every hour. SRS open question (MVP pricing). */
export const PRICE_PER_HOUR = 25;

/** How many hours before start time a customer can still self-cancel. BR-7 / SRS open question #2. */
export const CANCELLATION_CUTOFF_HOURS = 2;

/**
 * BR-7 as a pure function: given a booking's date/time, is it still
 * far enough in the future to cancel? No database, no side effects —
 * the same inputs always give the same answer, which is exactly what
 * makes this easy to unit test (see booking-rules.test.ts).
 *
 * `now` defaults to the real current time in normal use, but tests
 * pass a fixed Date instead — otherwise a test asserting "this should
 * be cancellable" could start failing months from now for no reason
 * other than time having passed.
 */
export function canCancelBooking(
    bookingDate: string,
    startTime: string,
    now: Date = new Date()
): boolean {
    const startsAt = new Date(`${bookingDate}T${startTime}`);
    const cutoffMs = CANCELLATION_CUTOFF_HOURS * 60 * 60 * 1000;
    return startsAt.getTime() - now.getTime() >= cutoffMs;
}