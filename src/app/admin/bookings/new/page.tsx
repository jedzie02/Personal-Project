"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Banknote, Clock } from "lucide-react";

export default function NewBookingPage() {
  const router = useRouter();
  const [courts, setCourts] = useState<{ id: string; name: string; hourly_rate: number | null }[]>([]);
  const [courtId, setCourtId] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [price, setPrice] = useState("25");
  const [paymentOption, setPaymentOption] = useState<"cash_paid" | "pay_at_desk">("cash_paid");
  const [submitting, setSubmitting] = useState(false);

  // Fetch active courts for selector
  useEffect(() => {
    async function loadCourts() {
      const { data } = await supabase
        .from("courts")
        .select("id, name, hourly_rate")
        .eq("status", "Available")
        .order("name", { ascending: true });
      if (data && data.length > 0) {
        setCourts(data);
        setCourtId(data[0].id);
        if (data[0].hourly_rate != null) {
          setPrice(String(data[0].hourly_rate));
        }
      }
    }
    loadCourts();
  }, []);

  const handleCourtChange = (id: string) => {
    setCourtId(id);
    const selected = courts.find((c) => c.id === id);
    if (selected && selected.hourly_rate != null) {
      setPrice(String(selected.hourly_rate));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courtId || !startTime || !endTime) return;

    setSubmitting(true);
    const [bookingDate, startH] = startTime.includes("T")
      ? startTime.split("T")
      : [new Date().toISOString().slice(0, 10), startTime];
    const [, endH] = endTime.includes("T") ? endTime.split("T") : ["", endTime];

    const isPaid = paymentOption === "cash_paid";
    const paymentStatus = isPaid ? "succeeded" : "pending";
    const parsedPrice = parseFloat(price) || 25;

    const { data: newBooking, error } = await supabase
      .from("bookings")
      .insert({
        court_id: courtId,
        booking_date: bookingDate,
        start_time: startH.slice(0, 5),
        end_time: endH.slice(0, 5),
        total_price: parsedPrice,
        status: "confirmed",
        payment_status: paymentStatus,
      })
      .select("id")
      .single();

    if (!error && newBooking && isPaid) {
      await supabase.from("payments").insert({
        booking_id: newBooking.id,
        amount: parsedPrice,
        currency: "PHP",
        status: "succeeded",
      });
    }

    setSubmitting(false);
    if (!error) {
      router.push("/admin/bookings");
      router.refresh();
    } else {
      alert(`Booking creation failed: ${error.message}`);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Create Manual Booking</h1>
      <Card>
        <CardHeader>
          <CardTitle>Reservation Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Select Court</Label>
              <select
                className="w-full border rounded-md p-2 text-sm"
                value={courtId}
                onChange={(e) => handleCourtChange(e.target.value)}
              >
                {courts.map((court) => (
                  <option key={court.id} value={court.id}>
                    {court.name} {court.hourly_rate != null ? `(₱${court.hourly_rate}/hr)` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Start Time</Label>
              <Input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>
            <div>
              <Label>End Time</Label>
              <Input
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
            </div>
            <div>
              <Label>Price (₱)</Label>
              <Input
                type="number"
                min="0"
                step="any"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </div>
            <div>
              <Label>Payment Collection</Label>
              <div className="grid grid-cols-2 gap-3 mt-1.5">
                <button
                  type="button"
                  onClick={() => setPaymentOption("cash_paid")}
                  className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                    paymentOption === "cash_paid"
                      ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200"
                      : "border-slate-200 hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <div className="font-semibold text-sm flex items-center gap-1.5">
                    <Banknote className="size-4 text-emerald-600" /> Cash Paid Now
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Collected at desk
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentOption("pay_at_desk")}
                  className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                    paymentOption === "pay_at_desk"
                      ? "border-amber-600 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200"
                      : "border-slate-200 hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <div className="font-semibold text-sm flex items-center gap-1.5">
                    <Clock className="size-4 text-amber-600" /> Pay at Desk
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Collect upon player arrival
                  </div>
                </button>
              </div>
            </div>
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Confirm Booking
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
