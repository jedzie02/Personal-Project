"use client";

import { useState, useEffect, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar } from "lucide-react";
import { cn } from "cn";

export type SlotStatus = "Available" | "Not Available" | "Maintenance" | "Booked";

export interface CourtItem {
  id: string;
  name: string;
  status?: string;
}

export const DEFAULT_MASTER_COURTS: CourtItem[] = [
  { id: "c1", name: "Court 1", status: "Available" },
  { id: "c2", name: "Court 2", status: "Available" },
  { id: "c3", name: "Court 3", status: "Available" },
  { id: "c4", name: "Court 4", status: "Available" },
];

export const TIME_SLOTS = [
  "09:00 AM – 10:00 AM",
  "10:00 AM – 11:00 AM",
  "11:00 AM – 12:00 PM",
  "12:00 PM – 01:00 PM",
  "01:00 PM – 02:00 PM",
  "02:00 PM – 03:00 PM",
  "03:00 PM – 04:00 PM",
  "04:00 PM – 05:00 PM",
  "05:00 PM – 06:00 PM",
  "06:00 PM – 07:00 PM",
  "07:00 PM – 08:00 PM",
  "08:00 PM – 09:00 PM",
  "09:00 PM – 10:00 PM",
  "10:00 PM – 11:00 PM",
  "11:00 PM – 12:00 AM",
];

export const STATUS_STYLES: Record<
  SlotStatus,
  { cellClass: string; dot: string }
> = {
  Available: {
    cellClass:
      "bg-white text-emerald-950 border border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300 transition-colors cursor-pointer",
    dot: "bg-emerald-500",
  },
  Booked: {
    cellClass: "bg-slate-100 text-slate-500 border border-slate-200 cursor-not-allowed",
    dot: "bg-slate-400",
  },
  Maintenance: {
    cellClass: "bg-amber-50 text-amber-800 border border-amber-200 cursor-not-allowed",
    dot: "bg-amber-500",
  },
  "Not Available": {
    cellClass: "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed",
    dot: "bg-slate-300",
  },
};

export interface LiveBookingItem {
  courtId: string;
  startTime: string;
  endTime: string;
  status: string;
}

