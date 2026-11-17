import { describe, it, expect } from "vitest";
import { getDayOfWeekFromDateString } from "./schedule.service";

describe("schedule.service date conversion", () => {
    it("correctly identifies Sunday for 2026-11-08 without timezone drift", () => {
        expect(getDayOfWeekFromDateString("2026-11-08")).toBe(0); // Sunday
    });

    it("correctly identifies Monday for 2026-11-09", () => {
        expect(getDayOfWeekFromDateString("2026-11-09")).toBe(1); // Monday
    });

    it("correctly identifies Saturday for 2026-11-14", () => {
        expect(getDayOfWeekFromDateString("2026-11-14")).toBe(6); // Saturday
    });

    it("correctly handles end of month and leap years", () => {
        expect(getDayOfWeekFromDateString("2024-02-29")).toBe(4); // Thursday in leap year
        expect(getDayOfWeekFromDateString("2026-12-31")).toBe(4); // Thursday
        expect(getDayOfWeekFromDateString("2027-01-01")).toBe(5); // Friday
    });
});

