"use client";

import React, { useState, useEffect } from "react";
import { X, AlertCircle, Loader2, Calendar, Clock, MapPin, Users, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { formatTime } from "@/lib/utils/date";

const START_HOURS = [
  "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00",
  "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00",
];
const END_HOURS = [
  "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00",
  "17:00", "18:00", "19:00", "20:00", "21:00", "22:00", "23:00",
];

export interface CreateOpenPlaySessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: FormData) => Promise<{ ok: boolean; error?: string }>;
  courts: { id: string; name: string }[];
  todayISO: string;
  isSubmitting?: boolean;
  errorMessage?: string | null;
}

function CreateOpenPlaySessionModalContent({
  onClose,
  onSubmit,
  courts,
  todayISO,
  isSubmitting = false,
  errorMessage = null,
}: Omit<CreateOpenPlaySessionModalProps, "isOpen">) {
  const [courtId, setCourtId] = useState(courts[0]?.id ?? "");
  const [date, setDate] = useState(todayISO);
  const [startTime, setStartTime] = useState("18:00");
  const [endTime, setEndTime] = useState("20:00");
  const [pricePerPlayer, setPricePerPlayer] = useState("100");
  const [playerCap, setPlayerCap] = useState("8");
  const [localError, setLocalError] = useState<string | null>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSubmitting, onClose]);

  // Calculate session duration in hours
  const startHour = parseInt(startTime.split(":")[0], 10);
  const endHour = parseInt(endTime.split(":")[0], 10);
  const durationHours = endHour - startHour;
  const isTimeInvalid = durationHours <= 0;

  // Potential gross revenue
  const priceNum = Math.max(0, parseInt(pricePerPlayer, 10) || 0);
  const capNum = Math.max(1, parseInt(playerCap, 10) || 1);
  const maxGross = priceNum * capNum;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLocalError(null);

    if (isTimeInvalid) {
      setLocalError("End time must be later than start time.");
      return;
    }

    const formData = new FormData();
    formData.append("courtId", courtId || courts[0]?.id || "");
    formData.append("date", date);
    formData.append("startTime", startTime);
    formData.append("endTime", endTime);
    formData.append("pricePerPlayer", String(priceNum));
    formData.append("playerCap", String(capNum));

    const res = await onSubmit(formData);
    if (!res.ok) {
      setLocalError(res.error || "Could not create session.");
    } else {
      onClose();
    }
  };

  const activeError = localError || errorMessage;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 sm:p-6 overflow-y-auto"
      onClick={isSubmitting ? undefined : onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-session-dialog-title"
    >
      <div
        className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-7 space-y-6 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Dialog Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="space-y-1">
            <h3
              id="create-session-dialog-title"
              className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2"
            >
              <Users className="size-5 text-blue-600 dark:text-blue-400 shrink-0" />
              <span>Create Open Play Session</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Automatically places an overlap-proof hold on this court so private bookings cannot conflict with it.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg p-1.5 transition-colors cursor-pointer disabled:opacity-50"
            aria-label="Close dialog"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Error Alert */}
        {activeError && (
          <div className="flex items-start gap-2.5 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 p-3.5 text-xs text-red-700 dark:text-red-300">
            <AlertCircle className="size-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <span className="font-medium">{activeError}</span>
          </div>
        )}

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Section 1: Court & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="session-court" className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <MapPin className="size-3.5 text-blue-600 dark:text-blue-400" />
                <span>Court</span>
              </Label>
              <select
                id="session-court"
                value={courtId}
                onChange={(e) => setCourtId(e.target.value)}
                disabled={isSubmitting || courts.length === 0}
                required
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2.5 text-xs font-medium text-slate-900 dark:text-white shadow-2xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              >
                {courts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="session-date" className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Calendar className="size-3.5 text-blue-600 dark:text-blue-400" />
                <span>Session Date</span>
              </Label>
              <Input
                id="session-date"
                type="date"
                value={date}
                min={todayISO}
                onChange={(e) => setDate(e.target.value)}
                required
                disabled={isSubmitting}
                className="h-10 text-xs tabular-nums rounded-xl border-slate-200 dark:border-slate-700 shadow-2xs"
              />
            </div>
          </div>

          {/* Section 2: Time Window */}
          <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="session-start-time" className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Clock className="size-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Start Time</span>
                </Label>
                <select
                  id="session-start-time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-medium text-slate-900 dark:text-white tabular-nums shadow-2xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                >
                  {START_HOURS.map((h) => (
                    <option key={h} value={h}>
                      {formatTime(h)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="session-end-time" className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Clock className="size-3.5 text-blue-600 dark:text-blue-400" />
                  <span>End Time</span>
                </Label>
                <select
                  id="session-end-time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-medium text-slate-900 dark:text-white tabular-nums shadow-2xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                >
                  {END_HOURS.map((h) => (
                    <option key={h} value={h}>
                      {formatTime(h)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Live Duration Indicator */}
            <div className="pt-1">
              {isTimeInvalid ? (
                <div className="text-xs font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                  <AlertCircle className="size-3.5 shrink-0" />
                  <span>End time must be after start time ({formatTime(startTime)}).</span>
                </div>
              ) : (
                <div className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 font-semibold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 tabular-nums">
                    {durationHours} {durationHours === 1 ? "hour" : "hours"} duration
                  </span>
                  <span>({formatTime(startTime)} – {formatTime(endTime)})</span>
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Pricing & Capacity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="session-price" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Price per Player (₱)
              </Label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-xs font-bold text-slate-500 dark:text-slate-400 select-none">
                  ₱
                </span>
                <Input
                  id="session-price"
                  type="number"
                  min="0"
                  step="1"
                  value={pricePerPlayer}
                  onChange={(e) => setPricePerPlayer(e.target.value)}
                  className="pl-7 h-10 text-xs tabular-nums rounded-xl border-slate-200 dark:border-slate-700 shadow-2xs"
                  placeholder="100"
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="session-cap" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Player Cap
              </Label>
              <Input
                id="session-cap"
                type="number"
                min="1"
                step="1"
                value={playerCap}
                onChange={(e) => setPlayerCap(e.target.value)}
                className="h-10 text-xs tabular-nums rounded-xl border-slate-200 dark:border-slate-700 shadow-2xs"
                placeholder="8"
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Gross Revenue Preview */}
          <div className="rounded-xl border border-blue-100 dark:border-blue-900/50 bg-blue-50/60 dark:bg-blue-950/30 p-3 text-xs text-blue-900 dark:text-blue-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-medium">
              <Sparkles className="size-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
              <span>Potential Session Revenue</span>
            </span>
            <span className="font-extrabold tabular-nums">
              ₱{maxGross.toLocaleString("en-PH")}
              <span className="font-normal text-blue-700 dark:text-blue-400 text-xs ml-1">
                ({capNum} spots × ₱{priceNum})
              </span>
            </span>
          </div>

          {/* Dialog Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl text-xs font-semibold px-4 py-2 cursor-pointer border-slate-200 dark:border-slate-700"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || isTimeInvalid || courts.length === 0}
              className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-5 py-2 shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>Scheduling Session…</span>
                </>
              ) : (
                <span>Create Session</span>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function CreateOpenPlaySessionModal(props: CreateOpenPlaySessionModalProps) {
  if (!props.isOpen) return null;
  return <CreateOpenPlaySessionModalContent {...props} />;
}