function timeSlotToHour(slot: string): string {
  const startPart = slot.split("–")[0].trim();
  const [time, period] = startPart.split(" ");
  let [h, m] = time.split(":").map(Number);
  if (period === "PM" && h !== 12) h += 12;
  if (period === "AM" && h === 12) h = 0;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

export function ScheduleTimeline({
  initialCourts,
  initialBookings = [],
}: {
  initialCourts: CourtItem[];
  initialBookings?: LiveBookingItem[];
}) {
  // 1. Complete, master list of all courts (memoized to prevent redundant sorting)
  const masterCourts = useMemo(() => {
    if (!initialCourts || initialCourts.length === 0) {
      return DEFAULT_MASTER_COURTS;
    }
    const sorted = [...initialCourts].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { numeric: true })
    );
    // If fewer than 4 courts are returned, fill with default courts to prevent grid collapse
    if (sorted.length < 4) {
      const existingNames = new Set(sorted.map((c) => c.name.toLowerCase()));
      for (const defCourt of DEFAULT_MASTER_COURTS) {
        if (sorted.length >= 4) break;
        if (!existingNames.has(defCourt.name.toLowerCase())) {
          sorted.push(defCourt);
        }
      }
    }
    return sorted;
  }, [initialCourts]);

  // Helper to compute initial status for a court at a given slot
  const computeSlotStatus = (
    court: CourtItem,
    time: string,
    cIdx: number,
    bookings: LiveBookingItem[]
  ): SlotStatus => {
    const slotHour = timeSlotToHour(time);

    // If court itself is in Maintenance or Not Available in database, reflect that
    if (court.status === "Maintenance") return "Maintenance";
    if (court.status === "Not Available") return "Not Available";

    // Check if there is a real booking from Supabase for this court & time
    // Normalizing to HH:MM prevents string length mismatch ('11:00:00' > '11:00') that causes off-by-one-hour shifts
    const liveBooking = bookings.find((b) => {
      if (b.courtId !== court.id) return false;
      const bStart = b.startTime.slice(0, 5);
      const bEnd = b.endTime.slice(0, 5);
      return bStart <= slotHour && (bEnd > slotHour || bEnd === "00:00");
    });
    if (liveBooking) return "Booked";

    // If no database bookings exist, populate initial schedule reference
    if (bookings.length === 0) {
      if (cIdx === 0 && ["09:00 AM – 10:00 AM", "01:00 PM – 02:00 PM", "05:00 PM – 06:00 PM"].includes(time)) {
        return "Booked";
      } else if (cIdx === 1 && ["10:00 AM – 11:00 AM", "04:00 PM – 05:00 PM"].includes(time)) {
        return "Booked";
      } else if (cIdx === 2 && ["02:00 PM – 03:00 PM"].includes(time)) {
        return "Maintenance";
      } else if (cIdx === 3 && ["03:00 PM – 04:00 PM", "08:00 PM – 09:00 PM"].includes(time)) {
        return "Booked";
      }
    }

    return "Available";
  };

  // 2. State management: track the status of each slot keyed by [courtId-time]
  const [slotStatuses, setSlotStatuses] = useState<Record<string, SlotStatus>>(() => {
    const initial: Record<string, SlotStatus> = {};
    masterCourts.forEach((court, cIdx) => {
      TIME_SLOTS.forEach((time) => {
        const key = `${court.id}-${time}`;
        initial[key] = computeSlotStatus(court, time, cIdx, initialBookings);
      });
    });
    return initial;
  });

  // Sync state if initialCourts or initialBookings change (e.g. after database updates)
  useEffect(() => {
    setSlotStatuses((prev) => {
      const updated = { ...prev };
      masterCourts.forEach((court, cIdx) => {
        TIME_SLOTS.forEach((time) => {
          const key = `${court.id}-${time}`;
          // Preserve any local override unless the court is globally set to Maintenance/Not Available
          if (court.status === "Maintenance") {
            updated[key] = "Maintenance";
          } else if (court.status === "Not Available") {
            updated[key] = "Not Available";
          } else if (!updated[key]) {
            updated[key] = computeSlotStatus(court, time, cIdx, initialBookings);
          }
        });
      });
      return updated;
    });
  }, [initialCourts, initialBookings]);



  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Timeline Schedule</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Gantt matrix with bulk column updates and interactive slot scheduling.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/80 px-3 py-1.5 rounded-lg border text-sm text-muted-foreground self-start sm:self-auto">
          <Calendar className="size-4 text-primary" />
          <span className="font-medium text-foreground">{currentDate}</span>
        </div>
      </div>

      {/* Legend & Stats */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-card border rounded-xl p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="font-semibold text-gray-700 mr-1 flex items-center gap-1.5">
            Legend:
          </span>
          <div className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-emerald-500" />
            <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-200 text-xs font-medium">
              Available
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-slate-400" />
            <Badge variant="outline" className="bg-slate-100 text-slate-600 border-slate-200 text-xs font-medium">
              Booked
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-amber-500" />
            <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200 text-xs font-medium">
              Maintenance
            </Badge>
          </div>
        </div>
      </div>

      {/* Responsive Timeline Matrix */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <ScrollArea className="h-[720px] w-full">
          <div className="min-w-[920px]">
            {/* 1. Court Headers (Sticky Header Row) */}
            <div className="grid grid-cols-[175px_repeat(4,1fr)] sticky top-0 z-20 bg-background/95 backdrop-blur border-b shadow-xs">
              <div className="p-3.5 text-center font-bold text-xs uppercase tracking-wider text-muted-foreground border-r flex items-center justify-center bg-muted/40">
                Operating Hours
              </div>
              {masterCourts.map((court) => (
                <div
                  key={court.id}
                  className="p-3 text-center border-r last:border-r-0 flex items-center justify-center font-bold text-sm text-foreground bg-muted/20"
                >
                  {court.name}
                </div>
              ))}
            </div>

            {/* Time Slots (Y-Axis & Grid Cells) */}
            {TIME_SLOTS.map((time) => (
              <div
                key={time}
                className="grid grid-cols-[175px_repeat(4,1fr)] border-b last:border-b-0 min-h-[58px]"
              >
                {/* Time Axis (Y-Axis) */}
                <div className="flex items-center justify-center p-2 text-sm font-medium text-gray-600 border-r bg-muted/10 select-none text-center">
                  {time}
                </div>

                {/* Grid Cells: Always iterate over the master list of all courts.
                    CRUCIAL RULE: Return exactly one div/cell per court. Never omit,
                    filter out, or return null, guaranteeing 4 uniform columns. */}
                {masterCourts.map((court) => {
                  const slotKey = `${court.id}-${time}`;
                  const currentStatus: SlotStatus =
                    slotStatuses[slotKey] ||
                    (court.status === "Maintenance"
                      ? "Maintenance"
                      : court.status === "Not Available"
                      ? "Not Available"
                      : "Available");

                  const cellClass =
                    STATUS_STYLES[currentStatus]?.cellClass ||
                    STATUS_STYLES.Available.cellClass;

                  return (
                    <div
                      key={court.id}
                      className="border-r last:border-r-0 p-1.5 flex items-center justify-center min-w-0"
                    >
                      <div
                        className={cn(
                          "w-full h-full min-h-[44px] rounded-md px-2 py-1.5 flex items-center justify-center text-center select-none shadow-2xs transition-colors",
                          cellClass
                        )}
                      >
                        <span className="font-semibold text-xs leading-tight">
                          {currentStatus}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

export default ScheduleTimeline;
