import Link from "next/link";
import { getBookingById, getBookingsForCustomer, getBookingsByPaymentReference } from "@/lib/services/booking.service";
import { syncStripePaymentIfNeeded } from "@/lib/services/payment.service";
import { getCurrentProfile } from "@/lib/services/auth.server";
import { getGCashSettings } from "@/lib/services/settings.service";
import { formatTime } from "@/lib/utils/date";
import { Button } from "@/components/ui/button";
import { GCashPaymentCard } from "@/components/booking/GCashPaymentCard";
import { Navbar } from "@/components/Navbar";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  CheckCircle2,
  XCircle,
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  Receipt,
  ArrowRight,
  Home,
  CreditCard,
  QrCode,
  Banknote,
  Hash,
  ArrowRightLeft,
} from "lucide-react";

export default async function BookingConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ bookingId?: string }>;
}) {
  const { bookingId } = await searchParams;
  if (bookingId) {
    await syncStripePaymentIfNeeded(bookingId);
  }
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
        <Link href="/" className="mt-5 inline-block">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6">
            Return to Home Schedule
          </Button>
        </Link>
      </div>
    );
  }

  const isCancelled = booking.status === "cancelled";
  const paymentMethod = booking.paymentMethod || "Cash walk in";
  const isGCash = paymentMethod.toLowerCase().includes("gcash") || paymentMethod.toLowerCase().includes("qr");
  const gcashSettings = isGCash ? await getGCashSettings() : null;

  const relatedBookings = booking.paymentReference
    ? await getBookingsByPaymentReference(booking.paymentReference)
    : [];
  const hasCourtSegments = relatedBookings.length > 1;
  const allSegments = hasCourtSegments ? relatedBookings : [booking];
  const totalBookingPrice = allSegments.reduce((sum, b) => sum + Number(b.totalPrice), 0);
  const displayStartTime = allSegments[0].startTime;
  const displayEndTime = allSegments[allSegments.length - 1].endTime;
  const displayCourtName = hasCourtSegments
    ? `Multiple Courts (${allSegments.length} segments)`
    : booking.courtName;

  // Context-sensitive payment instruction
  const getPaymentInstruction = () => {
    const lower = paymentMethod.toLowerCase();
    if (lower.includes("gcash") || lower.includes("qr")) {
      return {
        title: "GCash QR Payment",
        icon: QrCode,
        message: "Please present your GCash payment reference or QR confirmation at the counter upon arrival.",
        bgColor: "bg-blue-50/70",
        borderColor: "border-blue-200",
        textColor: "text-blue-900",
        accentColor: "text-blue-700",
      };
    }
    if (lower.includes("card") || lower.includes("credit")) {
      return {
        title: "Credit Card Payment",
        icon: CreditCard,
        message: "Your credit card transaction is recorded. Please check in with your booking reference at the front desk.",
        bgColor: "bg-emerald-50/70",
        borderColor: "border-emerald-200",
        textColor: "text-emerald-950",
        accentColor: "text-emerald-700",
      };
    }
    return {
      title: "Cash Walk-In Payment",
      icon: Banknote,
      message: "Please settle your cash payment at the reception counter before entering the court.",
      bgColor: "bg-amber-50/70",
      borderColor: "border-amber-200",
      textColor: "text-amber-950",
      accentColor: "text-amber-700",
    };
  };

  const instruction = getPaymentInstruction();
  const InstructionIcon = instruction.icon;

  const getMethodBadgeIcon = () => {
    const lower = paymentMethod.toLowerCase();
    if (lower.includes("gcash") || lower.includes("qr")) return QrCode;
    if (lower.includes("card")) return CreditCard;
    return Banknote;
  };

  const MethodBadgeIcon = getMethodBadgeIcon();

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 py-10 sm:py-14 bg-slate-50/50 dark:bg-slate-950">
        <Card className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Top Celebration or Status Banner */}
          <div className={`p-6 text-center border-b border-slate-100 dark:border-slate-800 ${isCancelled ? "bg-rose-50/50 dark:bg-rose-950/40" : "bg-emerald-50/50 dark:bg-emerald-950/40"}`}>
            <div className={`inline-flex items-center justify-center size-14 rounded-full mb-3 shadow-xs ${
              isCancelled ? "bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400" : "bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400"
            }`}>
              {isCancelled ? <XCircle className="size-7" /> : <CheckCircle2 className="size-7" />}
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {isCancelled ? "Reservation Cancelled" : "Booking Confirmed!"}
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              {isCancelled
                ? (booking.cancelledReason ? `Cancelled: ${booking.cancelledReason}` : "This court reservation has been cancelled.")
                : "Your court reservation is locked in. Here is your receipt summary."}
            </p>

            {/* Reference ID Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 mt-3 shadow-2xs font-mono">
              <Hash className="size-3 text-slate-400" />
              <span>Ref: #{booking.id.slice(0, 8).toUpperCase()}</span>
            </div>
          </div>

          {/* Reservation Breakdown */}
          <CardContent className="p-6 space-y-4">
            <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 p-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <MapPin className="size-3.5 text-blue-600 dark:text-blue-400" /> Court
                </span>
                <span className="font-bold text-slate-900 dark:text-white">{displayCourtName}</span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Calendar className="size-3.5 text-blue-600 dark:text-blue-400" /> Date
                </span>
                <span className="font-semibold text-slate-900 dark:text-slate-200">{booking.bookingDate}</span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Clock className="size-3.5 text-blue-600 dark:text-blue-400" /> Time Slot
                </span>
                <span className="font-semibold text-slate-900 dark:text-slate-200">
                  {formatTime(displayStartTime)} – {formatTime(displayEndTime)}
                </span>
              </div>

              {/* Court Jump Itinerary Breakdown */}
              {hasCourtSegments && (
                <div className="pt-2 border-t border-slate-200/80 dark:border-slate-700 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400">
                    <ArrowRightLeft className="size-3.5" />
                    Court Itinerary ({allSegments.length} segments)
                  </div>
                  <div className="space-y-1">
                    {allSegments.map((b, i) => (
                      <div
                        key={b.id}
                        className="flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-medium text-slate-800 dark:text-slate-200">
                            {formatTime(b.startTime)} – {formatTime(b.endTime)}
                          </span>
                          <span className="font-bold text-blue-600 dark:text-blue-400">
                            {b.courtName}
                          </span>
                          {i > 0 && b.courtId !== allSegments[i - 1].courtId && b.startTime === allSegments[i - 1].endTime && (
                            <span className="text-xs font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80">
                              Switch Court
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-slate-400 dark:text-slate-500 font-medium tabular-nums">
                          ₱{Number(b.totalPrice).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Payment Method in Breakdown */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <MethodBadgeIcon className="size-3.5 text-blue-600 dark:text-blue-400" /> Payment Method
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200">
                  <MethodBadgeIcon className="size-3 text-slate-500 dark:text-slate-400" />
                  {paymentMethod}
                </span>
              </div>

              {booking.paymentReference && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Hash className="size-3.5 text-blue-600 dark:text-blue-400" /> GCash Ref #
                  </span>
                  <span className="font-mono text-xs font-semibold text-slate-900 dark:text-white bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                    {booking.paymentReference}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between text-sm pt-2 border-t border-slate-200/80 dark:border-slate-700">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Receipt className="size-3.5 text-emerald-600 dark:text-emerald-400" /> Total Fee
                </span>
                <span className="text-base font-bold text-slate-900 dark:text-white tabular-nums">
                  ₱{totalBookingPrice.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Context-Sensitive Payment Instruction / GCash QR Card */}
            {!isCancelled ? (
              isGCash && booking.paymentStatus !== "succeeded" ? (
                <GCashPaymentCard
                  bookingId={booking.id}
                  totalPrice={totalBookingPrice}
                  initialReference={booking.paymentReference}
                  gcashNumber={gcashSettings?.gcash_number}
                  gcashName={gcashSettings?.gcash_name}
                  gcashQrUrl={gcashSettings?.gcash_qr_url}
                />
              ) : isGCash && booking.paymentStatus === "succeeded" ? (
                <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/70 text-emerald-950 dark:bg-emerald-950/40 dark:border-emerald-800/80 dark:text-emerald-200 space-y-1">
                  <div className="font-semibold flex items-center gap-1.5 text-xs text-emerald-800 dark:text-emerald-300">
                    <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" /> GCash Payment Verified — Official Receipt
                  </div>
                  <p className="text-xs leading-relaxed opacity-95 dark:text-slate-300">
                    Your GCash transfer{booking.paymentReference ? ` (Ref #${booking.paymentReference})` : ""} has been verified by the administrator. Present this receipt at the front desk upon arrival.
                  </p>
                </div>
              ) : (
                <div className={`p-4 rounded-xl border ${instruction.borderColor} ${instruction.bgColor} ${instruction.textColor} dark:bg-slate-800/80 dark:border-slate-700 space-y-1`}>
                  <div className={`font-semibold flex items-center gap-1.5 text-xs ${instruction.accentColor} dark:text-slate-200`}>
                    <InstructionIcon className="size-4" /> {instruction.title}
                  </div>
                  <p className="text-xs leading-relaxed opacity-95 dark:text-slate-300">
                    {instruction.message}
                  </p>
                </div>
              )
            ) : null}

            {/* Venue Notice */}
            <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 text-xs text-slate-600 dark:text-slate-400 space-y-1">
              <div className="font-semibold flex items-center gap-1 text-slate-700 dark:text-slate-200">
                <Sparkles className="size-3.5 text-blue-600 dark:text-blue-400" /> Quick reminders:
              </div>
              <ul className="list-disc list-inside space-y-0.5 pl-1">
                <li>Please arrive 10 minutes prior to warm up and check in.</li>
                <li>Paddles and balls are available at the front counter.</li>
                <li>Non-marking athletic court shoes are required on all courts.</li>
              </ul>
            </div>
          </CardContent>

          {/* Clear Action Progression */}
          <CardFooter className="p-6 pt-0 flex flex-col sm:flex-row items-center gap-2.5">
            <Link href="/" className="w-full sm:flex-1">
              <Button className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold cursor-pointer flex items-center justify-center gap-1.5 shadow-xs">
                <Home className="size-4" /> Return to Home Schedule
              </Button>
            </Link>

            <Link href="/bookings" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full rounded-xl border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer flex items-center justify-center gap-1.5">
                View My Bookings <ArrowRight className="size-3.5" />
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}