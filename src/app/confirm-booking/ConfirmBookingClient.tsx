"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { submitConfirmBooking } from "./actions";

export default function ConfirmBookingClient() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const courtId = searchParams.get("courtId") || "";
    const courtName = searchParams.get("courtName") || "Pickleball Court";
    const timeSlot = searchParams.get("timeSlot") || "11:00 AM - 12:00 PM";
    const rateStr = searchParams.get("rate") || "25";
    const rate = Number(rateStr) || 25;
    const paymentMethod = searchParams.get("paymentMethod") || "GCash QR";
    const date = searchParams.get("date") || "";
    const start = searchParams.get("start") || "";
    const end = searchParams.get("end") || "";

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [userProfile, setUserProfile] = useState<{ name: string; email: string } | null>(null);

    useEffect(() => {
        async function loadUser() {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const name =
                        user.user_metadata?.full_name ||
                        user.user_metadata?.name ||
                        (typeof window !== "undefined" ? localStorage.getItem("userName") : null) ||
                        user.email?.split("@")[0] ||
                        "Customer";
                    const email = user.email || (typeof window !== "undefined" ? localStorage.getItem("userEmail") : null) || "";
                    setUserProfile({ name, email });
                }
            } catch {
                // Ignore background auth error
            }
        }
        loadUser();
    }, []);

    const getPaymentIcon = () => {
        if (paymentMethod === "Credit Card") return CreditCard;
        if (paymentMethod === "GCash QR") return QrCode;
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

            const customerName =
                user.user_metadata?.full_name ||
                user.user_metadata?.name ||
                (typeof window !== "undefined" ? localStorage.getItem("userName") : null) ||
                user.email?.split("@")[0] ||
                "Customer";
            const customerEmail = user.email || (typeof window !== "undefined" ? localStorage.getItem("userEmail") : null) || null;

            const res = await submitConfirmBooking({
                courtId,
                courtName,
                timeSlot,
                date,
                start,
                end,
                rate,
                paymentMethod,
                userId: user.id,
                userEmail: customerEmail ?? undefined,
                userName: customerName,
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

            // Redirect on successful booking creation
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
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
                >
                    <ArrowLeft className="w-3.5 h-3.5" /> Back to Schedule
                </Link>
            </div>

            <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <CardHeader className="p-6 text-center border-b border-slate-100 bg-slate-50/50">
                    <div className="inline-flex items-center justify-center size-12 rounded-full bg-blue-50 text-blue-600 mb-2 border border-blue-100 shadow-xs mx-auto">
                        <ShieldCheck className="w-6 h-6" />
                    </div>
                    <CardTitle className="text-xl font-bold text-gray-900">
                        Confirm Your Booking
                    </CardTitle>
                    <p className="text-xs text-slate-500 mt-1">
                        Please review your reservation details below before locking in your court.
                    </p>
                </CardHeader>

                <CardContent className="p-6 space-y-4">
                    {error && (
                        <div className="p-3.5 rounded-xl border border-red-200 bg-red-50 text-red-700 text-xs flex items-start gap-2 animate-in fade-in">
                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4 divide-y divide-slate-100 space-y-2.5">
                        {/* 0. Customer Account */}
                        {userProfile && (
                            <div className="flex items-center justify-between pb-1">
                                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                                    <User className="w-3.5 h-3.5 text-blue-600" /> Player
                                </span>
                                <div className="text-right">
                                    <div className="text-sm font-bold text-gray-900">{userProfile.name}</div>
                                    {userProfile.email && (
                                        <div className="text-xs text-slate-500">{userProfile.email}</div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* 1. Court Name */}
                        <div className="flex items-center justify-between pb-1">
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-blue-600" /> Court Name
                            </span>
                            <span className="text-sm font-bold text-gray-900">
                                {courtName}
                            </span>
                        </div>

                        {/* Optional Date if available */}
                        {date && (
                            <div className="flex items-center justify-between pt-2.5 pb-1">
                                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                                    <Calendar className="w-3.5 h-3.5 text-blue-600" /> Date
                                </span>
                                <span className="text-sm font-medium text-gray-800">
                                    {date}
                                </span>
                            </div>
                        )}

                        {/* 2. Scheduled Time Slot */}
                        <div className="flex items-center justify-between pt-2.5 pb-1">
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-blue-600" /> Scheduled Time
                            </span>
                            <span className="text-sm font-semibold text-gray-900">
                                {timeSlot}
                            </span>
                        </div>

                        {/* 3. Payment Method Display: Placed directly below the scheduled time */}
                        <div className="flex items-center justify-between pt-2.5 pb-1">
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                                <PaymentIcon className="w-3.5 h-3.5 text-blue-600" /> Payment Method
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
                                <PaymentIcon className="w-3 h-3" />
                                {paymentMethod}
                            </span>
                        </div>

                        {/* 4. Total Rate / Price in Philippine Peso */}
                        <div className="flex items-center justify-between pt-3 border-t border-slate-200/80">
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                                <Receipt className="w-3.5 h-3.5 text-emerald-600" /> Total Rate
                            </span>
                            <span className="text-base font-bold text-blue-600 tabular-nums">
                                ₱{rate.toFixed(2)}
                            </span>
                        </div>
                    </div>

                    <p className="text-[11px] text-slate-400 text-center">
                        Reservations are confirmed immediately upon submission. Payment can be finalized at the venue desk.
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
                                Reserving Court…
                            </>
                        ) : (
                            "Confirm Booking"
                        )}
                    </Button>

                    <Link href="/#book-a-court" className="w-full">
                        <Button
                            type="button"
                            variant="ghost"
                            disabled={isSubmitting}
                            className="w-full rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-50 text-xs font-semibold"
                        >
                            Cancel
                        </Button>
                    </Link>
                </CardFooter>
            </Card>
        </div>
    );
}
