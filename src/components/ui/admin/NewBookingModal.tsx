"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  Calendar,
  Clock,
  MapPin,
  User,
  Banknote,
  QrCode,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Receipt,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatTime, getManilaNow, doTimeRangesOverlap, addHoursToTime } from "@/lib/utils/date";
import {
  createAdminBookingAction,
  getRegisteredProfilesAction,
  getExistingBookingsForCourtDateAction,
  getActiveCourtsAction,
} from "@/app/admin/bookings/actions";

export interface CourtOption {
  id: string;
  name: string;
  hourlyRate?: number | null;
  hourly_rate?: number | null;
  status?: string;
  isActive?: boolean;
}

export interface ProfileOption {
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

export interface NewBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  courts?: CourtOption[];
  initialCourtId?: string;
  initialDate?: string;
  initialStartTime?: string;
  onSuccess?: (bookingId?: string) => void;
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

export function NewBookingModal({
  isOpen,
  onClose,
  courts: initialCourtsProp,
  initialCourtId,
  initialDate,
  initialStartTime,
  onSuccess,
}: NewBookingModalProps) {
  const { todayISO: manilaToday } = useMemo(() => getManilaNow(), []);

  // Courts list
  const [loadedCourts, setLoadedCourts] = useState<CourtOption[]>(initialCourtsProp || []);
  const [selectedCourtId, setSelectedCourtId] = useState(initialCourtId || "");
  const [bookingDate, setBookingDate] = useState(initialDate || manilaToday);
  const [startTime, setStartTime] = useState(initialStartTime || "09:00");
  const [durationHours, setDurationHours] = useState(1);

  // Customer states
  const [customerMode, setCustomerMode] = useState<"walk_in" | "registered">("walk_in");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [registeredProfiles, setRegisteredProfiles] = useState<ProfileOption[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(false);

  // Payment states
  const [paymentOption, setPaymentOption] = useState<"cash_paid" | "gcash_paid" | "pay_at_desk">("cash_paid");
  const [gcashReference, setGcashReference] = useState("");
  const [customPrice, setCustomPrice] = useState<string>("");

  // System states
  const [existingBookings, setExistingBookings] = useState<ExistingBooking[]>([]);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Reset or initialize state whenever modal opens with props
  useEffect(() => {
    if (isOpen) {
      if (initialCourtsProp && initialCourtsProp.length > 0) {
        setLoadedCourts(initialCourtsProp);
        if (initialCourtId && initialCourtsProp.some((c) => c.id === initialCourtId)) {
          setSelectedCourtId(initialCourtId);
        } else if (!selectedCourtId && initialCourtsProp.length > 0) {
          setSelectedCourtId(initialCourtsProp[0].id);
        }
      } else {
        // Fetch active courts if not passed
        getActiveCourtsAction().then((courts) => {
          if (courts && courts.length > 0) {
            setLoadedCourts(courts);
            if (initialCourtId && courts.some((c) => c.id === initialCourtId)) {
              setSelectedCourtId(initialCourtId);
            } else if (!selectedCourtId) {
              setSelectedCourtId(courts[0].id);
            }
          }
        }).catch(console.error);
      }

      setBookingDate(initialDate || manilaToday);
      setStartTime(initialStartTime || "09:00");
      setDurationHours(1);
      setCustomerMode("walk_in");
      setCustomerName("");
      setCustomerPhone("");
      setCustomerEmail("");
      setSelectedCustomerId("");
      setPaymentOption("cash_paid");
      setGcashReference("");
      setCustomPrice("");
      setErrorMessage(null);
    }
  }, [isOpen, initialCourtId, initialDate, initialStartTime, initialCourtsProp, manilaToday]);

  // Load registered profiles when mode is "registered"
  useEffect(() => {
    if (isOpen && customerMode === "registered" && registeredProfiles.length === 0) {
      setLoadingProfiles(true);
      getRegisteredProfilesAction()
        .then((profiles) => {
          setRegisteredProfiles(profiles);
        })
        .catch((err) => {
          console.error("Failed to load customer profiles:", err);
        })
        .finally(() => {
          setLoadingProfiles(false);
        });
    }
  }, [isOpen, customerMode, registeredProfiles.length]);

  // Check conflicts whenever selectedCourtId or bookingDate changes
  useEffect(() => {
    if (!isOpen || !selectedCourtId || !bookingDate) return;

    let isMounted = true;
    setLoadingSchedule(true);
    getExistingBookingsForCourtDateAction(selectedCourtId, bookingDate)
      .then((data) => {
        if (isMounted) {
          setExistingBookings(data);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch existing bookings:", err);
      })
      .finally(() => {
        if (isMounted) setLoadingSchedule(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, selectedCourtId, bookingDate]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submitting) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, submitting, onClose]);

  // Prevent background scroll while open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Available courts filtered to active/available
  const availableCourts = useMemo(() => {
    const list = loadedCourts.filter((c) => c.status !== "Not Available" && c.isActive !== false);
    return [...list].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  }, [loadedCourts]);

  const selectedCourt = useMemo(() => {
    return availableCourts.find((c) => c.id === selectedCourtId) || availableCourts[0];
  }, [availableCourts, selectedCourtId]);

  const endTime = useMemo(() => {
    return addHoursToTime(startTime, durationHours);
  }, [startTime, durationHours]);

  const courtHourlyRate = useMemo(() => {
    const rate = selectedCourt?.hourlyRate ?? selectedCourt?.hourly_rate;
    return rate != null ? Number(rate) : 300;
  }, [selectedCourt]);

  const calculatedTotal = courtHourlyRate * durationHours;
  const finalPrice = customPrice !== "" ? Math.max(0, parseFloat(customPrice) || 0) : calculatedTotal;

  // Conflict detection
  const conflict = useMemo(() => {
    if (!existingBookings || existingBookings.length === 0) return null;
    return existingBookings.find((b) => {
      const bStart = b.start_time.slice(0, 5);
      const bEnd = b.end_time.slice(0, 5);
      return doTimeRangesOverlap(bStart, bEnd, startTime, endTime);
    });
  }, [existingBookings, startTime, endTime]);

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

    if (customerMode === "walk_in" && !customerName.trim()) {
      setErrorMessage("Please enter the player or team name for this reservation.");
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await createAdminBookingAction({
        courtId: selectedCourtId,
        bookingDate,
        startTime: startTime.slice(0, 5),
        endTime: endTime.slice(0, 5),
        totalPrice: finalPrice,
        customerMode,
        customerId: customerMode === "registered" ? selectedCustomerId || null : null,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim() || undefined,
        customerEmail: customerEmail.trim() || undefined,
        paymentOption,
        gcashReference: gcashReference.trim() || undefined,
      });

      if (!res.success) {
        setErrorMessage(res.error || "Failed to create reservation.");
        setSubmitting(false);
      } else {
        onSuccess?.(res.bookingId);
        onClose();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred while saving.";
      setErrorMessage(msg);
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto"
      onClick={submitting ? undefined : onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-booking-dialog-title"
    >
      <div
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2.5">
              <h2
                id="new-booking-dialog-title"
                className="text-lg font-bold text-slate-900 dark:text-white tracking-tight"
              >
                New Court Reservation
              </h2>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 tabular-nums">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Desk (₱ PHP)
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Rapid counter booking for walk-in players and registered members.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
            aria-label="Close modal"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-5 max-h-[calc(85vh-130px)] overflow-y-auto">
          {/* Error Banner */}
          {errorMessage && (
            <div className="rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 p-3.5 text-xs text-rose-800 dark:text-rose-300 flex items-start gap-2.5">
              <AlertTriangle className="size-4 shrink-0 text-rose-600 mt-0.5" />
              <div>
                <p className="font-semibold">Unable to reserve slot</p>
                <p className="mt-0.5 opacity-90">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* 1. Court & Schedule */}
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <MapPin className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                Court & Date
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="modalBookingDate"
                  type="date"
                  value={bookingDate}
                  min={manilaToday}
                  onChange={(e) => setBookingDate(e.target.value)}
                  required
                  className="h-8 text-xs font-medium rounded-lg dark:border-slate-800 dark:bg-slate-950 cursor-pointer tabular-nums"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setBookingDate(manilaToday)}
                  className="h-8 text-xs font-semibold px-2.5 rounded-lg border-slate-200 dark:border-slate-800 cursor-pointer"
                >
                  Today
                </Button>
              </div>
            </div>

            {/* Master Court Selection Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {availableCourts.map((court) => {
                const isSelected = court.id === selectedCourtId;
                const rate = court.hourlyRate ?? court.hourly_rate ?? 300;
                return (
                  <button
                    key={court.id}
                    type="button"
                    onClick={() => setSelectedCourtId(court.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between min-h-[58px] ${
                      isSelected
                        ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 dark:border-emerald-500 text-emerald-950 dark:text-emerald-200 shadow-2xs scale-[1.01]"
                        : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-bold text-xs">{court.name}</span>
                      <span className={`size-1.5 rounded-full ${isSelected ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700"}`} />
                    </div>
                    <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mt-1 tabular-nums">
                      ₱{rate}/hr
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Time Slot & Duration */}
          <div className="space-y-2.5 pt-1">
            <Label className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <Clock className="size-3.5 text-emerald-600 dark:text-emerald-400" />
              Time & Duration
            </Label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="modalStartTime" className="text-xs text-slate-500 dark:text-slate-400">
                  Start Time
                </Label>
                <select
                  id="modalStartTime"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full mt-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-600 transition-colors cursor-pointer tabular-nums"
                >
                  {OPERATING_HOURS.map((hour) => (
                    <option key={hour} value={hour}>
                      {formatTime(hour)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label className="text-xs text-slate-500 dark:text-slate-400">
                  Duration
                </Label>
                <div className="grid grid-cols-4 gap-1.5 mt-1">
                  {[1, 2, 3, 4].map((hrs) => (
                    <button
                      key={hrs}
                      type="button"
                      onClick={() => setDurationHours(hrs)}
                      className={`py-1.5 px-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                        durationHours === hrs
                          ? "border-emerald-600 bg-emerald-600 text-white shadow-2xs"
                          : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                      }`}
                    >
                      {hrs}h
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Live Conflict Feedback */}
            {conflict ? (
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs flex items-center gap-2">
                <AlertTriangle className="size-4 shrink-0 text-amber-600" />
                <span>
                  <strong>Slot Occupied:</strong> {selectedCourt?.name} already has a reservation from {formatTime(conflict.start_time)} to {formatTime(conflict.end_time)}.
                </span>
              </div>
            ) : (
              <div className="p-2 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span>
                  Slot available: <strong>{formatTime(startTime)} – {formatTime(endTime)}</strong> ({durationHours}h) on {selectedCourt?.name}.
                </span>
              </div>
            )}
          </div>

          {/* 3. Player Details */}
          <div className="space-y-2.5 pt-1">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <User className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                Player Information
              </Label>

              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg">
                <button
                  type="button"
                  onClick={() => {
                    setCustomerMode("walk_in");
                    setSelectedCustomerId("");
                  }}
                  className={`text-xs font-semibold px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    customerMode === "walk_in"
                      ? "bg-white dark:bg-slate-950 text-slate-900 dark:text-white shadow-2xs"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  Walk-in Guest
                </button>
                <button
                  type="button"
                  onClick={() => setCustomerMode("registered")}
                  className={`text-xs font-semibold px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    customerMode === "registered"
                      ? "bg-white dark:bg-slate-950 text-slate-900 dark:text-white shadow-2xs"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  Registered Member
                </button>
              </div>
            </div>

            {customerMode === "registered" && (
              <div>
                <Label htmlFor="modalMemberSelect" className="text-xs text-slate-500 dark:text-slate-400">
                  Select Member Account
                </Label>
                {loadingProfiles ? (
                  <div className="flex items-center gap-2 p-2 text-xs text-slate-500">
                    <Loader2 className="size-3.5 animate-spin" /> Loading members…
                  </div>
                ) : (
                  <select
                    id="modalMemberSelect"
                    value={selectedCustomerId}
                    onChange={(e) => handleSelectMember(e.target.value)}
                    className="w-full mt-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-600 transition-colors cursor-pointer"
                  >
                    <option value="">— Choose a customer profile —</option>
                    {registeredProfiles.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.full_name || p.email} {p.email ? `(${p.email})` : ""}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <Label htmlFor="modalCustomerName" className="text-xs text-slate-500 dark:text-slate-400">
                  Player / Team Name <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="modalCustomerName"
                  type="text"
                  placeholder="e.g. Mark Ramos / Team Dink"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                  className="mt-1 h-9 text-xs rounded-xl dark:border-slate-800 dark:bg-slate-950"
                />
              </div>

              <div>
                <Label htmlFor="modalCustomerPhone" className="text-xs text-slate-500 dark:text-slate-400">
                  Contact Mobile (11 digits)
                </Label>
                <Input
                  id="modalCustomerPhone"
                  type="tel"
                  inputMode="numeric"
                  maxLength={11}
                  placeholder="e.g. 09171234567"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, "").slice(0, 11))}
                  className="mt-1 h-9 text-xs rounded-xl dark:border-slate-800 dark:bg-slate-950 font-mono"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="modalCustomerEmail" className="text-xs text-slate-500 dark:text-slate-400">
                Email Address <span className="text-slate-400 font-normal">(Optional for receipt delivery)</span>
              </Label>
              <Input
                id="modalCustomerEmail"
                type="email"
                placeholder="e.g. player@example.com"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="mt-1 h-9 text-xs rounded-xl dark:border-slate-800 dark:bg-slate-950"
              />
            </div>
          </div>

          {/* 4. Payment Settlement */}
          <div className="space-y-2.5 pt-1">
            <Label className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <Receipt className="size-3.5 text-emerald-600 dark:text-emerald-400" />
              Settlement & Payment
            </Label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentOption("cash_paid")}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  paymentOption === "cash_paid"
                    ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-950 dark:text-emerald-200 shadow-2xs"
                    : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                }`}
              >
                <div className="font-bold text-xs flex items-center gap-1.5">
                  <Banknote className="size-3.5 text-emerald-600 dark:text-emerald-400" /> Cash Paid Now
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Received at counter
                </span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentOption("gcash_paid")}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  paymentOption === "gcash_paid"
                    ? "border-blue-600 bg-blue-50 dark:bg-blue-950/50 text-blue-950 dark:text-blue-200 shadow-2xs"
                    : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                }`}
              >
                <div className="font-bold text-xs flex items-center gap-1.5">
                  <QrCode className="size-3.5 text-blue-600 dark:text-blue-400" /> GCash QR Paid
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Scanned at desk QR
                </span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentOption("pay_at_desk")}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  paymentOption === "pay_at_desk"
                    ? "border-amber-600 bg-amber-50 dark:bg-amber-950/50 text-amber-950 dark:text-amber-200 shadow-2xs"
                    : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                }`}
              >
                <div className="font-bold text-xs flex items-center gap-1.5">
                  <Clock className="size-3.5 text-amber-600 dark:text-amber-400" /> Pay at Desk
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Settles on arrival
                </span>
              </button>
            </div>

            {paymentOption === "gcash_paid" && (
              <div className="p-3 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/30 space-y-1">
                <Label htmlFor="modalGcashRef" className="text-xs font-semibold text-blue-900 dark:text-blue-200">
                  GCash Reference Number (Optional)
                </Label>
                <Input
                  id="modalGcashRef"
                  type="text"
                  placeholder="e.g. 1002 9481 2948"
                  value={gcashReference}
                  onChange={(e) => setGcashReference(e.target.value)}
                  className="h-8 bg-white dark:bg-slate-900 border-blue-200 dark:border-blue-800 font-mono text-xs"
                />
              </div>
            )}

            {/* Price Override */}
            <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
              <div>
                <Label htmlFor="modalCustomPrice" className="text-xs text-slate-700 dark:text-slate-300 font-semibold">
                  Fee Override (₱)
                </Label>
                <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                  Standard: ₱{courtHourlyRate}/hr × {durationHours}h = ₱{calculatedTotal.toFixed(2)}
                </p>
              </div>
              <div className="w-28">
                <Input
                  id="modalCustomPrice"
                  type="number"
                  min="0"
                  step="1"
                  placeholder={String(calculatedTotal)}
                  value={customPrice}
                  onChange={(e) => setCustomPrice(e.target.value)}
                  className="h-8 text-right font-bold tabular-nums text-xs dark:border-slate-800 dark:bg-slate-950"
                />
              </div>
            </div>
          </div>
        </form>

        {/* Modal Sticky Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950/80 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center justify-between sm:justify-start gap-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Due:
            </span>
            <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
              ₱{finalPrice.toFixed(2)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={submitting}
              className="text-xs font-semibold rounded-xl border-slate-200 dark:border-slate-800 cursor-pointer"
            >
              Cancel
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={handleSubmit}
              disabled={submitting || !!conflict || (customerMode === "walk_in" && !customerName.trim())}
              className="text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 className="size-3.5 animate-spin mr-1.5" />
                  Reserving…
                </>
              ) : (
                `Confirm & Lock Court (₱${finalPrice.toFixed(2)})`
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
