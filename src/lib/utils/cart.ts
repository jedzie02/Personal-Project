import type { BookingSegment } from "./court-jump";

export interface SelectedGridSlot {
    courtId: string;
    courtName: string;
    hour: string;       // "09:00"
    endHour: string;    // "10:00"
    hourlyRate: number; // e.g. 300
}

/**
 * Toggles a slot in the cart. If the slot (matching courtId and hour) is already
 * in the cart, it is removed. Otherwise, it is added up to maxSlots (default 8).
 */
export function toggleCartSlot(
    currentSlots: SelectedGridSlot[],
    slot: SelectedGridSlot,
    maxSlots: number = 8
): SelectedGridSlot[] {
    const exists = currentSlots.some(
        (s) => s.courtId === slot.courtId && s.hour === slot.hour
    );

    if (exists) {
        return currentSlots.filter(
            (s) => !(s.courtId === slot.courtId && s.hour === slot.hour)
        );
    }

    if (currentSlots.length >= maxSlots) {
        return currentSlots;
    }

    return [...currentSlots, slot];
}

/**
 * Calculates the total cost of all slots in the cart.
 */
export function calculateCartTotal(slots: SelectedGridSlot[]): number {
    return slots.reduce((total, s) => total + (s.hourlyRate || 300), 0);
}

/**
 * Sorts cart slots chronologically by hour ascending, then court name.
 */
export function sortCartSlots(slots: SelectedGridSlot[]): SelectedGridSlot[] {
    return [...slots].sort((a, b) => {
        const timeDiff = a.hour.localeCompare(b.hour);
        if (timeDiff !== 0) return timeDiff;
        return a.courtName.localeCompare(b.courtName, undefined, { numeric: true });
    });
}

/**
 * Converts selected cart slots into standard BookingSegments for the confirmation & booking action.
 */
export function convertCartToSegments(slots: SelectedGridSlot[]): BookingSegment[] {
    const sorted = sortCartSlots(slots);
    return sorted.map((slot, index) => {
        const prev = sorted[index - 1];
        // Jump = moving to a different court at a sequential (not parallel) hour
        const isJump = prev ? prev.courtId !== slot.courtId && prev.endHour === slot.hour : false;
        return {
            hour: slot.hour,
            endHour: slot.endHour,
            courtId: slot.courtId,
            courtName: slot.courtName,
            hourlyRate: slot.hourlyRate || 300,
            isJump,
        };
    });
}

