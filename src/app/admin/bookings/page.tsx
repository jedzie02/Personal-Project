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
      payment_method,
      courts ( name ),
      profiles!customer_id ( full_name, email )
    `)
    .order("start_time", { ascending: false });

  const bookings = (data as unknown as (BookingRow & { payment_method?: string })[]) || [];

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
              {bookings.map((b) => {
                const isGCash = b.payment_method?.toLowerCase().includes("gcash") || b.payment_method?.toLowerCase().includes("qr");
                const refMatch = b.payment_method?.includes("Ref:") ? b.payment_method.split("Ref:")[1]?.replace(/[()]/g, "").trim() : null;

                return (
                  <div key={b.id} className="py-3 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1.5 text-sm">
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        <span>{b.courts?.name ?? "Court"} — {b.profiles?.full_name || b.profiles?.email || "Guest"}</span>
                        {refMatch && (
                          <span className="text-[10px] font-mono bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-200">
                            Ref: {refMatch}
                          </span>
                        )}
                      </div>
                      <div className="text-muted-foreground text-xs flex items-center gap-2 mt-0.5">
                        <span>{formatBookingTime(b)}</span>
                        <span>•</span>
                        <span className="font-medium text-slate-700">{b.payment_method || "Cash walk in"}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold">₱{b.total_price}</span>
                      <Badge variant={b.status === "confirmed" ? "default" : "outline"}>
                        {b.status}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

