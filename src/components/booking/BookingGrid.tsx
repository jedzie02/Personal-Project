"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Lock, CheckCircle2, Clock, ChevronRight, Check, Trash2, CalendarX } from "lucide-react";
import type { BookingGridData, GridCell } from "@/lib/services/booking-grid.service";
import { PRICE_PER_HOUR } from "@/lib/config/booking-rules";
import { supabase } from "@/lib/supabase";
import {
    toggleCartSlot,
    calculateCartTotal,
    sortCartSlots,
    convertCartToSegments,
    type SelectedGridSlot,
} from "@/lib/utils/cart";

interface SelectedSlot {
    courtId: string;
    courtName: string;
    hour: string;
}

function formatAMPM(timeStr: string) {
    const [hStr, mStr] = timeStr.split(":");
    let h = parseInt(hStr, 10);
    h = h % 24;
    const ampm = h >= 12 && h < 24 ? "PM" : "AM";
    h = h % 12;
    h = h ? h : 12; // the hour '0' should be '12'
    const hFormatted = h.toString().padStart(2, "0");
    return `${hFormatted}:${mStr} ${ampm}`;
}

function formatDate(dateStr: string) {
    try {
        const [y, m, d] = dateStr.split("-").map(Number);
        if (!y || !m || !d) return dateStr;
        const dateObj = new Date(y, m - 1, d);
        return dateObj.toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    } catch {
        return dateStr;
    }
}

const DEFAULT_MASTER_COURTS = [
    { id: "court-1", name: "Court 1", status: "Available", hourly_rate: 300 },
    { id: "court-2", name: "Court 2", status: "Available", hourly_rate: 300 },
    { id: "court-3", name: "Court 3", status: "Available", hourly_rate: 300 },
    { id: "court-4", name: "Court 4", status: "Available", hourly_rate: 300 },
];

