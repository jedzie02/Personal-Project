"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import NewBookingLoading from "./loading";
import { supabase } from "@/lib/supabase";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  Banknote,
  Clock,
  QrCode,
  ArrowLeft,
  Calendar,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  User,
  Phone,
  Mail,
  ShieldCheck,
  Receipt,
  Sparkles,
} from "lucide-react";
import { formatTime, getManilaNow, doTimeRangesOverlap } from "@/lib/utils/date";

interface CourtOption {
  id: string;
  name: string;
  hourly_rate: number | null;
  status: string;
}

interface ProfileOption {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
}

interface ExistingBooking {
  id: string;
  start_time: string;
  end_time: string;
  status: string;
}

const OPERATING_HOURS = [
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
  "21:00",
  "22:00",
];

function addHoursToTime(timeStr: string, hoursToAdd: number): string {
  const [h] = timeStr.split(":").map(Number);
  const newHour = (h + hoursToAdd) % 24;
  return `${newHour.toString().padStart(2, "0")}:00`;
}

function NewBookingForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramCourt = searchParams.get("courtId");
  const paramDate = searchParams.get("date");
  const paramTime = searchParams.get("startTime");

  const manilaToday = useMemo(() => getManilaNow().todayISO, []);

  // Form states
  const [courts, setCourts] = useState<CourtOption[]>([]);
  const [selectedCourtId, setSelectedCourtId] = useState(paramCourt || "");
  const [bookingDate, setBookingDate] = useState(paramDate || manilaToday);
  const [startTime, setStartTime] = useState(paramTime || "09:00");
  const [durationHours, setDurationHours] = useState(1);

  // Customer states
  const [customerMode, setCustomerMode] = useState<"walk_in" | "registered">("walk_in");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [registeredProfiles, setRegisteredProfiles] = useState<ProfileOption[]>([]);

  // Payment states
  const [paymentOption, setPaymentOption] = useState<"cash_paid" | "gcash_paid" | "pay_at_desk">("cash_paid");
  const [gcashReference, setGcashReference] = useState("");
  const [customPrice, setCustomPrice] = useState<string>("");

  // System status
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [existingBookings, setExistingBookings] = useState<ExistingBooking[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load courts and registered members on mount
  useEffect(() => {
    async function loadInitialData() {
      try {
        const [{ data: courtData }, { data: profileData }] = await Promise.all([
          supabase
            .from("courts")
            .select("id, name, hourly_rate, status")
            .eq("status", "Available")
            .order("name", { ascending: true }),
          supabase
            .from("profiles")
            .select("id, full_name, email, phone")
            .order("full_name", { ascending: true }),
        ]);

        if (courtData && courtData.length > 0) {
          setCourts(courtData);
          if (paramCourt && courtData.some((c) => c.id === paramCourt)) {
            setSelectedCourtId(paramCourt);
          } else {
            setSelectedCourtId(courtData[0].id);
          }
        }
        if (profileData) {
          setRegisteredProfiles(profileData);
        }
      } catch (err) {
        console.error("Failed to load initial booking data:", err);
      } finally {
        setLoadingInitial(false);
      }
    }
    loadInitialData();
  }, []);

  // Load existing bookings on selected court & date to check for conflicts
  useEffect(() => {
    if (!selectedCourtId || !bookingDate) return;

    async function checkAvailability() {
      try {
        const { data } = await supabase
          .from("bookings")
          .select("id, start_time, end_time, status")
          .eq("court_id", selectedCourtId)
          .eq("booking_date", bookingDate)
          .neq("status", "cancelled");

        setExistingBookings(data || []);
      } catch (err) {
        console.error("Failed to fetch existing bookings:", err);
      }
    }
    checkAvailability();
  }, [selectedCourtId, bookingDate]);

  // Derived court and timing values
  const selectedCourt = useMemo(
    () => courts.find((c) => c.id === selectedCourtId) || courts[0],
    [courts, selectedCourtId]
  );

  const endTime = useMemo(
    () => addHoursToTime(startTime, durationHours),
    [startTime, durationHours]
  );

  const baseHourlyRate = selectedCourt?.hourly_rate != null ? Number(selectedCourt.hourly_rate) : 25;
  const calculatedTotal = baseHourlyRate * durationHours;
  const finalPrice = customPrice !== "" ? parseFloat(customPrice) || 0 : calculatedTotal;

  // Conflict detection
  const conflict = useMemo(() => {
    if (!existingBookings || existingBookings.length === 0) return null;
    return existingBookings.find((b) => {
      const bStart = b.start_time.slice(0, 5);
      const bEnd = b.end_time.slice(0, 5);
      return doTimeRangesOverlap(bStart, bEnd, startTime, endTime);
    });
  }, [existingBookings, startTime, endTime]);

  // Handle member selection
  const handleSelectMember = (profileId: string) => {
    setSelectedCustomerId(profileId);
    const profile = registeredProfiles.find((p) => p.id === profileId);
    if (profile) {
      setCustomerName(profile.full_name || "");
      setCustomerEmail(profile.email || "");
      setCustomerPhone(profile.phone || "");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourtId || !bookingDate || !startTime) return;
    if (conflict) {
      setErrorMessage(
        `Time conflict: ${selectedCourt?.name} is already booked from ${formatTime(conflict.start_time)} to ${formatTime(conflict.end_time)}.`
      );
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const isPaid = paymentOption === "cash_paid" || paymentOption === "gcash_paid";
      const paymentStatus = isPaid ? "succeeded" : "pending";
      const paymentMethod =
        paymentOption === "cash_paid"
          ? "Cash walk in"
          : paymentOption === "gcash_paid"
          ? "GCash QR"
          : "Pay at Desk";

      let targetCustomerId: string | null = selectedCustomerId || null;

      // If walk-in guest has email or phone, look up or create profile
      if (customerMode === "walk_in" && (customerEmail.trim() || customerName.trim())) {
        const email = customerEmail.trim();
        const name = customerName.trim() || (email ? email.split("@")[0] : "Walk-in Guest");

        if (email) {
          const { data: existing } = await supabase
            .from("profiles")
            .select("id")
            .eq("email", email)
            .maybeSingle();

          if (existing) {
            targetCustomerId = existing.id;
          } else {
            const { data: created } = await supabase
              .from("profiles")
              .insert({
                email,
                full_name: name,
                phone: customerPhone.trim() || null,
                role: "customer",
              })
              .select("id")
              .single();

            if (created) targetCustomerId = created.id;
          }
        }
      }

      const gcashRef = paymentOption === "gcash_paid" ? gcashReference.trim() || null : null;
      const bookingPayload: Record<string, any> = {
        court_id: selectedCourtId,
        customer_id: targetCustomerId,
        booking_date: bookingDate,
        start_time: startTime.slice(0, 5),
        end_time: endTime.slice(0, 5),
        total_price: finalPrice,
        status: "confirmed",
        payment_status: paymentStatus,
        payment_method: paymentMethod,
      };
      if (gcashRef) {
        bookingPayload.payment_reference = gcashRef;
      }

      let { data: newBooking, error: bookingError } = await supabase
        .from("bookings")
        .insert(bookingPayload)
        .select("id")
        .single();

      if (bookingError && (bookingError.code === "42703" || bookingError.code === "PGRST204" || bookingError.message?.includes("payment_reference"))) {
        delete bookingPayload.payment_reference;
        if (gcashRef) {
          bookingPayload.payment_method = `${paymentMethod} (Ref: ${gcashRef})`;
        }
        const retry = await supabase
          .from("bookings")
          .insert(bookingPayload)
          .select("id")
          .single();
        newBooking = retry.data;
        bookingError = retry.error;
      }

      if (bookingError) {
        throw new Error(bookingError.message || "Failed to create booking reservation.");
      }

      // Record successful payment entry if settled immediately at counter
      if (newBooking && isPaid) {
        await supabase.from("payments").insert({
          booking_id: newBooking.id,
          amount: finalPrice,
          currency: "PHP",
          status: "succeeded",
          payment_method: paymentMethod,
        });
      }

      router.push("/admin/bookings");
      router.refresh();
    } catch (err: any) {
      console.error("Booking creation error:", err);
      setErrorMessage(err?.message || "An unexpected error occurred while saving the reservation.");
      setSubmitting(false);
    }
  };

  if (loadingInitial) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="size-8 animate-spin text-emerald-600" />
        <p className="text-sm text-slate-500 dark:text-slate-400">Loading facility courts and schedule...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Top Breadcrumb & Page Header */}
      <div>
        <Link
          href="/admin/bookings"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 mb-2 transition-colors"
        >
          <ArrowLeft className="size-3.5" /> Back to Bookings Directory
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Create Manual Booking
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Rapid counter entry for walk-in players, phone reservations, and desk bookings.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold self-start sm:self-auto">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Desk Mode (₱ PHP)
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 p-4 text-sm text-rose-800 dark:text-rose-300 flex items-start gap-3">
          <AlertTriangle className="size-5 shrink-0 text-rose-600 mt-0.5" />
          <div>
            <p className="font-semibold">Unable to reserve slot</p>
            <p className="text-xs mt-0.5 opacity-90">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Main 2-Column Responsive Layout */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left 2 Columns: Input Controls */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section 1: Court & Schedule Selection */}
          <Card className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="size-4 text-emerald-600 dark:text-emerald-400" />
                1. Court & Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {/* Date Selection */}
              <div>
                <Label htmlFor="bookingDate" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Reservation Date
                </Label>
                <div className="flex gap-2 mt-1.5">
                  <Input
                    id="bookingDate"
                    type="date"
                    value={bookingDate}
                    min={manilaToday}
                    onChange={(e) => setBookingDate(e.target.value)}
                    required
                    className="flex-1 rounded-xl dark:border-slate-800 dark:bg-slate-950"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setBookingDate(manilaToday)}
                    className="rounded-xl text-xs font-semibold dark:border-slate-800 dark:bg-slate-950"
                  >
                    Today
                  </Button>
                </div>
              </div>

              {/* Court Selection Grid */}
              <div>
                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Select Master Court
                </Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {courts.map((court) => {
                    const isSelected = court.id === selectedCourtId;
                    return (
                      <button
                        key={court.id}
                        type="button"
                        onClick={() => setSelectedCourtId(court.id)}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between min-h-[70px] ${
                          isSelected
                            ? "border-emerald-600 bg-emerald-50/80 dark:bg-emerald-950/60 dark:border-emerald-500 text-emerald-950 dark:text-emerald-200 shadow-2xs scale-[1.02]"
                            : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="font-bold text-xs">{court.name}</span>
                          <span className="size-2 rounded-full bg-emerald-500" />
                        </div>
                        <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mt-2">
                          ₱{court.hourly_rate ?? 25}/hr
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time Slot & Duration */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <Label htmlFor="startTime" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Start Time
                  </Label>
                  <select
                    id="startTime"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full mt-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-2.5 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-600 transition-colors cursor-pointer"
                  >
                    {OPERATING_HOURS.map((hour) => (
                      <option key={hour} value={hour}>
                        {formatTime(hour)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Duration
                  </Label>
                  <div className="grid grid-cols-3 gap-2 mt-1.5">
                    {[1, 2, 3].map((hrs) => (
                      <button
                        key={hrs}
                        type="button"
                        onClick={() => setDurationHours(hrs)}
                        className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                          durationHours === hrs
                            ? "border-emerald-600 bg-emerald-600 text-white shadow-xs"
                            : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                        }`}
                      >
                        {hrs} {hrs === 1 ? "Hour" : "Hours"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Conflict Alert Banner */}
              {conflict ? (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs flex items-center gap-2">
                  <AlertTriangle className="size-4 shrink-0 text-amber-600" />
                  <span>
                    <strong>Slot Occupied:</strong> {selectedCourt?.name} already has a reservation from {formatTime(conflict.start_time)} to {formatTime(conflict.end_time)}.
                  </span>
                </div>
              ) : (
                <div className="p-2.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span>
                    Slot available: <strong>{formatTime(startTime)} – {formatTime(endTime)}</strong> on {selectedCourt?.name}.
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Section 2: Player Information */}
          <Card className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <User className="size-4 text-emerald-600 dark:text-emerald-400" />
                  2. Player Information
                </CardTitle>

                {/* Mode toggle */}
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => {
                      setCustomerMode("walk_in");
                      setSelectedCustomerId("");
                    }}
                    className={`text-xs font-semibold px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      customerMode === "walk_in"
                        ? "bg-white dark:bg-slate-950 text-slate-900 dark:text-white shadow-2xs"
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    Walk-in Player
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomerMode("registered")}
                    className={`text-xs font-semibold px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      customerMode === "registered"
                        ? "bg-white dark:bg-slate-950 text-slate-900 dark:text-white shadow-2xs"
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    Registered Member
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-3.5">
              {customerMode === "registered" ? (
                <div>
                  <Label htmlFor="memberSelect" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Select Member Account
                  </Label>
                  <select
                    id="memberSelect"
                    value={selectedCustomerId}
                    onChange={(e) => handleSelectMember(e.target.value)}
                    className="w-full mt-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-600 transition-colors cursor-pointer"
                  >
                    <option value="">— Choose a customer profile —</option>
                    {registeredProfiles.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.full_name || p.email} {p.email ? `(${p.email})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="customerName" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Player / Team Name <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="customerName"
                    type="text"
                    placeholder="e.g. Mark Ramos / Team Pickle"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    required
                    className="mt-1.5 rounded-xl dark:border-slate-800 dark:bg-slate-950"
                  />
                </div>

                <div>
                  <Label htmlFor="customerPhone" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Contact Mobile Number
                  </Label>
                  <Input
                    id="customerPhone"
                    type="tel"
                    placeholder="e.g. +63 917 123 4567"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="mt-1.5 rounded-xl dark:border-slate-800 dark:bg-slate-950"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="customerEmail" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Email Address <span className="text-slate-400 font-normal">(Optional receipt delivery)</span>
                </Label>
                <Input
                  id="customerEmail"
                  type="email"
                  placeholder="e.g. player@example.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="mt-1.5 rounded-xl dark:border-slate-800 dark:bg-slate-950"
                />
              </div>
            </CardContent>
          </Card>

          {/* Section 3: Payment Settlement */}
          <Card className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Receipt className="size-4 text-emerald-600 dark:text-emerald-400" />
                3. Payment & Settlement
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div>
                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Payment Collection Method
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* Option 1: Cash Paid Now */}
                  <button
                    type="button"
                    onClick={() => setPaymentOption("cash_paid")}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      paymentOption === "cash_paid"
                        ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-950 dark:text-emerald-200 shadow-2xs"
                        : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center gap-1.5">
                      <Banknote className="size-4 text-emerald-600 dark:text-emerald-400" /> Cash Paid Now
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Received at counter
                    </span>
                  </button>

                  {/* Option 2: GCash QR Paid Now */}
                  <button
                    type="button"
                    onClick={() => setPaymentOption("gcash_paid")}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      paymentOption === "gcash_paid"
                        ? "border-blue-600 bg-blue-50 dark:bg-blue-950/50 text-blue-950 dark:text-blue-200 shadow-2xs"
                        : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center gap-1.5">
                      <QrCode className="size-4 text-blue-600 dark:text-blue-400" /> GCash QR Paid
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Scanned at desk QR
                    </span>
                  </button>

                  {/* Option 3: Pay at Desk */}
                  <button
                    type="button"
                    onClick={() => setPaymentOption("pay_at_desk")}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      paymentOption === "pay_at_desk"
                        ? "border-amber-600 bg-amber-50 dark:bg-amber-950/50 text-amber-950 dark:text-amber-200 shadow-2xs"
                        : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center gap-1.5">
                      <Clock className="size-4 text-amber-600 dark:text-amber-400" /> Pay at Desk
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Player settles on arrival
                    </span>
                  </button>
                </div>
              </div>

              {/* GCash Reference Input when GCash option active */}
              {paymentOption === "gcash_paid" && (
                <div className="p-3.5 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/60 dark:bg-blue-950/30 space-y-1.5">
                  <Label htmlFor="gcashRef" className="text-xs font-semibold text-blue-900 dark:text-blue-200">
                    GCash Reference Number
                  </Label>
                  <Input
                    id="gcashRef"
                    type="text"
                    placeholder="e.g. 1002 9481 2948"
                    value={gcashReference}
                    onChange={(e) => setGcashReference(e.target.value)}
                    className="bg-white dark:bg-slate-900 border-blue-200 dark:border-blue-800 font-mono text-xs"
                  />
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    Tip: Enter the customer&apos;s transaction reference code from their GCash app receipt.
                  </p>
                </div>
              )}

              {/* Price adjustment / override */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <Label htmlFor="customPrice" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Fee Override (₱)
                  </Label>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Default: ₱{baseHourlyRate}/hr × {durationHours} hr = ₱{calculatedTotal.toFixed(2)}
                  </p>
                </div>
                <div className="w-32">
                  <Input
                    id="customPrice"
                    type="number"
                    min="0"
                    step="1"
                    placeholder={String(calculatedTotal)}
                    value={customPrice}
                    onChange={(e) => setCustomPrice(e.target.value)}
                    className="text-right font-bold tabular-nums dark:border-slate-800 dark:bg-slate-950"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right 1 Column: Sticky Summary Receipt & Submit */}
        <div className="lg:sticky lg:top-8 space-y-4">
          <Card className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md overflow-hidden">
            <div className="p-4 bg-emerald-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-5 text-emerald-200" />
                <h3 className="font-bold text-sm tracking-tight">Booking Summary</h3>
              </div>
              <span className="text-xs font-semibold bg-emerald-700 px-2.5 py-0.5 rounded-full text-emerald-100">
                Shift Desk
              </span>
            </div>

            <CardContent className="p-4 space-y-3.5 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold text-xs flex items-center gap-1.5">
                  <MapPin className="size-3 text-emerald-600 dark:text-emerald-400" /> Court
                </span>
                <span className="font-bold text-slate-900 dark:text-white">{selectedCourt?.name}</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold text-xs flex items-center gap-1.5">
                  <Calendar className="size-3 text-emerald-600 dark:text-emerald-400" /> Date
                </span>
                <span className="font-semibold text-slate-900 dark:text-white">{bookingDate}</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold text-xs flex items-center gap-1.5">
                  <Clock className="size-3 text-emerald-600 dark:text-emerald-400" /> Time
                </span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {formatTime(startTime)} – {formatTime(endTime)} ({durationHours}h)
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold text-xs flex items-center gap-1.5">
                  <User className="size-3 text-emerald-600 dark:text-emerald-400" /> Player
                </span>
                <span className="font-bold text-slate-900 dark:text-white truncate max-w-[150px]">
                  {customerName || "Walk-in Guest"}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold text-xs flex items-center gap-1.5">
                  <Receipt className="size-3 text-emerald-600 dark:text-emerald-400" /> Settlement
                </span>
                <span className={`px-2 py-0.5 rounded-full font-bold text-xs border ${
                  paymentOption === "cash_paid"
                    ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                    : paymentOption === "gcash_paid"
                    ? "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
                    : "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                }`}>
                  {paymentOption === "cash_paid"
                    ? "Paid (Cash)"
                    : paymentOption === "gcash_paid"
                    ? "Paid (GCash)"
                    : "Pay at Desk"}
                </span>
              </div>

              {/* Total Calculation */}
              <div className="pt-2 flex items-center justify-between text-sm">
                <span className="font-bold text-slate-700 dark:text-slate-300">Total Due</span>
                <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
                  ₱{finalPrice.toFixed(2)}
                </span>
              </div>

              {/* Confirmation CTA */}
              <div className="pt-2 space-y-2">
                <Button
                  type="submit"
                  disabled={submitting || !!conflict}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs tracking-wide shadow-sm hover:shadow-md transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin mr-2" />
                      Reserving Slot…
                    </>
                  ) : (
                    `Confirm & Lock Court (₱${finalPrice.toFixed(2)})`
                  )}
                </Button>

                <Link href="/admin/bookings" className="block text-center">
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full text-xs text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                  >
                    Cancel
                  </Button>
                </Link>
              </div>

              <p className="text-xs text-slate-400 dark:text-slate-500 text-center leading-relaxed">
                Reservation records immediately to database. Schedule timeline updates in real time.
              </p>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}

export default function NewBookingPage() {
  return (
    <Suspense fallback={<NewBookingLoading />}>
      <NewBookingForm />
    </Suspense>
  );
}
