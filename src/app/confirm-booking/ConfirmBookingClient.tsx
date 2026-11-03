"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
    MapPin,
    Calendar,
    Clock,
    CreditCard,
    QrCode,
    Banknote,
    Receipt,
    ShieldCheck,
    Loader2,
    ArrowLeft,
    AlertCircle,
    User,
    ArrowRightLeft,
    Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { formatTime } from "@/lib/utils/date";
import type { BookingSegment } from "@/lib/utils/court-jump";
import { submitConfirmBooking } from "./actions";
import { startCardCheckoutAction } from "./checkout-actions";

type PaymentMethodChoice = "GCash QR" | "Cash walk in" | "Credit Card";

const PAYMENT_OPTIONS: { id: PaymentMethodChoice; label: string; sublabel: string; icon: typeof QrCode }[] = [
    { id: "GCash QR", label: "GCash QR", sublabel: "Scan & Ref", icon: QrCode },
    { id: "Cash walk in", label: "Cash", sublabel: "Pay at Desk", icon: Banknote },
    { id: "Credit Card", label: "Card", sublabel: "Debit / Credit", icon: CreditCard },
];

export default function ConfirmBookingClient() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const courtId = searchParams.get("courtId") || "";
    const courtName = searchParams.get("courtName") || "Pickleball Court";
    const timeSlot = searchParams.get("timeSlot") || "11:00 AM - 12:00 PM";
    const rateStr = searchParams.get("rate") || "300";
    const rate = Number(rateStr) || 300;
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethodChoice>(() => {
        const param = searchParams.get("paymentMethod");
        if (param === "Credit Card" || param === "Card") return "Credit Card";
        if (param === "Cash walk in" || param === "Cash") return "Cash walk in";
        return "GCash QR";
    });
    const date = searchParams.get("date") || "";
    const start = searchParams.get("start") || "";
    const end = searchParams.get("end") || "";
    const duration = searchParams.get("duration") || "1";
    const segmentsRaw = searchParams.get("segments") || "";

    const segments: BookingSegment[] = useMemo(() => {
        if (!segmentsRaw) return [];
        try {
            return JSON.parse(segmentsRaw);
        } catch {
            return [];
        }
    }, [segmentsRaw]);

    // Multi-segment: court jump (sequential, different courts) or parallel (same hour, multiple courts)
    const hasMultipleSegments = segments.length > 1;
    const hasCourtJump = useMemo(() => {
        return segments.some((s, idx) => idx > 0 && s.courtId !== segments[idx - 1].courtId);
    }, [segments]);
    const hasParallelCourts = useMemo(() => {
        // Parallel = two or more segments share the same hour
        return segments.some((s, idx) => segments.findIndex((x) => x.hour === s.hour) !== idx);
    }, [segments]);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [userProfile, setUserProfile] = useState<{ name: string; email: string } | null>(null);

    useEffect(() => {
        async function loadUser() {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    // Prefer full_name from profiles table (source of truth) over auth metadata
                    const { data: profile } = await supabase
                        .from("profiles")
                        .select("full_name")
                        .eq("id", user.id)
                        .maybeSingle();

                    const name =
                        profile?.full_name?.trim() ||
                        user.user_metadata?.full_name ||
                        user.user_metadata?.name ||
                        user.email?.split("@")[0] ||
                        "Customer";
                    const email = user.email || "";
                    setUserProfile({ name, email });
                }
            } catch {
                // Ignore background auth error
            }
        }
        loadUser();
    }, []);

    const getPaymentIcon = () => {
        if (selectedPaymentMethod === "Credit Card") return CreditCard;
        if (selectedPaymentMethod === "GCash QR") return QrCode;
        return Banknote;
    };

    const PaymentIcon = getPaymentIcon();

    const handleConfirmBooking = async () => {
        if (!courtId) {
            setError("Missing court reservation details. Please pick a slot from the schedule.");
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            // Retrieve authenticated user
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                const currentUrl = typeof window !== "undefined" ? window.location.pathname + window.location.search : "/confirm-booking";
                router.push(
                    `/auth/login?message=${encodeURIComponent("Please log in to finalize your booking")}&redirectTo=${encodeURIComponent(currentUrl)}`
                );
                return;
            }

            // Prefer profile name already loaded; fall back to auth metadata
            const customerName =
                userProfile?.name ||
                user.user_metadata?.full_name ||
                user.user_metadata?.name ||
                user.email?.split("@")[0] ||
                "Customer";
            const customerEmail = user.email || null;

            const res = await submitConfirmBooking({
                courtId,
                courtName,
                timeSlot,
                date,
                start,
                end,
                rate,
                paymentMethod: selectedPaymentMethod,
                userId: user.id,
                userEmail: customerEmail ?? undefined,
                userName: customerName,
                segments: segments.length > 0 ? segments : undefined,
            });

            if (res.needsLogin) {
                const currentUrl = typeof window !== "undefined" ? window.location.pathname + window.location.search : "/confirm-booking";
                router.push(
                    `/auth/login?message=${encodeURIComponent("Please log in to finalize your booking")}&redirectTo=${encodeURIComponent(currentUrl)}`
                );
                return;
            }

            if (!res.success || !res.bookingId) {
                setError(res.error || "Unable to confirm booking. That slot may already be reserved.");
                setIsSubmitting(false);
                return;
            }

            // Card payment: redirect to Stripe Checkout
            if (selectedPaymentMethod === "Credit Card") {
                const checkout = await startCardCheckoutAction({
                    bookingId: res.bookingId,
                    totalPrice: rate,
                    courtName,
                    bookingDate: date,
                    startTime: start,
                    endTime: end,
                    customerEmail: customerEmail,
                });

                if (checkout.url) {
                    window.location.href = checkout.url;
                    return;
                }

                setError(checkout.error || "Could not start card checkout. Please try again.");
                setIsSubmitting(false);
                return;
            }

            // GCash QR / Cash: go straight to confirmation
            router.push(`/book/confirmation?bookingId=${res.bookingId}`);
        } catch (err: any) {
            setError(err?.message || "An unexpected error occurred while booking.");
            setIsSubmitting(false);
        }
    };

    return (
        <div className="w-full max-w-lg">
            <div className="mb-4">
                <Link
                    href="/#book-a-court"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                >
                    <ArrowLeft className="w-3.5 h-3.5" /> Back to Schedule
                </Link>
            </div>

            <Card className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                <CardHeader className="p-6 text-center border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="inline-flex items-center justify-center size-12 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 mb-2 border border-blue-100 dark:border-blue-900/60 shadow-xs mx-auto">
                        <ShieldCheck className="w-6 h-6" />
                    </div>
                    <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
                        Confirm Your Booking
                    </CardTitle>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Please review your reservation details below before locking in your court.
                    </p>
                </CardHeader>

                <CardContent className="p-6 space-y-4">
                    {error && (
                        <div className="p-3.5 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-xs flex items-start gap-2 animate-in fade-in">
                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 p-4 divide-y divide-slate-100 dark:divide-slate-800 space-y-2.5">
                        {/* 0. Customer Account */}
                        {userProfile && (
                            <div className="flex items-center justify-between pb-1">
                                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                    <User className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> Player
                                </span>
                                <div className="text-right">
                                    <div className="text-sm font-bold text-gray-900 dark:text-white">{userProfile.name}</div>
                                    {userProfile.email && (
                                        <div className="text-xs text-slate-500 dark:text-slate-400">{userProfile.email}</div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* 1. Court Name */}
                        <div className="flex items-center justify-between pb-1">
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> Court Name
                            </span>
                            <span className="text-sm font-bold text-gray-900 dark:text-white">
                                {hasMultipleSegments ? `Multiple Courts (${segments.length} slots)` : courtName}
                            </span>
                        </div>

                        {/* Optional Date if available */}
                        {date && (
                            <div className="flex items-center justify-between pt-2.5 pb-1">
                                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                    <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> Date
                                </span>
                                <span className="text-sm font-medium text-gray-800 dark:text-slate-200">
                                    {date}
                                </span>
                            </div>
                        )}

                        {/* 2. Scheduled Time Slot */}
                        <div className="flex items-center justify-between pt-2.5 pb-1">
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> Scheduled Time
                            </span>
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                {timeSlot}
                            </span>
                        </div>

                        {/* Duration if multi-slot */}
                        {Number(duration) > 1 && (
                            <div className="flex items-center justify-between pt-2.5 pb-1">
                                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> Duration
                                </span>
                                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                    {hasParallelCourts && !hasCourtJump
                                        ? `${duration} Courts`
                                        : `${duration} Hours`}
                                </span>
                            </div>
                        )}

                        {/* Booking Itinerary — shown for court-jump or parallel multi-court selections */}
                        {hasMultipleSegments && (
                            <div className="pt-2.5 pb-1">
                                <div className="p-3 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/70 dark:bg-blue-950/40 space-y-2">
                                    <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-900 dark:text-blue-300">
                                        <ArrowRightLeft className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                        Booking Itinerary ({segments.length} slots)
                                    </div>
                                    <div className="space-y-1 pt-0.5">
                                        {segments.map((seg, i) => (
                                            <div
                                                key={i}
                                                className="flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg bg-white/90 dark:bg-slate-900/90 border border-blue-100 dark:border-blue-900/60 shadow-2xs"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono font-medium text-slate-800 dark:text-slate-200">
                                                        {formatTime(seg.hour)} – {formatTime(seg.endHour)}
                                                    </span>
                                                    <span className="font-bold text-blue-700 dark:text-blue-300">
                                                        {seg.courtName}
                                                    </span>
                                                </div>
                                                {seg.isJump ? (
                                                    <span className="text-xs font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80">
                                                        Switch Court
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-slate-400 dark:text-slate-500 font-medium tabular-nums">
                                                        ₱{(seg.hourlyRate || 300).toFixed(2)}
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 3. Payment Method Choice Selector */}
                        <div className="pt-3 pb-1 space-y-2.5">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                    <PaymentIcon className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> Payment Method
                                </span>
                                <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold">
                                    {selectedPaymentMethod === "GCash QR"
                                        ? "GCash QR"
                                        : selectedPaymentMethod === "Cash walk in"
                                        ? "Cash (Counter)"
                                        : "Credit / Debit Card"}
                                </span>
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                                {PAYMENT_OPTIONS.map((opt) => {
                                    const Icon = opt.icon;
                                    const isSelected = selectedPaymentMethod === opt.id;
                                    return (
                                        <button
                                            key={opt.id}
                                            type="button"
                                            onClick={() => setSelectedPaymentMethod(opt.id)}
                                            className={`flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-xl border min-h-[58px] transition-all cursor-pointer text-center select-none ${
                                                isSelected
                                                    ? "border-2 border-blue-600 bg-blue-50/80 dark:bg-blue-950/70 text-blue-900 dark:text-blue-200 shadow-xs scale-[1.02]"
                                                    : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                                            }`}
                                        >
                                            <Icon className={`size-4 mb-1.5 ${isSelected ? "text-blue-600 dark:text-blue-400" : "text-slate-500 dark:text-slate-400"}`} />
                                            <span className="text-xs font-bold leading-tight">{opt.label}</span>
                                            <span className="text-xs text-muted-foreground mt-0.5 leading-tight">{opt.sublabel}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* 4. Total Rate / Price in Philippine Peso */}
                        <div className="flex items-center justify-between pt-3 border-t border-slate-200/80 dark:border-slate-700">
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                                <Receipt className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Total Rate
                            </span>
                            <span className="text-base font-bold text-blue-600 dark:text-blue-400 tabular-nums">
                                ₱{rate.toFixed(2)}
                            </span>
                        </div>
                    </div>

                    <p className="text-xs text-slate-400 dark:text-slate-500 text-center">
                        {selectedPaymentMethod === "GCash QR"
                            ? "After confirming, you'll scan the venue GCash QR code and submit your reference number."
                            : selectedPaymentMethod === "Cash walk in"
                            ? "Reservations are confirmed immediately. Please settle your cash payment at the front counter upon arrival."
                            : "You'll be redirected to Stripe to complete your card payment securely. Your slot is reserved once payment is confirmed."}
                    </p>
                </CardContent>

                <CardFooter className="p-6 pt-0 flex flex-col gap-2.5">
                    <Button
                        type="button"
                        onClick={handleConfirmBooking}
                        disabled={isSubmitting}
                        className="w-full py-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                {selectedPaymentMethod === "Credit Card" ? "Redirecting to Stripe…" : "Reserving Court…"}
                            </>
                        ) : (
                            selectedPaymentMethod === "Credit Card" ? "Confirm & Pay with Card" : "Confirm Booking"
                        )}
                    </Button>

                    <Link href="/#book-a-court" className="w-full">
                        <Button
                            type="button"
                            variant="ghost"
                            disabled={isSubmitting}
                            className="w-full rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold"
                        >
                            Cancel
                        </Button>
                    </Link>
                </CardFooter>
            </Card>
        </div>
    );
}
