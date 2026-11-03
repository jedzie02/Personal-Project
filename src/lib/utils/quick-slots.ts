import type { BookingGridData } from "../services/booking-grid.service";

export interface QuickSlotCard {
    courtId: string;
    courtName: string;
    hour: string;
    endHour: string;
    timeLabel: string;
    hourlyRate: number;
    splitPerPlayer: number;
    openCourtsAtHour: number;
    badgeLabel: "Next Available" | "Prime Time" | "Only 1 Court Left!";
    badgeTone: "emerald" | "amber" | "rose";
    date: string;
}

export interface QuickSlotsSummary {
    date: string;
    totalOpenSlots: number;
    openCourtsCount: number;
    lowestHourlyRate: number;
    lowestSplitPerPlayer: number;
    slots: QuickSlotCard[];
}

function formatAMPM(timeStr: string): string {
    const [hStr, mStr = "00"] = timeStr.split(":");
    let h = parseInt(hStr, 10) % 24;
    const ampm = h >= 12 && h < 24 ? "PM" : "AM";
    h = h % 12;
    h = h ? h : 12;
    return `${h.toString().padStart(2, "0")}:${mStr} ${ampm}`;
}

function addOneHour(timeStr: string): string {
    const h = (parseInt(timeStr.split(":")[0], 10) + 1) % 24;
    return `${h.toString().padStart(2, "0")}:00`;
}

export function extractQuickSlotsSummary(
    gridData: BookingGridData | null,
    maxCards: number = 3
): QuickSlotsSummary {
    if (!gridData || !Array.isArray(gridData.hours) || !Array.isArray(gridData.grid)) {
        return {
            date: gridData?.date ?? "",
            totalOpenSlots: 0,
            openCourtsCount: 0,
            lowestHourlyRate: 300,
            lowestSplitPerPlayer: 75,
            slots: [],
        };
    }

    const availableCourtMap = new Map<string, { name: string; hourlyRate: number }>();
    for (const court of gridData.courts ?? []) {
        if (!court.status || court.status === "Available") {
            const rate = court.hourly_rate != null && Number(court.hourly_rate) > 0 ? Number(court.hourly_rate) : 300;
            availableCourtMap.set(court.id, {
                name: court.name,
                hourlyRate: rate,
            });
        }
    }

    const rates = Array.from(availableCourtMap.values()).map((c) => c.hourlyRate);
    const lowestHourlyRate = rates.length > 0 ? Math.min(...rates) : 300;
    const lowestSplitPerPlayer = Math.ceil(lowestHourlyRate / 4);

    let totalOpenSlots = 0;
    const slots: QuickSlotCard[] = [];

    for (let hourIdx = 0; hourIdx < gridData.hours.length; hourIdx++) {
        const hour = gridData.hours[hourIdx];
        const row = gridData.grid[hourIdx] ?? [];

        const openCellsInRow = row.filter(
            (cell) => cell.status === "available" && availableCourtMap.has(cell.courtId)
        );

        totalOpenSlots += openCellsInRow.length;

        if (openCellsInRow.length > 0 && slots.length < maxCards) {
            const firstCell = openCellsInRow[0];
            const courtMeta = availableCourtMap.get(firstCell.courtId)!;
            const endHour = addOneHour(hour);
            const hourNum = parseInt(hour.split(":")[0], 10);
            const isPrimeHour = hourNum >= 17 && hourNum <= 20;

            let badgeLabel: QuickSlotCard["badgeLabel"] = "Next Available";
            let badgeTone: QuickSlotCard["badgeTone"] = "emerald";

            if (openCellsInRow.length === 1) {
                badgeLabel = "Only 1 Court Left!";
                badgeTone = "rose";
            } else if (isPrimeHour) {
                badgeLabel = "Prime Time";
                badgeTone = "amber";
            }

            slots.push({
                courtId: firstCell.courtId,
                courtName: courtMeta.name || firstCell.courtName,
                hour,
                endHour,
                timeLabel: `${formatAMPM(hour)} – ${formatAMPM(endHour)}`,
                hourlyRate: courtMeta.hourlyRate,
                splitPerPlayer: Math.ceil(courtMeta.hourlyRate / 4),
                openCourtsAtHour: openCellsInRow.length,
                badgeLabel,
                badgeTone,
                date: gridData.date,
            });
        }
    }

    return {
        date: gridData.date,
        totalOpenSlots,
        openCourtsCount: availableCourtMap.size,
        lowestHourlyRate,
        lowestSplitPerPlayer,
        slots,
    };
}

