import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/services/auth.server";
import { getBookingsForCustomer } from "@/lib/services/booking.service";
import { listPaidEntriesForCustomer } from "@/lib/services/open-play.service";
import { cancelOwnBookingAction } from "@/app/bookings/actions";
import { formatTime } from "@/lib/utils/date";
import { CANCELLATION_CUTOFF_HOURS, canCancelBooking } from "@/lib/config/booking-rules";
import { Button } from "@/components/ui/button";
import { Clock, XCircle, CalendarCheck, Receipt, Users } from "lucide-react";
import { Navbar } from "@/components/Navbar";

export default async function MyBookingsPage({
    searchParams,
}: {
    searchParams: Promise<{ error?: string }>;
}) {
    const { error } = await searchParams;

    const profile = await getCurrentProfile();
    if (!profile) {
        redirect(`/auth/login?redirectTo=${encodeURIComponent("/bookings")}`);
    }

    const [bookings, openPlayEntries] = await Promise.all([
        getBookingsForCustomer(profile!.id),
        listPaidEntriesForCustomer(profile!.id),
    ]);

    return (
        <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
            <Navbar />

            <main className="flex-1 mx-auto w-full max-w-2xl px-4 py-8 sm:py-10">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">My Bookings</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    View your upcoming court matches and reservation history.
                </p>

                {error && (
                    <div className="mt-4 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 p-3.5 text-sm text-rose-800 dark:text-rose-300">
                        {error}
                    </div>
                )}

                <div className="mt-6 flex flex-col gap-3">
                    {bookings.length === 0 && openPlayEntries.length === 0 && (
                        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 sm:p-10 text-center shadow-xs">
                            <div className="size-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-4 border border-blue-100 dark:border-blue-900/60">
                                <CalendarCheck className="size-7" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                                Ready for your first match?
                            </h2>
                            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                                You haven&apos;t reserved any courts yet. Pick your favorite court, grab your paddles, and lock in your playtime in under a minute.
                            </p>

                            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                                <a href="/#book-a-court">
                                    <Button className="rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 shadow-sm cursor-pointer">
                                        Browse Open Courts
                                    </Button>
                                </a>
                            </div>

                            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500 dark:text-slate-400 font-medium">
                                <span className="flex items-center gap-1.5">
                                    <span className="size-1.5 rounded-full bg-emerald-500" /> 4 Master Courts
                                </span>
                                <span>•</span>
                                <span>Live Hourly Rates in ₱</span>
                                <span>•</span>
                                <span>9:00 AM – 12:00 AM Daily</span>
                            </div>
                        </div>
                    )}

                    {openPlayEntries.map((entry) => {
                        const isPaid = entry.status === "paid";
                        const isNeedsRefund = entry.status === "needs_refund";
                        return (
                            <div
                                key={entry.entryId}
                                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="font-bold text-base text-slate-900 dark:text-white">
                                                {entry.session.courtName}
                                            </p>
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60">
                                                <Users className="size-3" /> Open Play
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
                                            {entry.session.date} · {formatTime(entry.session.startTime)} – {formatTime(entry.session.endTime)} · ₱{entry.amount.toFixed(2)}
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                                        <span
                                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                                                isPaid
                                                    ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60"
                                                    : "bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/60"
                                            }`}
                                        >
                                            {isPaid
                                                ? "Spot Reserved · Paid"
                                                : isNeedsRefund
                                                ? "Refund Pending"
                                                : "Spot Reserved · Pending Payment"}
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                                    <span className="text-xs text-slate-500 dark:text-slate-400">
                                        {isPaid
                                            ? `Official Open Play receipt ready (${entry.paymentMethod})`
                                            : isNeedsRefund
                                            ? "Session cancelled — venue team will refund your payment"
                                            : `Payment method: ${entry.paymentMethod}${entry.paymentReference ? ` (Ref: ${entry.paymentReference})` : ""}`}
                                    </span>
                                    <Link href={`/open-play/confirmation?entryId=${entry.entryId}`}>
                                        <Button
                                            variant={isPaid ? "default" : "outline"}
                                            size="sm"
                                            className={
                                                isPaid
                                                    ? "h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                                                    : "h-8 text-xs gap-1.5 cursor-pointer"
                                            }
                                        >
                                            <Receipt className="size-3.5" />
                                            {isPaid
                                                ? "View Official Receipt"
                                                : entry.paymentMethod === "GCash QR"
                                                ? "View / Submit GCash Ref"
                                                : "View Booking"}
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        );
                    })}

                    {bookings.map((booking) => {
                        const cancelThisBooking = cancelOwnBookingAction.bind(null, booking.id);
                        const isCancellableStatus = booking.status === "pending" || booking.status === "confirmed";
                        const canCancel = isCancellableStatus && canCancelBooking(booking.bookingDate, booking.startTime);
                        const isPastCutoff = isCancellableStatus && !canCancel;

                        const isPaid = booking.paymentStatus === "succeeded";

                        return (
                            <div key={booking.id} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="font-bold text-base text-slate-900 dark:text-white">{booking.courtName}</p>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
                                            {booking.bookingDate} · {formatTime(booking.startTime)} – {formatTime(booking.endTime)} · ₱{Number(booking.totalPrice).toFixed(2)}
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                                        {booking.status !== "cancelled" && (
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                                                isPaid
                                                    ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60"
                                                    : "bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/60"
                                            }`}>
                                                {isPaid ? "Paid" : "Pending Payment"}
                                            </span>
                                        )}
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border capitalize ${
                                            booking.status === "confirmed"
                                                ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60"
                                                : booking.status === "pending"
                                                ? "bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/60"
                                                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                                        }`}>
                                            <span className={`size-1.5 rounded-full ${
                                                booking.status === "confirmed"
                                                    ? "bg-emerald-500"
                                                    : booking.status === "pending"
                                                    ? "bg-amber-500"
                                                    : "bg-slate-400"
                                            }`} />
                                            {booking.status}
                                        </span>
                                    </div>
                                </div>

                                {booking.status !== "cancelled" && (
                                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                                        <span className="text-xs text-slate-500 dark:text-slate-400">
                                            {isPaid
                                                ? `Official receipt ready (${booking.paymentMethod || "Paid"})`
                                                : `Payment method: ${booking.paymentMethod || "Cash walk in"}`}
                                        </span>
                                        <Link href={`/book/confirmation?bookingId=${booking.id}`}>
                                            <Button
                                                variant={isPaid ? "default" : "outline"}
                                                size="sm"
                                                className={isPaid ? "h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer" : "h-8 text-xs gap-1.5 cursor-pointer"}
                                            >
                                                <Receipt className="size-3.5" />
                                                {isPaid ? "View Official Receipt" : "View Booking / Pay"}
                                            </Button>
                                        </Link>
                                    </div>
                                )}

                                {canCancel && (
                                    <form action={cancelThisBooking} className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                                        <input
                                            type="text"
                                            name="reason"
                                            defaultValue="Changed my mind"
                                            placeholder="Reason for cancellation (e.g. Changed my mind)"
                                            className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs bg-slate-50/50 dark:bg-slate-800/60 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 dark:text-slate-200"
                                        />
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            type="submit"
                                            className="text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 border-rose-200 dark:border-rose-900/60 cursor-pointer shrink-0 font-medium flex items-center gap-1"
                                        >
                                            <XCircle className="size-3.5" /> Cancel Reservation
                                        </Button>
                                    </form>
                                )}

                                {isPastCutoff && (
                                    <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400">
                                        <Clock className="size-3 shrink-0" />
                                        <span>Cancellation window closed (starts in under {CANCELLATION_CUTOFF_HOURS} hours).</span>
                                    </div>
                                )}

                                {booking.status === "cancelled" && (
                                    <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">
                                        Cancelled{booking.cancelledReason ? `: ${booking.cancelledReason}` : ""}
                                    </p>
                                )}
                            </div>
                        );
                    })}
                </div>

                <p className="mt-6 text-xs text-slate-500 dark:text-slate-400 text-center">
                    Cancellations are accepted up to {CANCELLATION_CUTOFF_HOURS} hours before match start time. Cancellations within {CANCELLATION_CUTOFF_HOURS} hours are non-refundable to protect venue court scheduling.
                </p>
            </main>
        </div>
    );
}