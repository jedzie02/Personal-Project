import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/services/auth.server";
import { getBookingsForCustomer } from "@/lib/services/booking.service";
import { cancelOwnBookingAction } from "@/app/bookings/actions";
import { formatTime } from "@/lib/utils/date";
import { CANCELLATION_CUTOFF_HOURS } from "@/lib/config/booking-rules";
import { Button } from "@/components/ui/button";

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

    const bookings = await getBookingsForCustomer(profile!.id);

    return (
        <div className="mx-auto max-w-2xl px-4 py-10">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">My Bookings</h1>
            <p className="text-sm text-slate-500 mt-1">
                View your upcoming court matches and reservation history.
            </p>

            {error && (
                <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-sm text-rose-800">
                    {error}
                </div>
            )}

            <div className="mt-6 flex flex-col gap-3">
                {bookings.length === 0 && (
                    <div className="rounded-2xl border border-slate-200 bg-white p-8 sm:p-10 text-center shadow-xs">
                        <div className="size-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4 border border-blue-100">
                            <span className="text-2xl">🏓</span>
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Ready for your first match?
                        </h2>
                        <p className="mt-2 text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                            You haven&apos;t reserved any courts yet. Pick your favorite court, grab your paddles, and lock in your playtime in under a minute.
                        </p>

                        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                            <a href="/#book-a-court">
                                <Button className="rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 shadow-sm cursor-pointer">
                                    Browse Open Courts
                                </Button>
                            </a>
                        </div>

                        <div className="mt-8 pt-6 border-t border-slate-100 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500 font-medium">
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

                {bookings.map((booking) => {
                    const cancelThisBooking = cancelOwnBookingAction.bind(null, booking.id);
                    const canCancel = booking.status === "pending" || booking.status === "confirmed";

                    return (
                        <div key={booking.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="font-bold text-base text-slate-900">{booking.courtName}</p>
                                    <p className="text-sm text-slate-500 mt-0.5">
                                        {booking.bookingDate} · {formatTime(booking.startTime)} – {formatTime(booking.endTime)}
                                    </p>
                                </div>
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border capitalize ${
                                    booking.status === "confirmed"
                                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                        : booking.status === "pending"
                                        ? "bg-amber-50 text-amber-800 border-amber-200"
                                        : "bg-slate-100 text-slate-700 border-slate-200"
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

                            {canCancel && (
                                <form action={cancelThisBooking} className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
                                    <input
                                        type="text"
                                        name="reason"
                                        placeholder="Reason for cancellation (optional)"
                                        className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <Button variant="outline" size="sm" type="submit" className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 cursor-pointer">
                                        Cancel Reservation
                                    </Button>
                                </form>
                            )}

                            {booking.status === "cancelled" && (
                                <p className="mt-3 text-xs text-slate-400">
                                    Cancelled{booking.cancelledReason ? `: ${booking.cancelledReason}` : ""}
                                </p>
                            )}
                        </div>
                    );
                })}
            </div>

            <p className="mt-6 text-xs text-slate-500 text-center">
                Cancellations are accepted up to {CANCELLATION_CUTOFF_HOURS} hours before match start time. Cancellations within {CANCELLATION_CUTOFF_HOURS} hours are non-refundable to protect venue court scheduling.
            </p>
        </div>
    );
}