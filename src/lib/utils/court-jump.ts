import { timeToMinutes } from "./date";

export interface MasterCourt {
    id: string;
    name: string;
    hourly_rate?: number | null;
    status?: string;
}

export interface BookingSegment {
    hour: string;        // "09:00"
    endHour: string;     // "10:00"
    courtId: string;
    courtName: string;
    hourlyRate: number;
    isJump: boolean;     // true if switched from the previous segment's court
}

export interface ContinuousSlotsResult {
    available: boolean;
    segments: BookingSegment[];
    totalPrice: number;
    hasCourtJump: boolean;
    disabledReason?: string;
}

/**
 * Resolves continuous booking slots for 1 to 4 hours.
 * Prioritizes keeping the player on the initial court if available.
 * If the initial court is booked on later hours, automatically assigns the next available court.
 * Ensures the reservation does not exceed venue close time (default 23:00 / 11 PM).
 */
export function resolveContinuousSlots(
    initialCourtId: string,
    initialCourtName: string,
    startHour: string,
    durationHours: number,
    hours: string[],
    grid: { courtId: string; hour: string; status: string }[][],
    masterCourts: MasterCourt[],
    closeTime: string = "23:00"
): ContinuousSlotsResult {
    if (durationHours < 1 || durationHours > 4) {
        return {
            available: false,
            segments: [],
            totalPrice: 0,
            hasCourtJump: false,
            disabledReason: "Duration must be between 1 and 4 hours",
        };
    }

    const startMins = timeToMinutes(startHour);
    const closeMins = timeToMinutes(closeTime);
    const endMins = startMins + durationHours * 60;

    // Check if reservation extends past venue closing time
    if (endMins > closeMins) {
        return {
            available: false,
            segments: [],
            totalPrice: 0,
            hasCourtJump: false,
            disabledReason: `Exceeds closing time (${closeTime})`,
        };
    }

    const segments: BookingSegment[] = [];
    let hasCourtJump = false;
    let prevCourtId = initialCourtId;

    const courtMap = new Map<string, MasterCourt>();
    masterCourts.forEach((c) => courtMap.set(c.id, c));

    for (let i = 0; i < durationHours; i++) {
        const slotMins = startMins + i * 60;
        const slotH = Math.floor(slotMins / 60);
        const slotHourStr = `${slotH.toString().padStart(2, "0")}:00`;
        const nextH = slotH + 1;
        const nextHourStr = `${nextH.toString().padStart(2, "0")}:00`;

        // Locate corresponding row in grid
        const hourIdx = hours.indexOf(slotHourStr);
        const row = hourIdx >= 0 ? grid[hourIdx] : [];

        // 1. Check if initial court is available for this hour
        const initialCell = row?.find((c) => c.courtId === initialCourtId);
        const initialAvailable = initialCell && initialCell.status === "available";

        let chosenCourtId: string | null = null;

        if (initialAvailable) {
            chosenCourtId = initialCourtId;
        } else {
            // 2. Auto-jump: find the first available active court in master list
            for (const mc of masterCourts) {
                if (mc.status === "Maintenance" || mc.status === "Not Available") continue;
                const cell = row?.find((c) => c.courtId === mc.id);
                if (cell && cell.status === "available") {
                    chosenCourtId = mc.id;
                    break;
                }
            }
        }

        if (!chosenCourtId) {
            return {
                available: false,
                segments: [],
                totalPrice: 0,
                hasCourtJump: false,
                disabledReason: `No court available at ${slotHourStr}`,
            };
        }

        const isJump = i > 0 && chosenCourtId !== prevCourtId;
        if (isJump) {
            hasCourtJump = true;
        }

        const chosenCourt = courtMap.get(chosenCourtId);
        const courtName = chosenCourt?.name || (chosenCourtId === initialCourtId ? initialCourtName : "Court");
        const hourlyRate = chosenCourt?.hourly_rate != null ? Number(chosenCourt.hourly_rate) : 300;

        segments.push({
            hour: slotHourStr,
            endHour: nextHourStr,
            courtId: chosenCourtId,
            courtName,
            hourlyRate,
            isJump,
        });

        prevCourtId = chosenCourtId;
    }

    const totalPrice = segments.reduce((sum, s) => sum + s.hourlyRate, 0);

    return {
        available: true,
        segments,
        totalPrice,
        hasCourtJump,
    };
}

