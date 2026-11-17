import { describe, it, expect } from "vitest";
import {
    toggleCartSlot,
    calculateCartTotal,
    sortCartSlots,
    convertCartToSegments,
    type SelectedGridSlot,
} from "./cart";

describe("Cart Utilities", () => {
    const slotA: SelectedGridSlot = {
        courtId: "court-1",
        courtName: "Court 1",
        hour: "09:00",
        endHour: "10:00",
        hourlyRate: 300,
    };

    const slotB: SelectedGridSlot = {
        courtId: "court-2",
        courtName: "Court 2",
        hour: "09:00",
        endHour: "10:00",
        hourlyRate: 300,
    };

    const slotC: SelectedGridSlot = {
        courtId: "court-1",
        courtName: "Court 1",
        hour: "10:00",
        endHour: "11:00",
        hourlyRate: 300,
    };

    it("toggles an unselected slot into the cart", () => {
        const result = toggleCartSlot([], slotA);
        expect(result).toHaveLength(1);
        expect(result[0].courtId).toBe("court-1");
    });

    it("removes an already selected slot when clicked again", () => {
        const initial = [slotA, slotB];
        const result = toggleCartSlot(initial, slotA);
        expect(result).toHaveLength(1);
        expect(result[0].courtId).toBe("court-2");
    });

    it("enforces the max slots cap (e.g. 8 slots)", () => {
        let current: SelectedGridSlot[] = [];
        for (let i = 0; i < 8; i++) {
            current = toggleCartSlot(current, {
                courtId: `court-${i}`,
                courtName: `Court ${i}`,
                hour: "09:00",
                endHour: "10:00",
                hourlyRate: 300,
            });
        }
        expect(current).toHaveLength(8);

        // Attempting to add a 9th slot does not exceed 8
        const attempt9 = toggleCartSlot(current, {
            courtId: "court-9",
            courtName: "Court 9",
            hour: "10:00",
            endHour: "11:00",
            hourlyRate: 300,
        });
        expect(attempt9).toHaveLength(8);
    });

    it("calculates total cost correctly for parallel same-hour courts", () => {
        // Parallel courts: Court 1 and Court 2 at 9:00 AM
        const slots = [slotA, slotB];
        const total = calculateCartTotal(slots);
        expect(total).toBe(600);
    });

    it("sorts slots by hour ascending, then court name", () => {
        const slots = [slotC, slotB, slotA]; // 10:00 Court 1, 09:00 Court 2, 09:00 Court 1
        const sorted = sortCartSlots(slots);
        expect(sorted[0].courtId).toBe("court-1");
        expect(sorted[0].hour).toBe("09:00");
        expect(sorted[1].courtId).toBe("court-2");
        expect(sorted[1].hour).toBe("09:00");
        expect(sorted[2].courtId).toBe("court-1");
        expect(sorted[2].hour).toBe("10:00");
    });

    it("converts cart slots to BookingSegments for backend checkout", () => {
        const slots = [slotA, slotB];
        const segments = convertCartToSegments(slots);
        expect(segments).toHaveLength(2);
        expect(segments[0]).toMatchObject({
            hour: "09:00",
            endHour: "10:00",
            courtId: "court-1",
            hourlyRate: 300,
        });
        expect(segments[1]).toMatchObject({
            hour: "09:00",
            endHour: "10:00",
            courtId: "court-2",
            hourlyRate: 300,
        });
    });
});

