"use client";

import { useState, useEffect, useMemo, useActionState } from "react";
import { useRouter } from "next/navigation";
import { Lock, CheckCircle2, Clock, Calendar, MapPin, DollarSign, CalendarCheck, ChevronRight, Loader2, ShieldCheck } from "lucide-react";
import type { BookingGridData, GridCell } from "@/lib/services/booking-grid.service";
import { PRICE_PER_HOUR } from "@/lib/config/booking-rules";
import { confirmBookingAction } from "@/app/book/actions";
import { supabase } from "@/lib/supabase";

interface SelectedSlot {
    courtId: string;
    courtName: string;
    hour: string;
}

type ModalStep = "preview" | "confirm";

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
    { id: "court-1", name: "Court 1", status: "Available", hourly_rate: 25 },
    { id: "court-2", name: "Court 2", status: "Available", hourly_rate: 25 },
    { id: "court-3", name: "Court 3", status: "Available", hourly_rate: 25 },
    { id: "court-4", name: "Court 4", status: "Available", hourly_rate: 25 },
];

export default function BookingGrid({ data }: { data: BookingGridData }) {
    const router = useRouter();
    const { courts, hours, grid, date } = data;
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState<SelectedSlot | null>(null);
    const [modalStep, setModalStep] = useState<ModalStep>("preview");

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

    // 1. First-time booking guide banner state
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

    // 2. Restore pending slot if user just returned from signup / login
    useEffect(() => {
        try {
            const saved = sessionStorage.getItem("paddlix_pending_slot");
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed.date === date && parsed.courtId && parsed.hour) {
                    setSelectedSlot({
                        courtId: parsed.courtId,
                        courtName: parsed.courtName,
                        hour: parsed.hour,
                    });
                    setModalStep("preview");
                }
                sessionStorage.removeItem("paddlix_pending_slot");
            }
        } catch {
            // Ignore sessionStorage parse errors
        }
    }, [date]);

    // Open slot preview directly without abrupt redirection
    const handleSelectSlot = (slot: SelectedSlot) => {
        setSelectedSlot(slot);
        setModalStep("preview");
    };

    const handleClose = () => {
        setSelectedSlot(null);
        setModalStep("preview");
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                handleClose();
            }
        };

        if (selectedSlot) {
            document.body.style.overflow = "hidden";
            window.addEventListener("keydown", handleKeyDown);
        } else {
            document.body.style.overflow = "";
        }

        return () => {
            document.body.style.overflow = "";
            window.removeEventListener("keydown", handleKeyDown);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedSlot]);

    const endTime = selectedSlot ? addHours(selectedSlot.hour, 1) : "";
    const selectedCourt = masterCourts.find((c) => c.id === selectedSlot?.courtId);
    const hourlyRate = selectedCourt?.hourly_rate != null ? Number(selectedCourt.hourly_rate) : PRICE_PER_HOUR;
    const totalPrice = hourlyRate; // 1 hour × live hourly_rate

    return (
        <div className="w-full space-y-3">
            {/* First-time player quick onboarding guide */}
            {showGuide && (
                <div className="flex items-center justify-between p-3.5 rounded-xl border border-blue-100 bg-blue-50/70 text-xs text-blue-950 transition-all shadow-xs animate-in fade-in">
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
                        className="text-xs text-blue-700 hover:text-blue-900 font-semibold px-2.5 py-1 rounded-md hover:bg-blue-100/60 cursor-pointer ml-2 shrink-0 transition-colors"
                    >
                        Got it
                    </button>
                </div>
            )}

            <div className="w-full bg-white rounded-2xl border border-slate-200 overflow-hidden">
                {/* Header Title */}
                <div className="flex items-center gap-3 p-4 border-b border-slate-100">
                    <Clock className="w-5 h-5 text-blue-500" />
                    <h2 className="text-lg font-bold text-gray-900">Available Times</h2>
                </div>

            {/* Grid */}
            <div className="relative overflow-x-auto w-full">
                <div className="min-w-[700px]">
                    {/* Court headers */}
                    <div className="grid grid-cols-[175px_repeat(4,1fr)] border-b border-slate-100 bg-white">
                        <div className="py-4 px-2 text-center text-sm font-semibold text-gray-500 border-r border-slate-100 flex items-center justify-center">
                            Time
                        </div>
                        {masterCourts.map((court) => {
                            const isNotAvailable = court.status && court.status !== "Available";
                            return (
                                <div
                                    key={court.id}
                                    className={`py-4 px-2 text-center text-sm font-bold uppercase tracking-wider border-r last:border-r-0 border-slate-100 flex flex-col items-center justify-center ${
                                        isNotAvailable
                                            ? "opacity-60 bg-gray-100 text-gray-500"
                                            : "bg-white text-gray-900"
                                    }`}
                                >
                                    <div>{court.name}</div>
                                    {court.hourly_rate != null && (
                                        <span className="text-xs font-semibold text-blue-600 normal-case">
                                            ₱{court.hourly_rate}/hr
                                        </span>
                                    )}
                                    {court.status === "Maintenance" && (
                                        <span className="inline-block mt-1 text-xs font-semibold tracking-normal normal-case text-amber-800 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-full">
                                            Currently in Maintenance
                                        </span>
                                    )}
                                    {court.status === "Not Available" && (
                                        <span className="inline-block mt-1 text-xs font-semibold tracking-normal normal-case text-gray-700 bg-gray-200 border border-gray-300 px-2 py-0.5 rounded-full">
                                            Not Available
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Time rows */}
                    <div className="divide-y divide-slate-100">
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
                                    <div className="px-2 py-4 text-center flex items-center justify-center border-r border-slate-100 bg-white">
                                        <span className="text-sm font-bold text-gray-900 whitespace-nowrap">
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

                                        return (
                                            <div
                                                key={court.id}
                                                className="p-1.5 border-r last:border-r-0 border-slate-100 flex items-center justify-center bg-white min-w-0"
                                            >
                                                <CellContent
                                                    cell={cell}
                                                    courtName={court.name}
                                                    courtStatus={court.status}
                                                    onSelectSlot={handleSelectSlot}
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

            {/* Bottom Sheet Modal */}
            {selectedSlot && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
                    onClick={handleClose}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="available-slot-modal-title"
                    style={{ animation: "fadeIn 200ms ease-out" }}
                >
                    <div
                        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                        style={{ animation: "scaleIn 200ms ease-out" }}
                    >

                        {/* Step 1: Preview */}
                        {modalStep === "preview" && (
                            <div className="px-6 pb-6 pt-6 flex flex-col items-center text-center" style={{ animation: "fadeIn 200ms ease-out" }}>
                                {/* Top Icon Badge */}
                                <div className="flex items-center justify-center w-14 h-14 rounded-full bg-blue-50 text-blue-600 mb-4 border border-blue-100 shadow-xs">
                                    <CalendarCheck className="w-7 h-7" />
                                </div>

                                {/* Modal Header */}
                                <h3 id="available-slot-modal-title" className="text-xl font-bold text-gray-900">
                                    Court Slot Available
                                </h3>
                                <p className="text-sm text-gray-500 mt-1 max-w-xs">
                                    This court slot is available for booking. Review your court details below.
                                </p>

                                {/* Slot Details Card */}
                                <div className="w-full mt-5 rounded-xl border border-slate-100 bg-slate-50/80 p-4 text-left divide-y divide-slate-100">
                                    <div className="flex items-center justify-between pb-2.5">
                                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                                            <MapPin className="w-3.5 h-3.5 text-blue-500" /> Court
                                        </span>
                                        <span className="text-sm font-bold text-gray-900">
                                            {selectedSlot.courtName}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between py-2.5">
                                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                                            <Calendar className="w-3.5 h-3.5 text-blue-500" /> Date
                                        </span>
                                        <span className="text-sm font-semibold text-gray-900">
                                            {formatDate(date)}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between py-2.5">
                                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                                            <Clock className="w-3.5 h-3.5 text-blue-500" /> Time
                                        </span>
                                        <span className="text-sm font-semibold text-gray-900">
                                            {formatAMPM(selectedSlot.hour)} – {formatAMPM(endTime)}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between pt-2.5">
                                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                                            <DollarSign className="w-3.5 h-3.5 text-blue-500" /> Rate
                                        </span>
                                        <span className="text-sm font-bold text-blue-600">
                                            ₱{hourlyRate.toFixed(2)}
                                        </span>
                                    </div>
                                </div>

                                {/* Actions / Onboarding step */}
                                {!isLoggedIn ? (
                                    <div className="w-full mt-5 p-4 rounded-xl border border-blue-100 bg-blue-50/70 text-center space-y-2.5">
                                        <p className="text-xs text-blue-900 font-medium">
                                            Sign up or log in to secure this court reservation.
                                        </p>
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    try {
                                                        sessionStorage.setItem(
                                                            "paddlix_pending_slot",
                                                            JSON.stringify({
                                                                courtId: selectedSlot.courtId,
                                                                courtName: selectedSlot.courtName,
                                                                hour: selectedSlot.hour,
                                                                date,
                                                            })
                                                        );
                                                    } catch {
                                                        // Ignore
                                                    }
                                                    router.push("/signup");
                                                }}
                                                className="flex-1 py-2.5 px-3 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors shadow-xs cursor-pointer"
                                            >
                                                Sign Up to Book
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    try {
                                                        sessionStorage.setItem(
                                                            "paddlix_pending_slot",
                                                            JSON.stringify({
                                                                courtId: selectedSlot.courtId,
                                                                courtName: selectedSlot.courtName,
                                                                hour: selectedSlot.hour,
                                                                date,
                                                            })
                                                        );
                                                    } catch {
                                                        // Ignore
                                                    }
                                                    router.push("/login");
                                                }}
                                                className="py-2.5 px-3 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
                                            >
                                                Log In
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center gap-3 w-full mt-6">
                                        <button
                                            type="button"
                                            onClick={handleClose}
                                            className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition-colors shadow-xs cursor-pointer"
                                        >
                                            Back
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setModalStep("confirm")}
                                            className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-sm text-center cursor-pointer flex items-center justify-center gap-1.5"
                                        >
                                            Book Slot
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Step 2: Confirm */}
                        {modalStep === "confirm" && (
                            <ConfirmStep
                                courtId={selectedSlot.courtId}
                                courtName={selectedSlot.courtName}
                                date={date}
                                startTime={selectedSlot.hour}
                                endTime={endTime}
                                totalPrice={totalPrice}
                                onBack={() => setModalStep("preview")}
                                onClose={handleClose}
                            />
                        )}
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
            `}</style>
        </div>
    );
}

/** Step 2 of the bottom sheet — review & confirm booking via server action. */
function ConfirmStep({
    courtId,
    courtName,
    date,
    startTime,
    endTime,
    totalPrice,
    onBack,
    onClose,
}: {
    courtId: string;
    courtName: string;
    date: string;
    startTime: string;
    endTime: string;
    totalPrice: number;
    onBack: () => void;
    onClose: () => void;
}) {
    const [state, formAction, isPending] = useActionState(confirmBookingAction, undefined);

    // If the action redirected (e.g. to login or payment), the component
    // unmounts automatically. We only need to handle the visual state here.

    return (
        <div className="px-6 pb-8 pt-3 flex flex-col items-center text-center" style={{ animation: "fadeIn 200ms ease-out" }}>
            {/* Top Icon Badge */}
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 mb-4 border border-emerald-100 shadow-xs">
                <ShieldCheck className="w-7 h-7" />
            </div>

            {/* Header */}
            <h3 className="text-xl font-bold text-gray-900">
                Confirm Your Booking
            </h3>
            <p className="text-sm text-gray-500 mt-1 max-w-xs">
                You&apos;re about to book this court. Please review the summary and confirm.
            </p>

            {/* Summary Card */}
            <div className="w-full mt-5 rounded-xl border border-slate-100 bg-slate-50/80 p-4 text-left space-y-2">
                <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Court</span>
                    <span className="font-semibold text-gray-900">{courtName}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Date</span>
                    <span className="font-semibold text-gray-900">{formatDate(date)}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Time</span>
                    <span className="font-semibold text-gray-900">{formatAMPM(startTime)} – {formatAMPM(endTime)}</span>
                </div>
                <div className="flex justify-between text-sm border-t border-slate-200 pt-2 mt-2">
                    <span className="font-semibold text-gray-900">Total</span>
                    <span className="font-bold text-blue-600">₱{totalPrice.toFixed(2)}</span>
                </div>
            </div>

            {/* Confirm Form */}
            <form action={formAction} className="w-full mt-6">
                <input type="hidden" name="courtId" value={courtId} />
                <input type="hidden" name="date" value={date} />
                <input type="hidden" name="start" value={startTime} />
                <input type="hidden" name="end" value={endTime} />
                <input type="hidden" name="totalPrice" value={totalPrice} />

                <div className="flex items-center justify-center gap-3 w-full">
                    <button
                        type="button"
                        onClick={onBack}
                        disabled={isPending}
                        className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition-colors shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Back
                    </button>
                    <button
                        type="submit"
                        disabled={isPending}
                        className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 text-sm font-semibold text-white hover:bg-emerald-700 active:bg-emerald-800 transition-colors shadow-sm text-center cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Booking…
                            </>
                        ) : (
                            "Confirm Booking"
                        )}
                    </button>
                </div>
            </form>

            <p className="mt-3 text-xs text-slate-400">
                Confirming reserves your court slot immediately. Payment can be settled at the venue.
            </p>
        </div>
    );
}

function CellContent({
    cell,
    courtName,
    courtStatus,
    onSelectSlot,
    isLoggedIn,
    router,
}: {
    cell: BookingGridData["grid"][0][0];
    courtName: string;
    courtStatus?: string;
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
                    className="w-full h-full min-h-[44px] rounded-[14px] bg-slate-50 flex items-center justify-center py-2"
                >
                    <span className="text-xs font-semibold text-slate-400 uppercase">Passed</span>
                </div>
            );

        case "booked":
            return (
                <div
                    className="w-full h-full min-h-[44px] rounded-[14px] bg-slate-100 flex flex-col items-center justify-center gap-0.5 py-2"
                >
                    <Lock className="size-3.5 text-slate-400" />
                    <span className="text-xs font-semibold text-slate-400 uppercase">
                        Booked
                    </span>
                </div>
            );

        case "fulfilled":
            return (
                <div
                    className="w-full h-full min-h-[44px] rounded-[14px] bg-slate-100 flex flex-col items-center justify-center gap-0.5 py-2"
                >
                    <CheckCircle2 className="size-3.5 text-slate-400" />
                    <span className="text-xs font-semibold text-slate-400 uppercase">
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
                    className="w-full h-full min-h-[44px] rounded-[14px] py-2 bg-blue-50/50 border border-blue-200 hover:bg-blue-500 hover:border-blue-500 flex items-center justify-center transition-all duration-200 group/cell cursor-pointer"
                >
                    <span className="text-sm font-semibold text-blue-600 capitalize group-hover/cell:text-white transition-colors duration-200">
                        Available
                    </span>
                </button>
            );

        case "closed":
            return (
                <div
                    className="w-full h-full min-h-[44px] rounded-[14px] bg-slate-50 flex items-center justify-center py-2"
                >
                    <span className="text-xs font-semibold text-slate-400 uppercase">Closed</span>
                </div>
            );

        case "maintenance":
            return (
                <div
                    className="w-full h-full min-h-[44px] rounded-[14px] bg-amber-50 border border-amber-200 flex flex-col items-center justify-center cursor-not-allowed py-2 text-center"
                >
                    <span className="text-xs font-semibold text-amber-800">Maintenance</span>
                </div>
            );

        case "not_available":
            return (
                <div
                    className="w-full h-full min-h-[44px] rounded-[14px] opacity-60 bg-gray-200 border border-gray-300 flex flex-col items-center justify-center cursor-not-allowed py-2 text-center"
                >
                    <span className="text-xs font-semibold text-gray-500 uppercase">Not Available</span>
                </div>
            );
    }
}

function addHours(time: string, hours: number): string {
    const h = (parseInt(time.split(":")[0], 10) + hours) % 24;
    return `${h.toString().padStart(2, "0")}:00`;
}
