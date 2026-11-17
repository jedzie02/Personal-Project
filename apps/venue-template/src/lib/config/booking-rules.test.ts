import { describe, it, expect } from "vitest";
import { canCancelBooking, CANCELLATION_CUTOFF_HOURS } from "./booking-rules";

describe("canCancelBooking", () => {
    // A fixed reference point for "now," passed explicitly into every
    // call below. Without this, these tests would compare against the
    // REAL current time — meaning a test that passes today could start
    // failing next month for no reason related to a real bug.
    const now = new Date("2026-01-01T10:00:00+08:00");

    it("allows cancelling a booking well outside the cutoff window", () => {
        // Booking is the next day — far more than CANCELLATION_CUTOFF_HOURS away.
        expect(canCancelBooking("2026-01-02", "10:00", now)).toBe(true);
    });

    it("blocks cancelling a booking that starts within the cutoff window", () => {
        // Booking starts in 1 hour; the cutoff is CANCELLATION_CUTOFF_HOURS (2).
        expect(canCancelBooking("2026-01-01", "11:00", now)).toBe(false);
    });

    it("allows cancelling exactly at the cutoff boundary", () => {
        const cutoffMoment = new Date(now.getTime() + CANCELLATION_CUTOFF_HOURS * 60 * 60 * 1000);
        const bookingDate = cutoffMoment.toISOString().split("T")[0];
        const bookingTime = cutoffMoment.toTimeString().slice(0, 5);

        expect(canCancelBooking(bookingDate, bookingTime, now)).toBe(true);
    });

    it("blocks cancelling a booking that has already started", () => {
        expect(canCancelBooking("2026-01-01", "09:00", now)).toBe(false);
    });
});