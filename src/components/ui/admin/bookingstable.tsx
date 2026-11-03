import type { Booking } from "@/lib/types/domain";
import { cancelBookingAction, markBookingPaidInCashAction } from "@/app/admin/bookings/actions";
import { formatTime } from "@/lib/utils/date";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Banknote, QrCode, CheckCircle2, CalendarX } from "lucide-react";

function formatDisplayDate(dateStr: string) {
  try {
    const [y, m, d] = dateStr.split("-").map(Number);
    if (!y || !m || !d) return dateStr;
    const dateObj = new Date(Date.UTC(y, m - 1, d));
    return dateObj.toLocaleDateString("en-US", {
      timeZone: "UTC",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

const STATUS_STYLES: Record<Booking["status"], string> = {
  pending: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-950/80",
  confirmed: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-950/80",
  cancelled: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800",
  completed: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-950/80",
};

export function BookingsTable({
  bookings,
  showActions = true,
}: {
  bookings: Booking[];
  showActions?: boolean;
}) {
  if (bookings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <div className="size-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 mb-3">
          <CalendarX className="size-6" />
        </div>
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">No reservations found</p>
        <p className="text-xs text-muted-foreground mt-1 max-w-xs">
          No bookings match the selected filters or date range.
        </p>
      </div>
    );
  }

  return (
    <Table className="w-full">
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Time</TableHead>
          <TableHead>Court</TableHead>
          <TableHead>Customer</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Payment</TableHead>
          <TableHead>Price</TableHead>
          {showActions && <TableHead className="text-right">Actions</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {bookings.map((b) => {
          const cancelThisBooking = cancelBookingAction.bind(null, b.id);
          const collectCashForThisBooking = markBookingPaidInCashAction.bind(null, b.id);
          const canCancel = b.status === "pending" || b.status === "confirmed";
          const needsPayment = b.paymentStatus !== "succeeded" && b.status !== "cancelled";
          const isGCash = b.paymentMethod?.toLowerCase().includes("gcash") || b.paymentMethod?.toLowerCase().includes("qr");
          const isGeneric =
            !b.customerName ||
            b.customerName.toLowerCase() === "customer" ||
            b.customerName.toLowerCase() === "customer user";
          const customerDisplayName = !isGeneric
            ? b.customerName
            : (b.customerEmail ? b.customerEmail.split("@")[0] : b.customerName || "—");

          return (
            <TableRow key={b.id} className="align-top">
              <TableCell className="font-medium whitespace-nowrap">
                {formatDisplayDate(b.bookingDate)}
              </TableCell>
              <TableCell className="text-muted-foreground whitespace-nowrap">
                {formatTime(b.startTime)} – {formatTime(b.endTime)}
              </TableCell>
              <TableCell className="font-medium">{b.courtName}</TableCell>
              <TableCell>
                <div className="font-medium">{customerDisplayName}</div>
                <div className="text-xs text-muted-foreground">{b.customerEmail}</div>
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className={STATUS_STYLES[b.status]}>
                  {b.status.charAt(0).toUpperCase() + b.status.slice(1)}
                </Badge>
                {b.status === "cancelled" && b.cancelledReason && (
                  <div className="mt-1 text-xs text-muted-foreground">
                    Reason: {b.cancelledReason}
                  </div>
                )}
              </TableCell>
              <TableCell>
                {b.paymentStatus === "succeeded" ? (
                  <div className="space-y-1">
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800">
                      {b.paymentMethod === "card" ? "Paid (Card)" : isGCash ? "Paid (GCash)" : "Paid (Cash)"}
                    </Badge>
                    {b.paymentReference && (
                      <div className="text-xs font-mono text-slate-500 dark:text-slate-400">
                        Ref: #{b.paymentReference}
                      </div>
                    )}
                  </div>
                ) : b.paymentStatus === "pending" ? (
                  <div className="space-y-1">
                    <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800">
                      {isGCash ? "GCash Pending" : "Pay at Desk"}
                    </Badge>
                    {b.paymentReference ? (
                      <div className="text-xs font-mono font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50 px-1.5 py-0.5 rounded border border-blue-200/60 dark:border-blue-900/60 inline-flex items-center gap-1">
                        <QrCode className="size-2.5" /> Ref: {b.paymentReference}
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground">
                        {b.paymentMethod}
                      </div>
                    )}
                  </div>
                ) : (
                  <Badge variant="outline" className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                    {b.paymentStatus || "Unpaid"}
                  </Badge>
                )}
              </TableCell>
              <TableCell className="font-medium tabular-nums">₱{b.totalPrice.toFixed(2)}</TableCell>
              {showActions && (
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    {needsPayment && (
                      <form action={collectCashForThisBooking}>
                        <Button
                          size="sm"
                          type="submit"
                          className={`h-7 text-xs text-white cursor-pointer font-medium ${
                            isGCash
                              ? "bg-blue-600 hover:bg-blue-700"
                              : "bg-emerald-600 hover:bg-emerald-700"
                          }`}
                        >
                          {isGCash ? (
                            <>
                              <CheckCircle2 className="size-3 mr-1" /> Verify GCash
                            </>
                          ) : (
                            <>
                              <Banknote className="size-3 mr-1" /> Collect Cash
                            </>
                          )}
                        </Button>
                      </form>
                    )}
                    {canCancel && (
                      <form action={cancelThisBooking} className="flex items-center gap-1.5">
                        <input
                          type="text"
                          name="reason"
                          placeholder="Reason"
                          required
                          className="w-28 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-xs text-slate-900 dark:text-slate-100 placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-rose-500"
                        />
                        <Button variant="outline" size="sm" type="submit" className="h-7 text-xs hover:border-rose-300 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer">
                          Cancel
                        </Button>
                      </form>
                    )}
                  </div>
                </TableCell>
              )}
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}