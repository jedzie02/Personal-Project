import { getAllBookings } from "@/lib/services/booking.service";
import { BookingsTable } from "@/components/ui/admin/bookingstable";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams?: Promise<{ search?: string; status?: string; courtId?: string }>;
}) {
  const params = await searchParams;
  const bookings = await getAllBookings({
    customerSearch: params?.search,
    status: params?.status as any,
    courtId: params?.courtId,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Bookings Management</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Manage all reservations, perform counter actions (collect cash, verify GCash), and handle cancellations.
          </p>
        </div>
        <Link href="/admin/bookings/new">
          <Button className="shrink-0 cursor-pointer">
            <Plus className="w-4 h-4 mr-2" /> New Booking
          </Button>
        </Link>
      </div>

      <Card className="shadow-sm overflow-hidden">
        <CardHeader className="border-b border-border/40 py-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">All Court Reservations</CardTitle>
            <span className="text-xs text-muted-foreground">
              {bookings.length} {bookings.length === 1 ? "booking" : "bookings"}
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <BookingsTable bookings={bookings} showActions={true} />
        </CardContent>
      </Card>
    </div>
  );
}
