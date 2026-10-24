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
import { Banknote } from "lucide-react";

const STATUS_STYLES: Record<Booking["status"], string> = {
  pending: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
  confirmed: "bg-green-100 text-green-800 hover:bg-green-100",
  cancelled: "bg-gray-100 text-gray-800 hover:bg-gray-100",
  completed: "bg-blue-100 text-blue-800 hover:bg-blue-100",
};

export function BookingsTable({ bookings }: { bookings: Booking[] }) {
  if (bookings.length === 0) {
    return <p className="text-muted-foreground">No bookings match these filters.</p>;
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
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {bookings.map((b) => {
          const cancelThisBooking = cancelBookingAction.bind(null, b.id);
          const collectCashForThisBooking = markBookingPaidInCashAction.bind(null, b.id);
          const canCancel = b.status === "pending" || b.status === "confirmed";
          const needsPayment = b.paymentStatus !== "succeeded" && b.status !== "cancelled";

          return (
            <TableRow key={b.id} className="align-top">
              <TableCell className="font-medium">{b.bookingDate}</TableCell>
              <TableCell className="text-muted-foreground">
                {formatTime(b.startTime)} – {formatTime(b.endTime)}
              </TableCell>
              <TableCell>{b.courtName}</TableCell>
              <TableCell>
                <div className="font-medium">{b.customerName ?? "—"}</div>
                <div className="text-xs text-muted-foreground">{b.customerEmail}</div>
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className={STATUS_STYLES[b.status]}>
                  {b.status}
                </Badge>
                {b.status === "cancelled" && b.cancelledReason && (
                  <div className="mt-1 text-xs text-muted-foreground">
                    Reason: {b.cancelledReason}
                  </div>
                )}
              </TableCell>
              <TableCell>
                {b.paymentStatus === "succeeded" ? (
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                    {b.paymentMethod === "card" ? "Paid (Card)" : "Paid (Cash)"}
                  </Badge>
                ) : b.paymentStatus === "pending" ? (
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                    Pay at Desk
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-slate-100 text-slate-700">
                    {b.paymentStatus || "Unpaid"}
                  </Badge>
                )}
              </TableCell>
              <TableCell className="font-medium tabular-nums">₱{b.totalPrice.toFixed(2)}</TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  {needsPayment && (
                    <form action={collectCashForThisBooking}>
                      <Button
                        size="sm"
                        type="submit"
                        className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer font-medium"
                      >
                        <Banknote className="size-3 mr-1" /> Collect Cash
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
                        className="w-24 rounded-md border px-2 py-1 text-xs"
                      />
                      <Button variant="outline" size="sm" type="submit" className="h-7 text-xs">
                        Cancel
                      </Button>
                    </form>
                  )}
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}