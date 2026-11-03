"use client";

import { useState, useEffect, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Plus,
  ExternalLink,
  User,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  Wrench,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { cn } from "cn";
import {
  formatTime,
  getManilaNow,
  generateTimeSlots,
  DAY_LABELS,
} from "@/lib/utils/date";
import type { OperatingHours } from "@/lib/types/domain";
import { updateScheduleAction } from "@/app/admin/schedule/actions";

export type SlotStatus = "Available" | "Not Available" | "Maintenance" | "Booked";

export interface CourtItem {
  id: string;
  name: string;
  status?: string;
  hourlyRate?: number | null;
}

export interface LiveBookingItem {
  id: string;
  courtId: string;
  courtName: string;
  customerId: string;
  customerName: string;
  customerEmail: string | null;
  bookingDate: string;
  startTime: string;
  endTime: string;
  status: string;
  paymentStatus: string;
  paymentMethod?: string;
  paymentReference?: string | null;
  totalPrice: number;
  createdAt?: string;
}

export const DEFAULT_MASTER_COURTS: CourtItem[] = [
  { id: "c1", name: "Court 1", status: "Available", hourlyRate: 300 },
  { id: "c2", name: "Court 2", status: "Available", hourlyRate: 300 },
  { id: "c3", name: "Court 3", status: "Available", hourlyRate: 300 },
  { id: "c4", name: "Court 4", status: "Available", hourlyRate: 300 },
];

const HOUR_OPTIONS = [
  "06:00", "07:00", "08:00", "09:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00",
  "20:00", "21:00", "22:00", "23:00",
];

function shiftDate(dateISO: string, days: number): string {
  const parts = dateISO.split("-").map(Number);
  const d = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().split("T")[0];
}

function formatPaymentMethodTag(method?: string): string {
  if (!method) return "Cash";
  const lower = method.toLowerCase();
  if (lower.includes("gcash")) return "GCash QR";
  if (lower.includes("card") || lower.includes("stripe")) return "Card";
  return "Cash";
}

interface ScheduleTimelineProps {
  selectedDate: string;
  todayDate: string;
  initialCourts: CourtItem[];
  initialBookings?: LiveBookingItem[];
  initialOperatingHours?: OperatingHours[];
}

export function ScheduleTimeline({
  selectedDate,
  todayDate,
  initialCourts,
  initialBookings = [],
  initialOperatingHours = [],
}: ScheduleTimelineProps) {
  const router = useRouter();

  // Navigation & court filter state
  const [isNavigating, startTransition] = useTransition();
  const [courtFilter, setCourtFilter] = useState<string>("all");

  // Active sheets
  const [activeBookingSlot, setActiveBookingSlot] = useState<{
    court: CourtItem;
    slotLabel: string;
    booking: LiveBookingItem;
  } | null>(null);

  const [activeAvailableSlot, setActiveAvailableSlot] = useState<{
    court: CourtItem;
    slotStart: string;
    slotEnd: string;
    slotLabel: string;
  } | null>(null);

  const [isHoursOpen, setIsHoursOpen] = useState(false);
  const [hoursSubmitting, setHoursSubmitting] = useState(false);
  const [hoursMessage, setHoursMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Master sorted court list
  const masterCourts = useMemo(() => {
    if (!initialCourts || initialCourts.length === 0) {
      return DEFAULT_MASTER_COURTS;
    }
    const sorted = [...initialCourts].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { numeric: true })
    );
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

  const visibleCourts = useMemo(() => {
    if (courtFilter === "all") return masterCourts;
    const matched = masterCourts.filter((c) => c.id === courtFilter);
    return matched.length > 0 ? matched : masterCourts;
  }, [masterCourts, courtFilter]);

  // Determine operating hours for the selected date
  const selectedDayOfWeek = useMemo(() => {
    const parts = selectedDate.split("-").map(Number);
    const d = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
    return d.getUTCDay(); // 0 = Sunday, 1 = Monday, ...
  }, [selectedDate]);

  const currentDayHours = useMemo(() => {
    return initialOperatingHours.find((h) => h.dayOfWeek === selectedDayOfWeek);
  }, [initialOperatingHours, selectedDayOfWeek]);

  const isVenueClosedToday = currentDayHours?.isClosed ?? false;

  // Generate slots for the day
  const timeSlots = useMemo(() => {
    const open = currentDayHours?.openTime?.slice(0, 5) || "09:00";
    const rawClose = currentDayHours?.closeTime?.slice(0, 5);
    const close = !rawClose || rawClose === "21:00" || rawClose < "23:00" ? "23:00" : rawClose;
    const generated = generateTimeSlots(open, close, 60);

    if (generated.length > 0) return generated;
    return generateTimeSlots("09:00", "23:00", 60);
  }, [currentDayHours]);

  // Current Manila time marker (client-side mounted to prevent SSR hydration mismatch)
  const [currentHourPadded, setCurrentHourPadded] = useState<string | null>(null);

  useEffect(() => {
    const updateHour = () => {
      const manilaNow = getManilaNow();
      setCurrentHourPadded(`${manilaNow.currentHour.toString().padStart(2, "0")}:00`);
    };
    updateHour();
    const interval = setInterval(updateHour, 60000);
    return () => clearInterval(interval);
  }, []);

  const isViewingToday = selectedDate === todayDate;
  const isViewingPastDate = selectedDate < todayDate;

  // Date change handler
  const handleDateChange = (newDate: string) => {
    if (!newDate || newDate === selectedDate) return;
    startTransition(() => {
      router.push(`/admin/schedule?date=${newDate}`);
    });
  };

  // Metrics for the day
  const stats = useMemo(() => {
    const totalSlotsCount = timeSlots.length * masterCourts.length;
    let bookedSlotsCount = 0;
    let totalRevenue = 0;
    let paidBookingsCount = 0;

    initialBookings.forEach((b) => {
      totalRevenue += Number(b.totalPrice) || 0;
      if (b.paymentStatus === "succeeded" || b.paymentStatus === "paid") {
        paidBookingsCount++;
      }
    });

    timeSlots.forEach((slot) => {
      masterCourts.forEach((court) => {
        const hasBooking = initialBookings.some((b) => {
          if (b.courtId !== court.id) return false;
          const bStart = b.startTime.slice(0, 5);
          const bEnd = b.endTime.slice(0, 5);
          return bStart <= slot.start && (bEnd > slot.start || bEnd === "00:00");
        });
        if (hasBooking) bookedSlotsCount++;
      });
    });

    const occupancyRate = totalSlotsCount > 0
      ? Math.round((bookedSlotsCount / totalSlotsCount) * 100)
      : 0;

    const availableSlotsCount = isVenueClosedToday
      ? 0
      : Math.max(0, totalSlotsCount - bookedSlotsCount);

    return {
      totalBookings: initialBookings.length,
      paidBookingsCount,
      bookedSlotsCount,
      availableSlotsCount,
      occupancyRate,
      totalRevenue,
    };
  }, [timeSlots, masterCourts, initialBookings, isVenueClosedToday]);

  // Date display string
  const formattedDate = useMemo(() => {
    try {
      const parts = selectedDate.split("-").map(Number);
      const d = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
      return d.toLocaleDateString("en-US", {
        timeZone: "UTC",
        weekday: "long",
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return selectedDate;
    }
  }, [selectedDate]);

  // Relative badge
  const relativeBadge = useMemo(() => {
    if (selectedDate === todayDate) {
      return (
        <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
          Today
        </Badge>
      );
    }
    if (selectedDate === shiftDate(todayDate, 1)) {
      return (
        <Badge variant="outline" className="text-xs font-medium text-muted-foreground">
          Tomorrow
        </Badge>
      );
    }
    if (selectedDate === shiftDate(todayDate, -1)) {
      return (
        <Badge variant="outline" className="text-xs font-medium text-muted-foreground">
          Yesterday
        </Badge>
      );
    }
    return null;
  }, [selectedDate, todayDate]);

  // Handle Operating Hours Form Submit
  const handleSaveHours = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setHoursSubmitting(true);
    setHoursMessage(null);

    const formData = new FormData(e.currentTarget);
    const result = await updateScheduleAction(formData);

    setHoursSubmitting(false);
    if (result.success) {
      setHoursMessage({ type: "success", text: "Facility operating hours updated." });
      router.refresh();
      setTimeout(() => {
        setIsHoursOpen(false);
        setHoursMessage(null);
      }, 1200);
    } else {
      setHoursMessage({ type: "error", text: result.error || "Failed to update schedule." });
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Timeline Schedule
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Live court availability matrix and walk-in dispatch for DinkSync.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsHoursOpen(true)}
            className="cursor-pointer gap-2 border-slate-200 dark:border-slate-800"
          >
            <Clock className="size-4 text-slate-500" />
            <span>Operating Hours</span>
          </Button>

          <Link href={`/admin/bookings/new?date=${selectedDate}`}>
            <Button size="sm" className="cursor-pointer gap-1.5 shadow-2xs">
              <Plus className="size-4" />
              <span>New Booking</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Command Bar: Date Navigation + Day KPI Strip */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden">
        {/* Top Row: Date Switcher & Formatted Date */}
        <div className="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 p-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 cursor-pointer text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                onClick={() => handleDateChange(shiftDate(selectedDate, -1))}
                disabled={isNavigating}
                title="Previous Day"
              >
                <ChevronLeft className="size-4" />
                <span className="sr-only">Previous Day</span>
              </Button>

              <div className="relative flex items-center px-2">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  disabled={isNavigating}
                  aria-label="Select schedule date"
                  className="bg-transparent text-sm font-semibold text-slate-900 dark:text-slate-100 focus:outline-none cursor-pointer tabular-nums"
                />
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 cursor-pointer text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                onClick={() => handleDateChange(shiftDate(selectedDate, 1))}
                disabled={isNavigating}
                title="Next Day"
              >
                <ChevronRight className="size-4" />
                <span className="sr-only">Next Day</span>
              </Button>
            </div>

            <Button
              variant={isViewingToday ? "secondary" : "outline"}
              size="sm"
              onClick={() => handleDateChange(todayDate)}
              disabled={isViewingToday || isNavigating}
              className="cursor-pointer font-medium"
            >
              Today
            </Button>

            <div className="flex items-center gap-2 pl-1">
              <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {formattedDate}
              </span>
              {relativeBadge}
              {isNavigating && (
                <Loader2 className="size-3.5 animate-spin text-slate-400" />
              )}
            </div>
          </div>

          {/* Right: Court Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pr-1">
            <button
              type="button"
              onClick={() => setCourtFilter("all")}
              style={{ touchAction: "manipulation" }}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer",
                courtFilter === "all"
                  ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              )}
            >
              All Courts
            </button>
            {masterCourts.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCourtFilter(c.id)}
                style={{ touchAction: "manipulation" }}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer",
                  courtFilter === c.id
                    ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                )}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Bottom Row: 4-Column Tabular Operational Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-slate-800 bg-slate-50/40 dark:bg-slate-950/30">
          <div className="px-4 py-3 flex items-center justify-between sm:block">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block">
              Reservations
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5 tabular-nums">
              <span className="text-base font-bold text-slate-900 dark:text-slate-100">
                {stats.totalBookings}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                ({stats.bookedSlotsCount} hrs)
              </span>
            </div>
          </div>

          <div className="px-4 py-3 flex items-center justify-between sm:block">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block">
              Open Court Hours
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5 tabular-nums">
              <span className="text-base font-bold text-emerald-700 dark:text-emerald-400">
                {stats.availableSlotsCount}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                hrs available
              </span>
            </div>
          </div>

          <div className="px-4 py-3 flex items-center justify-between sm:block">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block">
              Court Occupancy
            </span>
            <div className="flex items-baseline gap-2 mt-0.5 tabular-nums">
              <span className="text-base font-bold text-slate-900 dark:text-slate-100">
                {stats.occupancyRate}%
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                of day capacity
              </span>
            </div>
          </div>

          <div className="px-4 py-3 flex items-center justify-between sm:block">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block">
              Day Revenue
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5 tabular-nums">
              <span className="text-base font-bold text-slate-900 dark:text-slate-100">
                ₱{stats.totalRevenue.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
              </span>
              {stats.totalBookings > 0 && (
                <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                  {stats.paidBookingsCount}/{stats.totalBookings} paid
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Closed venue warning banner if applicable */}
        {isVenueClosedToday && (
          <div className="px-4 py-3 flex items-center justify-between bg-amber-500/10 border-t border-amber-500/20 text-xs text-amber-900 dark:text-amber-200">
            <div className="flex items-center gap-2">
              <AlertCircle className="size-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>
                <strong>Facility Notice:</strong> The venue is marked as <strong>Closed</strong> on this day in operating hours.
              </span>
            </div>
            <Button
              variant="link"
              size="sm"
              onClick={() => setIsHoursOpen(true)}
              className="text-amber-800 dark:text-amber-300 font-semibold p-0 h-auto cursor-pointer"
            >
              Modify Hours
            </Button>
          </div>
        )}
      </div>

      {/* 3. Legend & Active Hour Status */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1 text-xs">
        <div className="flex flex-wrap items-center gap-4 text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-emerald-500" />
            <span>Available (Click to reserve)</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-blue-600 dark:bg-blue-400" />
            <span>Booked (Click for details)</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-amber-500" />
            <span>Maintenance</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-slate-300 dark:bg-slate-600" />
            <span>Passed / Closed</span>
          </div>
        </div>

        {isViewingToday && (
          <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-medium">
            <span className="size-2 rounded-full bg-rose-500 animate-pulse" />
            <span>Current Manila hour highlighted</span>
          </div>
        )}
      </div>

      {/* 4. Timeline Schedule Grid Matrix */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden">
        <div className="relative overflow-auto max-h-[720px] w-full">
          <div className={visibleCourts.length === 1 ? "w-full min-w-0" : "min-w-[820px]"}>
            {/* Sticky Court Header Row */}
            <div
              className={cn(
                "grid sticky top-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800",
                visibleCourts.length === 1
                  ? "grid-cols-[130px_1fr] sm:grid-cols-[165px_1fr]"
                  : "grid-cols-[130px_repeat(4,minmax(170px,1fr))] sm:grid-cols-[165px_repeat(4,1fr)]"
              )}
            >
              <div className="sticky left-0 z-30 p-3.5 border-r border-slate-200 dark:border-slate-800 flex items-center justify-center bg-slate-50 dark:bg-slate-950 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.05)]">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Clock className="size-3.5" /> Time (PHT)
                </span>
              </div>

              {visibleCourts.map((court) => (
                <div
                  key={court.id}
                  className="p-3.5 border-r last:border-r-0 border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center bg-slate-50/60 dark:bg-slate-950/40"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                      {court.name}
                    </span>
                    {court.status === "Maintenance" ? (
                      <Badge variant="outline" className="text-xs bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300">
                        Maintenance
                      </Badge>
                    ) : court.status === "Not Available" ? (
                      <Badge variant="outline" className="text-xs text-slate-500">
                        Inactive
                      </Badge>
                    ) : (
                      <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 tabular-nums">
                        ₱{court.hourlyRate || 300}/hr
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Time Slot Rows */}
            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {timeSlots.map((slot) => {
                const slotLabel = `${formatTime(slot.start)} – ${formatTime(slot.end)}`;
                const isCurrentHourSlot = Boolean(
                  isViewingToday && currentHourPadded && slot.start === currentHourPadded
                );
                const isPastSlot = Boolean(
                  isViewingPastDate ||
                    (isViewingToday && currentHourPadded && slot.start < currentHourPadded)
                );

                return (
                  <div
                    key={`${slot.start}-${slot.end}`}
                    className={cn(
                      "grid min-h-[68px] transition-colors",
                      visibleCourts.length === 1
                        ? "grid-cols-[130px_1fr] sm:grid-cols-[165px_1fr]"
                        : "grid-cols-[130px_repeat(4,minmax(170px,1fr))] sm:grid-cols-[165px_repeat(4,1fr)]",
                      isCurrentHourSlot && "bg-rose-500/5 dark:bg-rose-500/10"
                    )}
                  >
                    {/* Sticky Time Y-Axis Column */}
                    <div
                      className={cn(
                        "sticky left-0 z-10 flex flex-col items-center justify-center p-2.5 border-r border-slate-200 dark:border-slate-800 select-none text-center shadow-[2px_0_4px_-1px_rgba(0,0,0,0.04)]",
                        isCurrentHourSlot
                          ? "bg-rose-50 dark:bg-rose-950/60"
                          : "bg-white dark:bg-slate-900"
                      )}
                    >
                      <span
                        className={cn(
                          "text-xs font-semibold tabular-nums",
                          isPastSlot && !isCurrentHourSlot
                            ? "text-slate-400 dark:text-slate-500"
                            : "text-slate-800 dark:text-slate-200"
                        )}
                      >
                        {slotLabel}
                      </span>
                      {isCurrentHourSlot && (
                        <span className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-100/90 dark:bg-rose-950 border border-rose-200 dark:border-rose-800 px-2 py-0.5 rounded-full">
                          <span className="size-1.5 rounded-full bg-rose-500 animate-ping" />
                          NOW
                        </span>
                      )}
                    </div>

                    {/* Court Cells */}
                    {visibleCourts.map((court) => {
                      if (court.status === "Maintenance") {
                        return (
                          <div
                            key={court.id}
                            className="border-r last:border-r-0 border-slate-100 dark:border-slate-800/80 p-1.5 flex items-center justify-center"
                          >
                            <div className="w-full h-full min-h-[54px] rounded-xl px-2.5 py-1.5 flex items-center justify-center gap-1.5 text-center select-none bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/40 text-amber-800 dark:text-amber-300">
                              <Wrench className="size-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                              <span className="font-semibold text-xs">Maintenance</span>
                            </div>
                          </div>
                        );
                      }

                      if (court.status === "Not Available") {
                        return (
                          <div
                            key={court.id}
                            className="border-r last:border-r-0 border-slate-100 dark:border-slate-800/80 p-1.5 flex items-center justify-center"
                          >
                            <div className="w-full h-full min-h-[54px] rounded-xl px-2.5 py-1.5 flex items-center justify-center text-center select-none bg-slate-100/60 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500">
                              <span className="font-semibold text-xs">Not Available</span>
                            </div>
                          </div>
                        );
                      }

                      // Check live booking for this court & time
                      const liveBooking = initialBookings.find((b) => {
                        if (b.courtId !== court.id) return false;
                        const bStart = b.startTime.slice(0, 5);
                        const bEnd = b.endTime.slice(0, 5);
                        return bStart <= slot.start && (bEnd > slot.start || bEnd === "00:00");
                      });

                      if (liveBooking) {
                        const isPaid =
                          liveBooking.paymentStatus === "succeeded" ||
                          liveBooking.paymentStatus === "paid";
                        const bStart = liveBooking.startTime.slice(0, 5);
                        const bEnd = liveBooking.endTime.slice(0, 5);
                        const bookingSpanLabel = `${formatTime(bStart)} – ${formatTime(bEnd)}`;
                        const methodTag = formatPaymentMethodTag(liveBooking.paymentMethod);

                        return (
                          <div
                            key={court.id}
                            className="border-r last:border-r-0 border-slate-100 dark:border-slate-800/80 p-1.5 flex items-center justify-center"
                          >
                            <button
                              type="button"
                              onClick={() =>
                                setActiveBookingSlot({
                                  court,
                                  slotLabel,
                                  booking: liveBooking,
                                })
                              }
                              className="w-full h-full min-h-[54px] rounded-xl px-3 py-2 flex flex-col justify-between text-left select-none bg-blue-50/75 dark:bg-blue-950/40 hover:bg-blue-100/80 dark:hover:bg-blue-900/50 border border-blue-200/80 dark:border-blue-900/60 transition-colors cursor-pointer group"
                            >
                              <div className="flex items-center justify-between gap-1.5 w-full">
                                <span className="font-semibold text-xs text-slate-900 dark:text-slate-100 truncate group-hover:text-blue-700 dark:group-hover:text-blue-300">
                                  {liveBooking.customerName}
                                </span>
                                <span
                                  className={cn(
                                    "px-1.5 py-0.5 rounded-full text-xs font-semibold shrink-0",
                                    isPaid
                                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                      : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                                  )}
                                >
                                  {isPaid ? "Paid" : "Pending"}
                                </span>
                              </div>

                              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-1 w-full tabular-nums">
                                <span className="truncate">
                                  {methodTag} · {bookingSpanLabel}
                                </span>
                                <span className="font-semibold text-slate-700 dark:text-slate-200 shrink-0 ml-1">
                                  ₱{Number(liveBooking.totalPrice).toFixed(0)}
                                </span>
                              </div>
                            </button>
                          </div>
                        );
                      }

                      if (isVenueClosedToday) {
                        return (
                          <div
                            key={court.id}
                            className="border-r last:border-r-0 border-slate-100 dark:border-slate-800/80 p-1.5 flex items-center justify-center"
                          >
                            <div className="w-full h-full min-h-[54px] rounded-xl px-2.5 py-1.5 flex items-center justify-center text-center select-none bg-slate-50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/60 text-slate-400 dark:text-slate-500">
                              <span className="font-medium text-xs">Closed</span>
                            </div>
                          </div>
                        );
                      }

                      // Passed unbooked slot (muted at rest, still clickable for admin logging)
                      if (isPastSlot) {
                        return (
                          <div
                            key={court.id}
                            className="border-r last:border-r-0 border-slate-100 dark:border-slate-800/80 p-1.5 flex items-center justify-center"
                          >
                            <button
                              type="button"
                              onClick={() =>
                                setActiveAvailableSlot({
                                  court,
                                  slotStart: slot.start,
                                  slotEnd: slot.end,
                                  slotLabel,
                                })
                              }
                              className="w-full h-full min-h-[54px] rounded-xl px-2 py-1.5 flex items-center justify-center text-center select-none bg-slate-50/70 dark:bg-slate-900/40 hover:bg-slate-100 dark:hover:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800/60 transition-colors cursor-pointer group"
                            >
                              <span className="text-xs font-medium text-slate-400 dark:text-slate-500 group-hover:hidden">
                                Passed
                              </span>
                              <span className="hidden group-hover:inline-flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
                                <Plus className="size-3.5" />
                                Log Walk-in
                              </span>
                            </button>
                          </div>
                        );
                      }

                      // Slot is Available
                      return (
                        <div
                          key={court.id}
                          className="border-r last:border-r-0 border-slate-100 dark:border-slate-800/80 p-1.5 flex items-center justify-center"
                        >
                          <button
                            type="button"
                            onClick={() =>
                              setActiveAvailableSlot({
                                court,
                                slotStart: slot.start,
                                slotEnd: slot.end,
                                slotLabel,
                              })
                            }
                            className="w-full h-full min-h-[54px] rounded-xl px-2 py-1.5 flex items-center justify-center text-center select-none bg-white dark:bg-slate-900 hover:bg-emerald-50/80 dark:hover:bg-emerald-950/30 border border-slate-200/80 hover:border-emerald-300 dark:border-slate-800 dark:hover:border-emerald-700/60 transition-colors cursor-pointer group"
                          >
                            <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 group-hover:hidden">
                              <span className="size-1.5 rounded-full bg-emerald-500" />
                              Available
                            </span>
                            <span className="hidden group-hover:inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                              <Plus className="size-3.5" />
                              Reserve
                            </span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 5. Booking Details Drawer / Sheet */}
      <Sheet
        open={!!activeBookingSlot}
        onOpenChange={(open) => !open && setActiveBookingSlot(null)}
      >
        <SheetContent side="right" className="sm:max-w-md p-6">
          {activeBookingSlot && (
            <div className="flex flex-col h-full space-y-6">
              <SheetHeader>
                <SheetTitle className="text-xl font-bold flex items-center gap-2">
                  <span>Reservation Details</span>
                  <Badge className="bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20 text-xs font-medium">
                    {activeBookingSlot.court.name}
                  </Badge>
                </SheetTitle>
                <SheetDescription className="tabular-nums">
                  {formattedDate} · {activeBookingSlot.slotLabel} · #{activeBookingSlot.booking.id.slice(0, 8).toUpperCase()}
                </SheetDescription>
              </SheetHeader>

              {/* Customer Information Card */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-3 bg-slate-50/50 dark:bg-slate-900/50">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <User className="size-3.5" /> Player / Customer
                </span>
                <div className="space-y-1">
                  <p className="font-semibold text-base text-slate-900 dark:text-white">
                    {activeBookingSlot.booking.customerName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {activeBookingSlot.booking.customerEmail || "No email on record (Walk-in)"}
                  </p>
                </div>
              </div>

              {/* Reservation Timing & Pricing */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-3 bg-slate-50/50 dark:bg-slate-900/50">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <CreditCard className="size-3.5" /> Billing & Payment
                </span>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-xs text-muted-foreground block">Court Fee</span>
                    <span className="font-semibold text-slate-900 dark:text-white tabular-nums">
                      ₱{Number(activeBookingSlot.booking.totalPrice).toFixed(2)}
                    </span>
                  </div>

                  <div>
                    <span className="text-xs text-muted-foreground block">Payment Status</span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs font-semibold mt-0.5",
                        activeBookingSlot.booking.paymentStatus === "succeeded" ||
                          activeBookingSlot.booking.paymentStatus === "paid"
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300"
                          : "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300"
                      )}
                    >
                      {activeBookingSlot.booking.paymentStatus.toUpperCase()}
                    </Badge>
                  </div>

                  <div>
                    <span className="text-xs text-muted-foreground block">Method</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300 capitalize">
                      {activeBookingSlot.booking.paymentMethod || "Counter / Cash"}
                    </span>
                  </div>

                  <div>
                    <span className="text-xs text-muted-foreground block">Reference</span>
                    <span className="font-mono text-xs text-slate-700 dark:text-slate-300">
                      {activeBookingSlot.booking.paymentReference || "—"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5 pt-4 mt-auto">
                <Link
                  href={`/admin/bookings?search=${encodeURIComponent(activeBookingSlot.booking.id)}`}
                  className="w-full block"
                >
                  <Button className="w-full cursor-pointer gap-2">
                    <ExternalLink className="size-4" />
                    <span>View in Bookings Management</span>
                  </Button>
                </Link>

                <Link
                  href={`/admin/bookings/new?courtId=${activeBookingSlot.court.id}&date=${selectedDate}`}
                  className="w-full block"
                >
                  <Button variant="outline" className="w-full cursor-pointer gap-2">
                    <Plus className="size-4" />
                    <span>Book Another Slot on {activeBookingSlot.court.name}</span>
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* 6. Available Slot Quick Reserve Drawer / Sheet */}
      <Sheet
        open={!!activeAvailableSlot}
        onOpenChange={(open) => !open && setActiveAvailableSlot(null)}
      >
        <SheetContent side="right" className="sm:max-w-md p-6">
          {activeAvailableSlot && (
            <div className="flex flex-col h-full space-y-6">
              <SheetHeader>
                <SheetTitle className="text-xl font-bold flex items-center gap-2">
                  <span>Reserve Court Slot</span>
                  <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 text-xs font-medium">
                    {activeAvailableSlot.court.name}
                  </Badge>
                </SheetTitle>
                <SheetDescription className="tabular-nums">
                  {formattedDate} · {activeAvailableSlot.slotLabel}
                </SheetDescription>
              </SheetHeader>

              <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-3 bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Standard Hourly Rate
                  </span>
                  <span className="font-bold text-lg text-slate-900 dark:text-white tabular-nums">
                    ₱{activeAvailableSlot.court.hourlyRate || 300}/hr
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Lock in this court slot immediately for walk-in players or registered members. Double booking is strictly prevented.
                </p>
              </div>

              <div className="space-y-2.5 pt-4 mt-auto">
                <Link
                  href={`/admin/bookings/new?courtId=${activeAvailableSlot.court.id}&date=${selectedDate}&startTime=${activeAvailableSlot.slotStart}`}
                  className="w-full block"
                >
                  <Button className="w-full cursor-pointer gap-2">
                    <Plus className="size-4" />
                    <span>Book This Slot</span>
                  </Button>
                </Link>

                <Button
                  variant="outline"
                  onClick={() => setActiveAvailableSlot(null)}
                  className="w-full cursor-pointer"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* 7. Facility Operating Hours Sheet */}
      <Sheet open={isHoursOpen} onOpenChange={setIsHoursOpen}>
        <SheetContent side="right" className="sm:max-w-xl p-6 overflow-y-auto">
          <SheetHeader className="mb-4">
            <SheetTitle className="text-xl font-bold">Facility Operating Hours</SheetTitle>
            <SheetDescription>
              Adjust weekly operational open and close hours. Customer booking slots and the admin schedule matrix reflect these hours immediately.
            </SheetDescription>
          </SheetHeader>

          {hoursMessage && (
            <div
              className={cn(
                "p-3 rounded-xl mb-4 text-xs flex items-center gap-2",
                hoursMessage.type === "success"
                  ? "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20"
                  : "bg-rose-500/10 text-rose-800 dark:text-rose-300 border border-rose-500/20"
              )}
            >
              {hoursMessage.type === "success" ? (
                <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="size-4 shrink-0 text-rose-600" />
              )}
              <span>{hoursMessage.text}</span>
            </div>
          )}

          <form onSubmit={handleSaveHours} className="space-y-4">
            <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
              {DAY_LABELS.map((dayName, dayIndex) => {
                const dayHourConfig = initialOperatingHours.find(
                  (h) => h.dayOfWeek === dayIndex
                );
                const defaultOpen = dayHourConfig?.openTime?.slice(0, 5) || "09:00";
                const rawClose = dayHourConfig?.closeTime?.slice(0, 5);
                const defaultClose = !rawClose || rawClose === "21:00" || rawClose < "23:00" ? "23:00" : rawClose;
                const defaultClosed = dayHourConfig?.isClosed ?? false;

                return (
                  <div
                    key={dayIndex}
                    className="p-3.5 bg-white dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="w-28 shrink-0">
                      <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                        {dayName}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-muted-foreground">Open:</label>
                        <select
                          name={`open-${dayIndex}`}
                          defaultValue={defaultOpen}
                          className="text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-1.5 text-slate-900 dark:text-white tabular-nums"
                        >
                          {HOUR_OPTIONS.map((h) => (
                            <option key={h} value={h}>
                              {formatTime(h)}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-center gap-2">
                        <label className="text-xs text-muted-foreground">Close:</label>
                        <select
                          name={`close-${dayIndex}`}
                          defaultValue={defaultClose}
                          className="text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-1.5 text-slate-900 dark:text-white tabular-nums"
                        >
                          {HOUR_OPTIONS.map((h) => (
                            <option key={h} value={h}>
                              {formatTime(h)}
                            </option>
                          ))}
                        </select>
                      </div>

                      <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 font-medium cursor-pointer ml-auto">
                        <input
                          type="checkbox"
                          name={`closed-${dayIndex}`}
                          defaultChecked={defaultClosed}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 size-4"
                        />
                        <span>Closed</span>
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>

            <SheetFooter className="pt-4">
              <Button
                type="submit"
                disabled={hoursSubmitting}
                className="w-full cursor-pointer gap-2"
              >
                {hoursSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Saving Operating Hours...</span>
                  </>
                ) : (
                  <span>Save Operating Hours</span>
                )}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}

export default ScheduleTimeline;
