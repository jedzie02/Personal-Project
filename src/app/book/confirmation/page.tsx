import Link from "next/link";
import { getBookingById, getBookingsForCustomer } from "@/lib/services/booking.service";
import { getCurrentProfile } from "@/lib/services/auth.server";
import { formatTime } from "@/lib/utils/date";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  CheckCircle2,
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  ChevronRight,
  Receipt,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

export default async function BookingConfirmationPage({
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
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <div className="size-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
          <Calendar className="size-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Booking Not Found</h2>
        <p className="mt-2 text-sm text-slate-500">
          We couldn&apos;t locate that reservation record. If you just confirmed, please give it a moment and refresh.
        </p>
        <Link href="/#book-a-court" className="mt-5 inline-block">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6">
            Explore Open Courts
          </Button>
        </Link>
      </div>
    );
  }

  const isConfirmed = booking.status === "confirmed" || booking.status === "completed";

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-slate-50/50">
      <Card className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Top Celebration Banner */}
        <div className="p-6 text-center border-b border-slate-100 bg-emerald-50/50">
          <div className="inline-flex items-center justify-center size-14 rounded-full bg-emerald-100 text-emerald-600 mb-3 shadow-xs">
            <CheckCircle2 className="size-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Court Reserved!
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Your court reservation is locked in. Get ready for your match!
          </p>
        </div>

        {/* Reservation Breakdown */}
        <CardContent className="p-6 space-y-4">
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <MapPin className="size-3.5 text-blue-600" /> Court
              </span>
              <span className="font-bold text-slate-900">{booking.courtName}</span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Calendar className="size-3.5 text-blue-600" /> Date
              </span>
              <span className="font-semibold text-slate-900">{booking.bookingDate}</span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Clock className="size-3.5 text-blue-600" /> Time Slot
              </span>
              <span className="font-semibold text-slate-900">
                {formatTime(booking.startTime)} – {formatTime(booking.endTime)}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm pt-2 border-t border-slate-200/80">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Receipt className="size-3.5 text-emerald-600" /> Total Fee
              </span>
              <span className="text-base font-bold text-slate-900 tabular-nums">
                ₱{Number(booking.totalPrice).toFixed(2)}
              </span>
            </div>
          </div>

          {/* First-Timer Venue Tips */}
          <div className="p-3.5 rounded-xl border border-blue-100 bg-blue-50/60 text-xs text-blue-900 space-y-1">
            <div className="font-semibold flex items-center gap-1 text-blue-700">
              <Sparkles className="size-3.5" /> What to know before match time:
            </div>
            <ul className="list-disc list-inside space-y-0.5 text-slate-600 pl-1">
              <li>Please arrive 10 minutes early to warm up and check in at the desk.</li>
              <li>Paddles and balls are available for complimentary rental at the venue.</li>
              <li>Non-marking athletic court shoes are required on all indoor courts.</li>
            </ul>
          </div>
        </CardContent>

        {/* Clear Action Progression */}
        <CardFooter className="p-6 pt-0 flex flex-col sm:flex-row items-center gap-2.5">
          <Link href="/bookings" className="w-full sm:flex-1">
            <Button className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold cursor-pointer">
              View My Bookings <ArrowRight className="size-4 ml-1.5" />
            </Button>
          </Link>

          <Link href="/#book-a-court" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer">
              Book Another
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}