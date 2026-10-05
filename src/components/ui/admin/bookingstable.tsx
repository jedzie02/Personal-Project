import type { Booking } from "@/lib/types/domain";
import { cancelBookingAction } from "@/app/admin/bookings/actions";
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
          <TableHead>Price</TableHead>
          <TableHead></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {bookings.map((b) => {
          const cancelThisBooking = cancelBookingAction.bind(null, b.id);
          const canCancel = b.status === "pending" || b.status === "confirmed";

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
              <TableCell>${b.totalPrice.toFixed(2)}</TableCell>
              <TableCell>
                {canCancel && (
                  <form action={cancelThisBooking} className="flex items-center gap-2">
                    <input
                      type="text"
                      name="reason"
                      placeholder="Reason"
                      required
                      className="w-28 rounded-md border px-2 py-1 text-xs"
                    />
                    <Button variant="outline" size="sm" type="submit">
                      Cancel
                    </Button>
                  </form>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}