export default function BookingGrid({
    data,
    initialSelectCourt,
    initialSelectHour,
    initialCourtFilter,
}: {
    data: BookingGridData;
    initialSelectCourt?: string;
    initialSelectHour?: string;
    initialCourtFilter?: string;
}) {
    const router = useRouter();
    const { courts, hours, grid, date } = data;
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [selectedSlots, setSelectedSlots] = useState<SelectedGridSlot[]>([]);
    const [mobileCourtFilter, setMobileCourtFilter] = useState<string>(initialCourtFilter || "all");

    // Memoize master list of 4 naturally sorted courts
    const masterCourts = useMemo(() => {
        if (!courts || courts.length === 0) {
            return DEFAULT_MASTER_COURTS;
        }
        const sorted = [...courts].sort((a, b) =>
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
    }, [courts]);

    const courtMap = useMemo(() => {
        return new Map(masterCourts.map((court) => [court.id, court.name]));
    }, [masterCourts]);

    const activeCourts = useMemo(() => {
        if (mobileCourtFilter === "all") return masterCourts;
        const matched = masterCourts.filter((c) => c.id === mobileCourtFilter);
        return matched.length > 0 ? matched : masterCourts;
    }, [masterCourts, mobileCourtFilter]);

    // Check authentication state (localStorage, cookies, or Supabase session)
    useEffect(() => {
        const checkAuth = async () => {
            const storedAuth =
                localStorage.getItem("isLoggedIn") === "true" ||
                document.cookie.includes("isLoggedIn=true");
            if (storedAuth) {
                setIsLoggedIn(true);
                return;
            }

            try {
                const { data } = await supabase.auth.getSession();
                if (data?.session?.user) {
                    setIsLoggedIn(true);
                    return;
                }
            } catch {
                // Ignore session lookup errors
            }
            setIsLoggedIn(false);
        };

        checkAuth();
        window.addEventListener("storage", checkAuth);

        const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                setIsLoggedIn(true);
            }
        });

        return () => {
            window.removeEventListener("storage", checkAuth);
            authListener?.subscription?.unsubscribe();
        };
    }, []);

    // 1. Payment method selector state — used in cart flow via handleProceedCart (GCash QR default)
    // Note: payment method is hardcoded to GCash QR in the cart URL; kept as a constant.

    // 2. First-time booking guide banner state
    const [showGuide, setShowGuide] = useState(false);
    useEffect(() => {
        try {
            const dismissed = localStorage.getItem("paddlix_guide_dismissed") === "true";
            if (!dismissed) {
                setShowGuide(true);
            }
        } catch {
            // Ignore localStorage errors
        }
    }, []);

    const dismissGuide = () => {
        setShowGuide(false);
        try {
            localStorage.setItem("paddlix_guide_dismissed", "true");
        } catch {
            // Ignore
        }
    };

    const sortedSlots = useMemo(() => sortCartSlots(selectedSlots), [selectedSlots]);
    const cartTotal = useMemo(() => calculateCartTotal(selectedSlots), [selectedSlots]);

    // Restore pending cart if user just returned from signup / login
    useEffect(() => {
        try {
            const savedCart = sessionStorage.getItem("paddlix_pending_cart");
            if (savedCart) {
                const parsed = JSON.parse(savedCart);
                if (parsed.date === date && Array.isArray(parsed.slots)) {
                    setSelectedSlots(parsed.slots);
                }
                sessionStorage.removeItem("paddlix_pending_cart");
            }
        } catch {
            // Ignore
        }
    }, [date]);

    // Toggle slot in cart directly on grid
    const handleToggleSlot = (slot: SelectedSlot) => {
        const selectedCourt = masterCourts.find((c) => c.id === slot.courtId);
        const hourlyRate =
            selectedCourt?.hourly_rate != null ? Number(selectedCourt.hourly_rate) : PRICE_PER_HOUR;
        const endHour = addHours(slot.hour, 1);

        setSelectedSlots((prev) =>
            toggleCartSlot(prev, {
                courtId: slot.courtId,
                courtName: slot.courtName,
                hour: slot.hour,
                endHour,
                hourlyRate,
            })
        );
    };

    // Idempotently select a slot (used by HeroQuickSlots event & initial URL params)
    useEffect(() => {
        const ensureSlotSelected = (courtId: string, hour: string, fallbackName?: string) => {
            const selectedCourt = masterCourts.find((c) => c.id === courtId);
            if (!selectedCourt || (selectedCourt.status && selectedCourt.status !== "Available")) {
                return;
            }
            const hourIdx = hours.indexOf(hour);
            if (hourIdx === -1) return;
            const cell = grid[hourIdx]?.find((c) => c.courtId === courtId);
            if (cell && cell.status !== "available") return;

            const hourlyRate =
                selectedCourt.hourly_rate != null ? Number(selectedCourt.hourly_rate) : PRICE_PER_HOUR;
            const endHour = addHours(hour, 1);

            setMobileCourtFilter((prevFilter) =>
                prevFilter !== "all" && prevFilter !== courtId ? "all" : prevFilter
            );
            setSelectedSlots((prev) => {
                if (prev.some((s) => s.courtId === courtId && s.hour === hour)) {
                    return prev;
                }
                return toggleCartSlot(prev, {
                    courtId,
                    courtName: selectedCourt.name || fallbackName || courtId,
                    hour,
                    endHour,
                    hourlyRate,
                });
            });
        };

        if (initialSelectCourt && initialSelectHour) {
            ensureSlotSelected(initialSelectCourt, initialSelectHour);
        }

        const handleQuickSelect = (event: Event) => {
            const customEvent = event as CustomEvent<{
                courtId?: string;
                courtName?: string;
                hour?: string;
            }>;
            const detail = customEvent.detail;
            if (detail?.courtId && detail?.hour) {
                ensureSlotSelected(detail.courtId, detail.hour, detail.courtName);
            }
        };

        window.addEventListener("paddlix:select-slot", handleQuickSelect);
        return () => {
            window.removeEventListener("paddlix:select-slot", handleQuickSelect);
        };
    }, [masterCourts, hours, grid, initialSelectCourt, initialSelectHour]);

    const handleProceedCart = () => {
        if (selectedSlots.length === 0) return;

        const sorted = sortCartSlots(selectedSlots);
        const segments = convertCartToSegments(sorted);
        const total = calculateCartTotal(sorted);

        if (!isLoggedIn) {
            try {
                sessionStorage.setItem(
                    "paddlix_pending_cart",
                    JSON.stringify({
                        date,
                        slots: sorted,
                    })
                );
            } catch {
                // ignore
            }
            router.push("/login");
            return;
        }

        const serializedSegments = encodeURIComponent(JSON.stringify(segments));
        const primaryCourtName = sorted.length === 1 ? sorted[0].courtName : `Multiple Courts (${sorted.length} slots)`;
        const primaryCourtId = sorted[0].courtId;
        const timeSlot = sorted.length === 1
            ? `${formatAMPM(sorted[0].hour)} - ${formatAMPM(sorted[0].endHour)}`
            : `${formatAMPM(sorted[0].hour)} - ${formatAMPM(sorted[sorted.length - 1].endHour)} (${sorted.length} slots)`;

        const url = `/confirm-booking?courtId=${encodeURIComponent(primaryCourtId)}&courtName=${encodeURIComponent(primaryCourtName)}&timeSlot=${encodeURIComponent(timeSlot)}&rate=${total}&paymentMethod=GCash%20QR&date=${encodeURIComponent(date)}&start=${encodeURIComponent(sorted[0].hour)}&end=${encodeURIComponent(sorted[sorted.length - 1].endHour)}&duration=${sorted.length}&segments=${serializedSegments}`;
        router.push(url);
    };

    if (data.isClosed) {
        const parts = date.split("-").map(Number);
        const nextDayDate = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2] + 1));
        const nextDayISO = nextDayDate.toISOString().split("T")[0];
        const formattedDate = new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
            weekday: "long",
            month: "short",
            day: "numeric",
        });

        return (
            <div className="w-full bg-slate-900/90 rounded-2xl border border-slate-800 p-8 sm:p-12 text-center flex flex-col items-center justify-center space-y-4 shadow-xl">
                <div className="size-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shadow-inner">
                    <CalendarX className="size-8 stroke-[1.75]" />
                </div>
                <div className="space-y-1.5 max-w-md">
                    <h3 className="text-xl font-bold text-white tracking-tight">
                        Facility Closed on this Date
                    </h3>
                    <p className="text-sm text-slate-400 leading-relaxed">
                        DinkSync is marked as <strong className="text-slate-200">Closed</strong> on <strong className="text-slate-200">{formattedDate}</strong> in facility operating hours. Court reservations are unavailable for this day.
                    </p>
                </div>
                <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                    <button
                        type="button"
                        onClick={() => router.push(`/?date=${nextDayISO}#book-a-court`)}
                        className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs sm:text-sm transition-all shadow-md hover:shadow-blue-500/20 flex items-center gap-2 cursor-pointer"
                    >
                        Check Next Day ({nextDayISO}) →
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={`w-full space-y-3 ${selectedSlots.length > 0 ? "pb-28" : ""}`}>
            {/* First-time player quick onboarding guide */}
            {showGuide && (
                <div className="flex items-center justify-between p-3.5 rounded-xl border border-blue-100 dark:border-blue-900/60 bg-blue-50/70 dark:bg-blue-950/40 text-xs text-blue-950 dark:text-blue-200 transition-all shadow-xs animate-in fade-in">
                    <div className="flex items-center gap-2.5">
                        <span className="size-6 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 font-bold text-xs shadow-xs">
                            ✓
                        </span>
                        <span>
                            <strong>First time booking?</strong> Select any open green slot below to inspect court details and reserve your game in seconds.
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={dismissGuide}
                        className="text-xs text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-100 font-semibold px-2.5 py-1 rounded-md hover:bg-blue-100/60 dark:hover:bg-blue-900/50 cursor-pointer ml-2 shrink-0 transition-colors"
                    >
                        Got it
                    </button>
                </div>
            )}

            <div className="w-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                {/* Header Title & Mobile Court Switcher */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 sm:p-4 border-b border-slate-100 dark:border-slate-800 gap-3">
                    <div className="flex items-center gap-2.5">
                        <Clock className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Available Times</h2>
                    </div>

                    {/* Court Switcher (Pills on Mobile & Desktop) */}
                    <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5 sm:pb-0 pr-1">
                        <button
                            type="button"
                            onClick={() => setMobileCourtFilter("all")}
                            style={{ touchAction: "manipulation" }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                                mobileCourtFilter === "all"
                                    ? "bg-blue-600 text-white shadow-xs"
                                    : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                            }`}
                        >
                            All Courts
                        </button>
                        {masterCourts.map((c) => (
                            <button
                                key={c.id}
                                type="button"
                                onClick={() => setMobileCourtFilter(c.id)}
                                style={{ touchAction: "manipulation" }}
                                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                                    mobileCourtFilter === c.id
                                        ? "bg-blue-600 text-white shadow-xs"
                                        : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                                }`}
                            >
                                {c.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Mobile horizontal swipe helper hint */}
                {mobileCourtFilter === "all" && (
                    <div className="sm:hidden px-3.5 py-1.5 bg-blue-50/60 dark:bg-blue-950/30 text-xs text-blue-700 dark:text-blue-300 flex items-center justify-between border-b border-blue-100/60 dark:border-blue-900/40">
                        <span>Swipe sideways to view Courts 1–4</span>
                        <span aria-hidden="true">👉</span>
                    </div>
                )}

            {/* Grid */}
            <div className="relative overflow-x-auto w-full">
                <div className={activeCourts.length === 1 ? "w-full min-w-0" : "min-w-[665px] sm:min-w-[700px]"}>
                    {/* Court headers */}
                    <div className={`grid ${activeCourts.length === 1 ? "grid-cols-[115px_1fr] sm:grid-cols-[180px_1fr]" : "grid-cols-[105px_repeat(4,minmax(140px,1fr))] sm:grid-cols-[170px_repeat(4,1fr)]"} border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900`}>
                        <div className="sticky left-0 z-20 py-3 sm:py-4 px-2 text-center text-xs sm:text-sm font-bold text-gray-500 dark:text-slate-400 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-center shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)] dark:shadow-[2px_0_4px_-1px_rgba(0,0,0,0.3)]">
                            Time
                        </div>
                        {activeCourts.map((court) => {
                            const isNotAvailable = court.status && court.status !== "Available";
                            return (
                                <div
                                    key={court.id}
                                    className={`py-3 sm:py-4 px-2 text-center text-xs sm:text-sm font-bold uppercase tracking-wider border-r last:border-r-0 border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center ${
                                        isNotAvailable
                                            ? "opacity-60 bg-gray-100 dark:bg-slate-800/80 text-gray-500 dark:text-slate-400"
                                            : "bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                                    }`}
                                >
                                    <div>{court.name}</div>
                                    {court.hourly_rate != null && (
                                        <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 normal-case tabular-nums">
                                            ₱{court.hourly_rate}/hr
                                        </span>
                                    )}
                                    {court.status === "Maintenance" && (
                                        <span className="inline-block mt-1 text-xs font-semibold tracking-normal normal-case text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded-full">
                                            Maintenance
                                        </span>
                                    )}
                                    {court.status === "Not Available" && (
                                        <span className="inline-block mt-1 text-xs font-semibold tracking-normal normal-case text-gray-700 dark:text-slate-300 bg-gray-200 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 px-2 py-0.5 rounded-full">
                                            Unavailable
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Time rows */}
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {hours.map((hour, hourIdx) => {
                            const hourNum = parseInt(hour.split(":")[0], 10);
                            const nextHourNum = (hourNum + 1) % 24;
                            const nextHour = `${nextHourNum.toString().padStart(2, "0")}:00`;

                            return (
                                <div
                                    key={hour}
                                    className={`grid ${activeCourts.length === 1 ? "grid-cols-[115px_1fr] sm:grid-cols-[180px_1fr]" : "grid-cols-[105px_repeat(4,minmax(140px,1fr))] sm:grid-cols-[170px_repeat(4,1fr)]"} min-h-[58px]`}
                                >
                                    {/* Sticky Time label */}
                                    <div className="sticky left-0 z-10 px-1 sm:px-2 py-3 sm:py-4 text-center flex flex-col sm:flex-row items-center justify-center border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)] dark:shadow-[2px_0_4px_-1px_rgba(0,0,0,0.3)]">
                                        <span className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white whitespace-nowrap tabular-nums">
                                            {formatAMPM(hour)}
                                        </span>
                                        <span className="text-xs text-slate-400 sm:text-gray-900 dark:text-slate-500 sm:dark:text-white sm:mx-1 leading-none sm:leading-normal my-0.5 sm:my-0">
                                            –
                                        </span>
                                        <span className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white whitespace-nowrap tabular-nums">
                                            {formatAMPM(nextHour)}
                                        </span>
                                    </div>

                                    {/* Court cells */}
                                    {activeCourts.map((court) => {
                                        const fallbackStatus: GridCell["status"] =
                                            court.status === "Maintenance"
                                                ? "maintenance"
                                                : court.status === "Not Available"
                                                ? "not_available"
                                                : "available";
                                        const cell = grid[hourIdx]?.find((c) => c.courtId === court.id) || {
                                            courtId: court.id,
                                            courtName: court.name,
                                            hour,
                                            status: fallbackStatus,
                                            isPeak: false,
                                        };

                                        const isSelected = selectedSlots.some(
                                            (s) => s.courtId === court.id && s.hour === hour
                                        );

                                        return (
                                            <div
                                                key={court.id}
                                                className="p-1.5 border-r last:border-r-0 border-slate-100 dark:border-slate-800 flex items-center justify-center bg-white dark:bg-slate-900 min-w-0"
                                            >
                                                <CellContent
                                                    cell={cell}
                                                    courtName={court.name}
                                                    courtStatus={court.status}
                                                    isSelected={isSelected}
                                                    onSelectSlot={handleToggleSlot}
                                                    isLoggedIn={isLoggedIn}
                                                    router={router}
                                                />
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

            {/* Floating Cart Bar */}
            {selectedSlots.length > 0 && (
                <div
                    className="fixed bottom-0 left-0 right-0 z-40 flex justify-center pointer-events-none px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] sm:pb-4"
                    style={{ animation: "slideUp 250ms ease-out" }}
                >
                    <div className="w-full max-w-2xl pointer-events-auto rounded-2xl border border-blue-200/70 dark:border-blue-900/80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-2xl ring-1 ring-blue-500/10 dark:ring-blue-400/10 overflow-hidden">
                        {/* Slot Pills */}
                        <div className="px-3 sm:px-4 pt-2.5 pb-2 flex items-center gap-1.5 overflow-x-auto scrollbar-none border-b border-slate-100 dark:border-slate-800">
                            {sortedSlots.map((slot) => (
                                <span
                                    key={`${slot.courtId}-${slot.hour}`}
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-600 text-white shadow-xs shrink-0"
                                >
                                    {slot.courtName}
                                    <span className="opacity-80">
                                        {formatAMPM(slot.hour)}–{formatAMPM(slot.endHour)}
                                    </span>
                                    <button
                                        type="button"
                                        aria-label={`Remove ${slot.courtName}`}
                                        onClick={() =>
                                            setSelectedSlots((prev) =>
                                                prev.filter(
                                                    (s) => !(s.courtId === slot.courtId && s.hour === slot.hour)
                                                )
                                            )
                                        }
                                        className="ml-0.5 rounded-full p-0.5 hover:bg-white/20 transition-colors cursor-pointer"
                                    >
                                        <svg className="size-2.5" viewBox="0 0 10 10" fill="none">
                                            <path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                                        </svg>
                                    </button>
                                </span>
                            ))}
                        </div>

                        {/* Summary Row */}
                        <div className="px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-3">
                            {/* Slot count + total + 4-player split */}
                            <div className="flex flex-col sm:flex-row sm:items-baseline gap-0.5 sm:gap-2 min-w-0">
                                <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                                    {selectedSlots.length} {selectedSlots.length === 1 ? "Slot" : "Slots"}
                                </span>
                                <div className="flex items-baseline gap-2 flex-wrap">
                                    <span className="text-base sm:text-lg font-bold text-blue-600 dark:text-blue-400 tabular-nums">
                                        ₱{cartTotal.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                                    </span>
                                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400 tabular-nums">
                                        (₱{Math.ceil(cartTotal / 4).toLocaleString("en-PH")}/player for 4)
                                    </span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setSelectedSlots([])}
                                    className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 transition-colors cursor-pointer"
                                    title="Clear all selected slots"
                                    aria-label="Clear all slots"
                                >
                                    <Trash2 className="size-4" />
                                </button>

                                <button
                                    type="button"
                                    onClick={handleProceedCart}
                                    className="flex items-center gap-1 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs sm:text-sm font-semibold transition-colors shadow-sm cursor-pointer whitespace-nowrap"
                                >
                                    <span>Review & Book</span>
                                    <span className="hidden xs:inline">({selectedSlots.length})</span>
                                    <ChevronRight className="size-3.5 sm:size-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Bottom sheet animations */}
            <style>{`
                @keyframes scaleIn {
                    from {
                        opacity: 0;
                        transform: scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1);
                    }
                }
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                    }
                    to {
                        opacity: 1;
                    }
                }
                @keyframes slideUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
        </div>
    );
}

function CellContent({
    cell,
    courtName,
    courtStatus,
    isSelected = false,
    onSelectSlot,
    isLoggedIn,
    router,
}: {
    cell: BookingGridData["grid"][0][0];
    courtName: string;
    courtStatus?: string;
    isSelected?: boolean;
    onSelectSlot: (slot: SelectedSlot) => void;
    isLoggedIn: boolean;
    router: ReturnType<typeof useRouter>;
}) {
    // Priority: court-level Maintenance / Not Available status takes precedence
    const effectiveStatus =
        courtStatus === "Maintenance" || cell.status === "maintenance"
            ? "maintenance"
            : courtStatus === "Not Available" || cell.status === "not_available"
            ? "not_available"
            : cell.status;

    switch (effectiveStatus) {
        case "passed":
            return (
                <div
                    className="w-full h-full min-h-[44px] rounded-[14px] bg-slate-50 dark:bg-slate-800/40 flex items-center justify-center py-2"
                >
                    <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase">Passed</span>
                </div>
            );

        case "booked":
            return (
                <div
                    className="w-full h-full min-h-[44px] rounded-[14px] bg-slate-100 dark:bg-slate-800/70 flex flex-col items-center justify-center gap-0.5 py-2"
                >
                    <Lock className="size-3.5 text-slate-400 dark:text-slate-500" />
                    <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase">
                        Booked
                    </span>
                </div>
            );

        case "fulfilled":
            return (
                <div
                    className="w-full h-full min-h-[44px] rounded-[14px] bg-slate-100 dark:bg-slate-800/70 flex flex-col items-center justify-center gap-0.5 py-2"
                >
                    <CheckCircle2 className="size-3.5 text-slate-400 dark:text-slate-500" />
                    <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase">
                        Fulfilled
                    </span>
                </div>
            );

        case "available":
            return (
                <button
                    type="button"
                    onClick={() => {
                        onSelectSlot({
                            courtId: cell.courtId,
                            courtName,
                            hour: cell.hour,
                        });
                    }}
                    className={`w-full h-full min-h-[44px] rounded-[14px] py-2 flex items-center justify-center transition-all duration-200 cursor-pointer ${
                        isSelected
                            ? "bg-blue-600 dark:bg-blue-600 text-white border-2 border-blue-600 dark:border-blue-500 shadow-xs"
                            : "bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 hover:bg-blue-500 dark:hover:bg-blue-600 hover:border-blue-500 dark:hover:border-blue-600 group/cell"
                    }`}
                >
                    {isSelected ? (
                        <div className="flex items-center gap-1.5 text-xs font-bold text-white animate-in zoom-in-95 duration-150">
                            <Check className="size-3.5 stroke-[3]" />
                            <span>Selected</span>
                        </div>
                    ) : (
                        <span className="text-sm font-semibold text-blue-600 dark:text-blue-400 capitalize group-hover/cell:text-white transition-colors duration-200">
                            Available
                        </span>
                    )}
                </button>
            );

        case "closed":
            return (
                <div
                    className="w-full h-full min-h-[44px] rounded-[14px] bg-slate-50 dark:bg-slate-800/40 flex items-center justify-center py-2"
                >
                    <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase">Closed</span>
                </div>
            );

        case "maintenance":
            return (
                <div
                    className="w-full h-full min-h-[44px] rounded-[14px] bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex flex-col items-center justify-center cursor-not-allowed py-2 text-center"
                >
                    <span className="text-xs font-semibold text-amber-800 dark:text-amber-300">Maintenance</span>
                </div>
            );

        case "not_available":
            return (
                <div
                    className="w-full h-full min-h-[44px] rounded-[14px] opacity-60 bg-gray-200 dark:bg-slate-800/80 border border-gray-300 dark:border-slate-700 flex flex-col items-center justify-center cursor-not-allowed py-2 text-center"
                >
                    <span className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Not Available</span>
                </div>
            );
    }
}

function addHours(time: string, hours: number): string {
    const h = (parseInt(time.split(":")[0], 10) + hours) % 24;
    return `${h.toString().padStart(2, "0")}:00`;
}
