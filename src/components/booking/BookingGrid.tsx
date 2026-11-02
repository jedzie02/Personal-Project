"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Lock, CheckCircle2, Clock, ChevronRight, Check, Trash2 } from "lucide-react";
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

export default function BookingGrid({ data }: { data: BookingGridData }) {
    const router = useRouter();
    const { courts, hours, grid, date } = data;
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [selectedSlots, setSelectedSlots] = useState<SelectedGridSlot[]>([]);

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


    return (
        <div className={`w-full space-y-3 ${selectedSlots.length > 0 ? "pb-28" : ""}`}>
            {/* First-time player quick onboarding guide */}
            {showGuide && (
                <div className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-muted/70 text-xs text-foreground transition-all shadow-2xs animate-in fade-in">
                    <div className="flex items-center gap-2.5">
                        <span className="size-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 font-bold text-xs shadow-2xs">
                            ✓
                        </span>
                        <span>
                            <strong>First time booking?</strong> Select any open slot below to inspect court details and reserve your game in seconds.
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={dismissGuide}
                        className="text-xs text-muted-foreground hover:text-foreground font-medium px-2.5 py-1 rounded-md hover:bg-muted cursor-pointer ml-2 shrink-0 transition-colors"
                    >
                        Got it
                    </button>
                </div>
            )}

            <div className="w-full bg-card rounded-2xl border border-border overflow-hidden">
                {/* Header Title */}
                <div className="flex items-center gap-3 p-4 border-b border-border">
                    <Clock className="w-5 h-5 text-muted-foreground" />
                    <h2 className="text-lg font-bold text-foreground">Available Times</h2>
                </div>

            {/* Grid */}
            <div className="relative overflow-x-auto w-full">
                <div className="min-w-[700px]">
                    {/* Court headers */}
                    <div className="grid grid-cols-[175px_repeat(4,1fr)] border-b border-border bg-card">
                        <div className="py-4 px-2 text-center text-sm font-semibold text-muted-foreground border-r border-border flex items-center justify-center">
                            Time
                        </div>
                        {masterCourts.map((court) => {
                            const isNotAvailable = court.status && court.status !== "Available";
                            return (
                                <div
                                    key={court.id}
                                    className={`py-4 px-2 text-center text-sm font-bold uppercase tracking-wider border-r last:border-r-0 border-border flex flex-col items-center justify-center ${
                                        isNotAvailable
                                            ? "opacity-60 bg-muted/60 text-muted-foreground"
                                            : "bg-card text-foreground"
                                    }`}
                                >
                                    <div>{court.name}</div>
                                    {court.hourly_rate != null && (
                                        <span className="text-xs font-semibold text-foreground normal-case tabular-nums">
                                            ₱{court.hourly_rate}/hr
                                        </span>
                                    )}
                                    {court.status === "Maintenance" && (
                                        <span className="inline-block mt-1 text-xs font-semibold tracking-normal normal-case text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full">
                                            Currently in Maintenance
                                        </span>
                                    )}
                                    {court.status === "Not Available" && (
                                        <span className="inline-block mt-1 text-xs font-semibold tracking-normal normal-case text-muted-foreground bg-muted border border-border px-2 py-0.5 rounded-full">
                                            Not Available
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Time rows */}
                    <div className="divide-y divide-border">
                        {hours.map((hour, hourIdx) => {
                            const hourNum = parseInt(hour.split(":")[0], 10);
                            const nextHourNum = (hourNum + 1) % 24;
                            const nextHour = `${nextHourNum.toString().padStart(2, "0")}:00`;

                            return (
                                <div
                                    key={hour}
                                    className="grid grid-cols-[175px_repeat(4,1fr)] min-h-[58px]"
                                >
                                    {/* Time label */}
                                    <div className="px-2 py-4 text-center flex items-center justify-center border-r border-border bg-card">
                                        <span className="text-sm font-bold text-foreground whitespace-nowrap tabular-nums">
                                            {formatAMPM(hour)} – {formatAMPM(nextHour)}
                                        </span>
                                    </div>

                                    {/* Court cells: strictly one container div per court */}
                                    {masterCourts.map((court) => {
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
                                                className="p-1.5 border-r last:border-r-0 border-border flex items-center justify-center bg-card min-w-0"
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
                    className="fixed bottom-0 left-0 right-0 z-40 flex justify-center pointer-events-none"
                    style={{ animation: "slideUp 250ms ease-out" }}
                >
                    <div className="w-full max-w-2xl mx-4 mb-4 pointer-events-auto rounded-2xl border border-border bg-card/95 backdrop-blur-md shadow-2xl ring-1 ring-border/50 overflow-hidden">
                        {/* Slot Pills */}
                        <div className="px-4 pt-3 pb-2 flex flex-wrap gap-1.5 border-b border-border">
                            {sortedSlots.map((slot) => (
                                <span
                                    key={`${slot.courtId}-${slot.hour}`}
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-primary text-primary-foreground shadow-2xs"
                                >
                                    <span className="size-1.5 rounded-full bg-accent-court shrink-0" />
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
                                        className="ml-0.5 rounded-full p-0.5 hover:bg-primary-foreground/20 transition-colors cursor-pointer"
                                    >
                                        <svg className="size-2.5" viewBox="0 0 10 10" fill="none">
                                            <path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                                        </svg>
                                    </button>
                                </span>
                            ))}
                        </div>

                        {/* Summary Row */}
                        <div className="px-4 py-3 flex items-center gap-3">
                            {/* Slot count + total */}
                            <div className="flex-1 min-w-0">
                                <span className="text-sm font-bold text-foreground">
                                    {selectedSlots.length} {selectedSlots.length === 1 ? "Slot" : "Slots"} Selected
                                </span>
                                <span className="ml-2 text-xs text-muted-foreground">
                                    ₱300/slot
                                </span>
                            </div>

                            {/* Total price */}
                            <span className="text-lg font-bold text-foreground tabular-nums shrink-0">
                                ₱{cartTotal.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                            </span>

                            {/* Clear button */}
                            <button
                                type="button"
                                onClick={() => setSelectedSlots([])}
                                className="shrink-0 p-2 rounded-xl border border-border bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer"
                                title="Clear all selected slots"
                            >
                                <Trash2 className="size-4" />
                            </button>

                            {/* Book CTA */}
                            <button
                                type="button"
                                onClick={handleProceedCart}
                                className="shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/90 active:bg-primary/80 text-primary-foreground text-sm font-semibold transition-colors shadow-sm cursor-pointer"
                            >
                                Review & Book ({selectedSlots.length})
                                <ChevronRight className="size-4" />
                            </button>
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
                    className="w-full h-full min-h-[44px] rounded-[14px] bg-muted/40 flex items-center justify-center py-2"
                >
                    <span className="text-xs font-semibold text-muted-foreground uppercase">Passed</span>
                </div>
            );

        case "booked":
            return (
                <div
                    className="w-full h-full min-h-[44px] rounded-[14px] bg-muted/60 flex flex-col items-center justify-center gap-0.5 py-2"
                >
                    <Lock className="size-3.5 text-muted-foreground" />
                    <span className="text-xs font-semibold text-muted-foreground uppercase">
                        Booked
                    </span>
                </div>
            );

        case "fulfilled":
            return (
                <div
                    className="w-full h-full min-h-[44px] rounded-[14px] bg-muted/60 flex flex-col items-center justify-center gap-0.5 py-2"
                >
                    <CheckCircle2 className="size-3.5 text-muted-foreground" />
                    <span className="text-xs font-semibold text-muted-foreground uppercase">
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
                    className={`w-full h-full min-h-[44px] rounded-[14px] py-2 flex items-center justify-center transition-all duration-150 cursor-pointer ${
                        isSelected
                            ? "bg-primary text-primary-foreground border-2 border-primary shadow-xs"
                            : "bg-card border border-border hover:bg-muted hover:border-foreground/30 group/cell"
                    }`}
                >
                    {isSelected ? (
                        <div className="flex items-center gap-1.5 text-xs font-bold animate-in zoom-in-95 duration-150">
                            <Check className="size-3.5 stroke-[3] text-accent-court" />
                            <span>Selected</span>
                        </div>
                    ) : (
                        <span className="text-xs font-semibold text-muted-foreground group-hover/cell:text-foreground transition-colors duration-150 capitalize">
                            Available
                        </span>
                    )}
                </button>
            );

        case "closed":
            return (
                <div
                    className="w-full h-full min-h-[44px] rounded-[14px] bg-muted/40 flex items-center justify-center py-2"
                >
                    <span className="text-xs font-semibold text-muted-foreground uppercase">Closed</span>
                </div>
            );

        case "maintenance":
            return (
                <div
                    className="w-full h-full min-h-[44px] rounded-[14px] bg-amber-500/10 border border-amber-500/30 flex flex-col items-center justify-center cursor-not-allowed py-2 text-center"
                >
                    <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">Maintenance</span>
                </div>
            );

        case "not_available":
            return (
                <div
                    className="w-full h-full min-h-[44px] rounded-[14px] opacity-60 bg-muted border border-border flex flex-col items-center justify-center cursor-not-allowed py-2 text-center"
                >
                    <span className="text-xs font-semibold text-muted-foreground uppercase">Not Available</span>
                </div>
            );
    }
}

function addHours(time: string, hours: number): string {
    const h = (parseInt(time.split(":")[0], 10) + hours) % 24;
    return `${h.toString().padStart(2, "0")}:00`;
}
