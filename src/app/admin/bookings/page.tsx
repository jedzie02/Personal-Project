import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface BookingRow {
  id: string;
  court_id: string;
  customer_id: string | null;
  booking_date?: string;
  start_time: string;
  end_time: string;
  total_price: number;
  status: "pending" | "confirmed" | "cancelled" | "completed" | string;
  courts: { name: string } | null;
  profiles: { full_name: string | null; email: string | null } | null;
}

function formatBookingTime(booking: BookingRow) {
  if (booking.start_time.includes("T")) {
    const start = new Date(booking.start_time);
    const end = new Date(booking.end_time);
    return `${start.toLocaleDateString()} ${start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} to ${end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  }
  const dateStr = booking.booking_date || "";
  const startStr = booking.start_time.slice(0, 5);
  const endStr = booking.end_time.slice(0, 5);
  return `${dateStr ? `${dateStr} • ` : ""}${startStr} - ${endStr}`;
}

export default async function AdminBookingsPage() {
  const supabase = await createClient();

  // Query bookings with valid foreign-key relationship on customer_id
  const { data, error } = await supabase
    .from("bookings")
    .select(`
      id,
      court_id,
      customer_id,
      booking_date,
      start_time,
      end_time,
      total_price,
      status,
      courts ( name ),
      profiles!customer_id ( full_name, email )
    `)
    .order("start_time", { ascending: false });

  const bookings = (data as unknown as BookingRow[]) || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Bookings Management</h1>
        <Link href="/admin/bookings/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" /> New Booking
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Court Reservations</CardTitle>
        </CardHeader>
        <CardContent>
          {error && <p className="text-red-500 text-sm mb-4">Could not load bookings: {error.message}</p>}
          {!bookings.length && !error ? (
            <p className="text-muted-foreground text-sm">No bookings recorded yet.</p>
          ) : (
            <div className="divide-y">
              {bookings.map((b) => (
                <div key={b.id} className="py-3 flex justify-between items-center text-sm">
                  <div>
                    <div className="font-medium">
                      {b.courts?.name ?? "Court"} — {b.profiles?.full_name || b.profiles?.email || "Guest"}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      {formatBookingTime(b)}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">₱{b.total_price}</span>
                    <Badge variant={b.status === "confirmed" ? "default" : "outline"}>
                      {b.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

