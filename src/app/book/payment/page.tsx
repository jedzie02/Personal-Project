import Link from "next/link";
import { getBookingById, getBookingsByPaymentReference, getBookingsForCustomer } from "@/lib/services/booking.service";
import { getCurrentProfile } from "@/lib/services/auth.server";
import { getGCashSettings } from "@/lib/services/settings.service";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import { PaymentClient } from "./PaymentClient";

export default async function BookPaymentPage({
    searchParams,
}: {
    searchParams: Promise<{ bookingId?: string }>;
}) {
    const { bookingId } = await searchParams;

    let booking = bookingId ? await getBookingById(bookingId) : null;

    if (!booking) {
        const profile = await getCurrentProfile();
        if (profile) {
            const customerBookings = await getBookingsForCustomer(profile.id);
            if (customerBookings.length > 0) {
                booking = customerBookings[0];
            }
        }
    }

    if (!booking) {
        return (
            <div className="min-h-screen flex flex-col bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100">
                <Navbar />
                <main className="flex-1 flex items-center justify-center px-4 py-16">
                    <div className="mx-auto max-w-md text-center">
                        <div className="size-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-400">
                            <Calendar className="size-6" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Booking Not Found</h2>
                        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                            We couldn&apos;t locate that reservation record. Please start from the court schedule.
                        </p>
                        <Link href="/#book-a-court" className="mt-5 inline-block">
                            <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6">
                                Return to Schedule
                            </Button>
                        </Link>
                    </div>
                </main>
            </div>
        );
    }

    const gcashSettings = await getGCashSettings();

    const relatedBookings = booking.paymentReference
        ? await getBookingsByPaymentReference(booking.paymentReference)
        : [];
    const hasCourtSegments = relatedBookings.length > 1;
    const allSegments = hasCourtSegments ? relatedBookings : [booking];
    const totalBookingPrice = allSegments.reduce((sum, b) => sum + Number(b.totalPrice), 0);
    const displayStartTime = allSegments[0].startTime;
    const displayEndTime = allSegments[allSegments.length - 1].endTime;
    const displayCourtName = hasCourtSegments
        ? `Multiple Courts (${allSegments.length} slots)`
        : booking.courtName;

    return (
        <div className="min-h-screen flex flex-col bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
            <Navbar />
            <main className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
                <PaymentClient
                    bookingId={booking.id}
                    totalPrice={totalBookingPrice}
                    courtName={displayCourtName}
                    bookingDate={booking.bookingDate}
                    startTime={displayStartTime}
                    endTime={displayEndTime}
                    qrImageUrl={gcashSettings?.gcash_qr_url}
                    gcashName={gcashSettings?.gcash_name}
                    gcashNumber={gcashSettings?.gcash_number}
                />
            </main>
        </div>
    );
}
