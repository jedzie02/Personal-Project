import Link from "next/link";
import { getBookingById } from "@/lib/services/booking.service";
import { formatTime } from "@/lib/utils/date";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function BookingConfirmationPage({
    searchParams,
}: {
    searchParams: Promise<{ bookingId?: string }>;
}) {
    const { bookingId } = await searchParams;
    const booking = bookingId ? await getBookingById(bookingId) : null;

    if (!booking) {
        return (
            <div className="mx-auto max-w-md px-4 py-10 text-center">
                <p>We couldn&apos;t find that booking.</p>
                <Link href="/book" className="mt-2 inline-block underline">
                    Back to booking
                </Link>
            </div>
        );
    }

    return (
        <Card className="mx-auto max-w-md my-10 border-none shadow-none sm:border-solid sm:shadow-sm">
            <CardHeader className="text-center">
                <CardTitle className="text-2xl font-semibold">Booking received</CardTitle>
                <CardDescription className="mt-2 text-md">
                    {booking.courtName} &middot; {booking.bookingDate} &middot; {formatTime(booking.startTime)}–
                    {formatTime(booking.endTime)}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <p className="rounded-md bg-yellow-100 p-3 text-sm text-yellow-800 text-center">
                    Status: {booking.status}. If you just completed payment, this can take
                    a few seconds to update &mdash; the final confirmation happens automatically
                    once Stripe notifies us the payment succeeded (Phase 9).
                </p>
            </CardContent>
            <CardFooter className="flex justify-center pb-6">
                <Link href="/bookings">
                    <Button>View my bookings</Button>
                </Link>
            </CardFooter>
        </Card>
    );
}