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
            <h1 className="text-2xl font-semibold">My bookings</h1>

            {error && (
                <p className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>
            )}

            <div className="mt-6 flex flex-col gap-3">
                {bookings.length === 0 && (
                    <p className="text-muted-foreground">No bookings yet.</p>
                )}

                {bookings.map((booking) => {
                    // Locks this specific booking's id into the action, so the
                    // form below only needs to send the reason.
                    const cancelThisBooking = cancelOwnBookingAction.bind(null, booking.id);
                    const canCancel = booking.status === "pending" || booking.status === "confirmed";

                    return (
                        <div key={booking.id} className="rounded-lg border p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium">{booking.courtName}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {booking.bookingDate} · {formatTime(booking.startTime)}–
                                        {formatTime(booking.endTime)}
                                    </p>
                                </div>
                                <span className="text-sm capitalize">{booking.status}</span>
                            </div>

                            {canCancel && (
                                <form action={cancelThisBooking} className="mt-3 flex items-center gap-2">
                                    <input
                                        type="text"
                                        name="reason"
                                        placeholder="Reason (optional)"
                                        className="flex-1 rounded-md border px-2 py-1 text-sm"
                                    />
                                    <Button variant="outline" size="sm" type="submit">
                                        Cancel
                                    </Button>
                                </form>
                            )}

                            {booking.status === "cancelled" && (
                                <p className="mt-2 text-xs text-muted-foreground">
                                    Cancelled{booking.cancelledReason ? `: ${booking.cancelledReason}` : ""}
                                </p>
                            )}
                        </div>
                    );
                })}
            </div>

            <p className="mt-4 text-xs text-muted-foreground">
                Bookings can be cancelled up until {CANCELLATION_CUTOFF_HOURS} hours before
                the start time.
            </p>
        </div>
    );
}