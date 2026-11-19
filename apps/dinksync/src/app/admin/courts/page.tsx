"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, X, AlertCircle } from "lucide-react";
import { AddCourtModal, CourtStatus, STATUS_OPTIONS } from "@/components/ui/admin/AddCourtModal";
import {
  updateCourtStatusAction,
  updateCourtRateAction,
  createCourtModalAction,
} from "@/app/admin/courts/actions";
import {
  decodeDescriptionAndPricingRules,
  formatCourtCardRuleSummary,
  formatHourAMPM,
  type CourtPricingRule,
} from "@/lib/utils/court-pricing";

const START_HOUR_OPTIONS = Array.from({ length: 18 }, (_, i) => {
  const h = i + 6; // 06:00 to 23:00
  const val = `${h.toString().padStart(2, "0")}:00`;
  return { value: val, label: formatHourAMPM(val) };
});

const END_HOUR_OPTIONS = [
  ...Array.from({ length: 17 }, (_, i) => {
    const h = i + 7; // 07:00 to 23:00
    const val = `${h.toString().padStart(2, "0")}:00`;
    return { value: val, label: formatHourAMPM(val) };
  }),
  { value: "00:00", label: "12:00 AM" },
];

interface Court {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  status: CourtStatus;
  hourly_rate?: number | null;
  pricing_rules?: CourtPricingRule[];
  created_at?: string;
}

function fromDbStatus(status?: string | null, isActive?: boolean): CourtStatus {
  if (status === "Maintenance") return "Maintenance";
  if (isActive === false || status === "Deactivated" || status === "Not Available") return "Not Available";
  return "Available";
}

function statusBadge(status: CourtStatus) {
  switch (status) {
    case "Available":
      return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800">Available</Badge>;
    case "Maintenance":
      return <Badge className="bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800">Maintenance</Badge>;
    case "Not Available":
      return <Badge variant="secondary" className="dark:bg-slate-800 dark:text-slate-300">Unavailable</Badge>;
  }
}

export default function AdminCourtsPage() {
  const router = useRouter();
  const [courts, setCourts] = useState<Court[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [isAddCourtOpen, setIsAddCourtOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Edit Rate dialog state
  const [editingCourt, setEditingCourt] = useState<Court | null>(null);
  const [newRate, setNewRate] = useState("");
  const [editingRules, setEditingRules] = useState<Array<{ startTime: string; endTime: string; rate: string }>>([]);
  const [applyRateToAll, setApplyRateToAll] = useState(false);
  const [savingRate, setSavingRate] = useState(false);

  const fetchCourts = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("courts")
      .select("id, name, description, is_active, status, hourly_rate, created_at")
      .order("name", { ascending: true });

    if (!error && data) {
      setCourts(
        (data as Partial<Court>[])
          .map((c) => {
            const { description, pricingRules } = decodeDescriptionAndPricingRules(c.description);
            return {
              id: c.id ?? "",
              name: c.name ?? "",
              description,
              is_active: c.is_active ?? true,
              hourly_rate: c.hourly_rate != null ? Number(c.hourly_rate) : 300,
              pricing_rules: pricingRules,
              status: fromDbStatus(c.status, c.is_active),
            };
          })
          .sort((a: Court, b: Court) => a.name.localeCompare(b.name, undefined, { numeric: true }))
      );
    } else if (error) {
      setErrorMessage("Unable to load courts. Please refresh the page to try again.");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    let ignore = false;

    async function load() {
      const { data, error } = await supabase
        .from("courts")
        .select("id, name, description, is_active, status, hourly_rate, created_at")
        .order("name", { ascending: true });

      if (ignore) return;
      if (!error && data) {
        setCourts(
          (data as Partial<Court>[])
            .map((c) => {
              const { description, pricingRules } = decodeDescriptionAndPricingRules(c.description);
              return {
                id: c.id ?? "",
                name: c.name ?? "",
                description,
                is_active: c.is_active ?? true,
                hourly_rate: c.hourly_rate != null ? Number(c.hourly_rate) : 300,
                pricing_rules: pricingRules,
                status: fromDbStatus(c.status, c.is_active),
              };
            })
            .sort((a: Court, b: Court) => a.name.localeCompare(b.name, undefined, { numeric: true }))
        );
      } else if (error) {
        setErrorMessage("Unable to load courts. Please refresh the page to try again.");
      }
      setLoading(false);
    }

    load();
    return () => {
      ignore = true;
    };
  }, []);

  const updateCourtStatus = async (courtId: string, status: CourtStatus) => {
    setErrorMessage(null);
    const court = courts.find((c) => c.id === courtId);

    // Optimistic UI
    setCourts((prev) =>
      prev.map((c) =>
        c.id === courtId
          ? { ...c, status, is_active: status === "Available" || status === "Maintenance" }
          : c
      )
    );

    const result = await updateCourtStatusAction(courtId, status);

    if (!result.success) {
      console.error("Failed to update court status:", result.error);
      fetchCourts(); // Rollback
      setErrorMessage(
        `Unable to update status for ${court?.name ?? "this court"}. ${result.error ?? "Please try again."}`
      );
    } else {
      router.refresh();
    }
  };

  const handleCreateCourt = async (courtData: {
    name: string;
    description: string;
    hourlyRate: string;
    status: CourtStatus;
  }) => {
    if (!courtData.name.trim()) return;

    setCreating(true);
    setErrorMessage(null);

    const parsedRate = parseFloat(courtData.hourlyRate);
    const result = await createCourtModalAction({
      name: courtData.name.trim(),
      description: courtData.description.trim() || null,
      status: courtData.status,
      hourlyRate: Number.isNaN(parsedRate) ? 300 : parsedRate,
    });

    setCreating(false);

    if (result.success) {
      setIsAddCourtOpen(false);
      fetchCourts();
      router.refresh();
    } else {
      setErrorMessage(
        result.error
          ? `Unable to add court: ${result.error}`
          : "Unable to add court. Please verify the court name is unique and try again."
      );
    }
  };

  const handleUpdateRate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourt) return;
    const rateVal = parseFloat(newRate);
    if (isNaN(rateVal) || rateVal < 0) return;

    const parsedRules: CourtPricingRule[] = [];
    for (const r of editingRules) {
      const rVal = parseFloat(r.rate);
      if (isNaN(rVal) || rVal < 0) {
        setErrorMessage("Please enter a valid positive rate for every custom time range.");
        return;
      }
      const startH = parseInt(r.startTime.split(":")[0], 10);
      const rawEndH = parseInt(r.endTime.split(":")[0], 10);
      const endH = rawEndH === 0 ? 24 : rawEndH;
      if (startH >= endH) {
        setErrorMessage(`End time (${formatHourAMPM(r.endTime)}) must be after start time (${formatHourAMPM(r.startTime)}).`);
        return;
      }
      parsedRules.push({
        startTime: r.startTime,
        endTime: r.endTime,
        rate: rVal,
      });
    }

    setSavingRate(true);
    setErrorMessage(null);

    const result = await updateCourtRateAction(editingCourt.id, rateVal, {
      pricingRules: parsedRules,
      applyToAll: applyRateToAll,
    });

    setSavingRate(false);

    if (!result.success) {
      setErrorMessage(
        result.error
          ? `Unable to update hourly rate: ${result.error}`
          : `Unable to update hourly rate for ${editingCourt.name}. Please try again.`
      );
      return;
    }

    setCourts((prev) =>
      prev.map((c) =>
        applyRateToAll || c.id === editingCourt.id
          ? { ...c, hourly_rate: rateVal, pricing_rules: parsedRules }
          : c
      )
    );
    setEditingCourt(null);
    router.refresh();
  };

  const countByStatus = (s: CourtStatus) => courts.filter((c) => c.status === s).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Courts</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage court availability and hourly pricing for player bookings.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:border-emerald-800 dark:text-emerald-300">
            {countByStatus("Available")} Available
          </Badge>
          <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:border-amber-800 dark:text-amber-300">
            {countByStatus("Maintenance")} Maintenance
          </Badge>
          <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-700 dark:bg-slate-800/80 dark:border-slate-700 dark:text-slate-300">
            {countByStatus("Not Available")} Unavailable
          </Badge>
          <Button
            onClick={() => {
              setErrorMessage(null);
              setIsAddCourtOpen(true);
            }}
            size="sm"
            className="h-8 text-xs font-semibold gap-1.5 ml-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add Court
          </Button>
        </div>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="flex items-start justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-red-700 hover:text-red-900 text-xs font-semibold underline shrink-0 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Courts List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          <p className="mt-2 text-xs text-muted-foreground">Loading venue courts...</p>
        </div>
      ) : courts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-12 text-center bg-slate-50/50 dark:bg-slate-900/50">
          <h3 className="font-semibold text-slate-900 dark:text-white">No courts created yet</h3>
          <p className="mt-1 text-sm text-muted-foreground max-w-sm mx-auto">
            Add your first court above to set availability and start accepting reservations.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courts.map((court) => (
            <Card key={court.id}>
              <CardContent className="pt-6 space-y-4">
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <h3 className="font-semibold text-lg text-slate-900 dark:text-white">{court.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {court.description || "No location notes provided"}
                    </p>
                  </div>
                  {statusBadge(court.status)}
                </div>

                {/* Status Selection */}
                <div className="space-y-1.5 pt-1">
                  <Label htmlFor={`status-${court.id}`} className="text-xs text-muted-foreground">
                    Availability Status
                  </Label>
                  <select
                    id={`status-${court.id}`}
                    value={court.status}
                    onChange={(e) => updateCourtStatus(court.id, e.target.value as CourtStatus)}
                    aria-label={`Change status for ${court.name}`}
                    className="w-full border border-slate-200 dark:border-slate-700 rounded-md px-3 py-1.5 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium shadow-xs focus:ring-2 focus:ring-blue-500"
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Hourly Rate & Actions */}
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs text-muted-foreground block">Default Hourly Rate</span>
                      <span className="text-base font-bold text-slate-900 dark:text-white">
                        ₱{court.hourly_rate ?? 300}
                        <span className="text-xs font-normal text-muted-foreground">/hr</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Link
                        href={`/admin/courts/${court.id}/edit`}
                        className={buttonVariants({
                          variant: "ghost",
                          size: "sm",
                          className: "text-xs text-muted-foreground hover:text-foreground h-8 px-2.5",
                        })}
                      >
                        Edit Details
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setErrorMessage(null);
                          setEditingCourt(court);
                          setNewRate(String(court.hourly_rate ?? 300));
                          setEditingRules(
                            (court.pricing_rules ?? []).map((r) => ({
                              startTime: r.startTime,
                              endTime: r.endTime,
                              rate: String(r.rate),
                            }))
                          );
                          setApplyRateToAll(false);
                        }}
                        className="text-xs h-8 px-2.5 cursor-pointer"
                        aria-label={`Edit hourly rate for ${court.name}`}
                      >
                        Edit Rate
                      </Button>
                    </div>
                  </div>
                  {court.pricing_rules && court.pricing_rules.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {court.pricing_rules.map((rule, idx) => (
                        <span
                          key={`${rule.startTime}-${rule.endTime}-${idx}`}
                          className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800/70"
                        >
                          {formatCourtCardRuleSummary(rule)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Rate Dialog */}
      {editingCourt && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
          onClick={() => setEditingCourt(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-rate-title"
        >
          <div
            className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center">
              <div>
                <h3 id="edit-rate-title" className="font-semibold text-lg text-slate-900 dark:text-white">
                  Edit Hourly Rate &amp; Time Prices
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Configure default and time-window pricing for {editingCourt.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingCourt(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded p-1 cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateRate} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="court-hourly-rate" className="text-sm font-medium">
                  Default / Base Hourly Rate (₱)
                </Label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-sm font-semibold text-slate-500 dark:text-slate-400">₱</span>
                  <Input
                    id="court-hourly-rate"
                    type="number"
                    min="0"
                    step="any"
                    value={newRate}
                    onChange={(e) => setNewRate(e.target.value)}
                    className="pl-8"
                    placeholder="300"
                    required
                    autoFocus
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Used for any hour that is not covered by a custom time range below.
                </p>
              </div>

              {/* Custom Time-Range Pricing Rules (Option A) */}
              <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Custom Time Ranges
                  </Label>
                  <button
                    type="button"
                    onClick={() =>
                      setEditingRules((prev) => [
                        ...prev,
                        { startTime: "17:00", endTime: "23:00", rate: newRate || "350" },
                      ])
                    }
                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Time Range
                  </button>
                </div>

                {editingRules.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic py-1">
                    No custom time ranges set — all hours use the default rate (₱{newRate || "300"}/hr).
                  </p>
                ) : (
                  <div className="space-y-2">
                    {editingRules.map((rule, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-1.5 p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50"
                      >
                        <select
                          aria-label={`Start time for range ${idx + 1}`}
                          value={rule.startTime}
                          onChange={(e) =>
                            setEditingRules((prev) =>
                              prev.map((item, i) => (i === idx ? { ...item, startTime: e.target.value } : item))
                            )
                          }
                          className="border border-slate-200 dark:border-slate-700 rounded-md px-2 py-1 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-medium"
                        >
                          {START_HOUR_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        <span className="text-xs text-muted-foreground">to</span>
                        <select
                          aria-label={`End time for range ${idx + 1}`}
                          value={rule.endTime}
                          onChange={(e) =>
                            setEditingRules((prev) =>
                              prev.map((item, i) => (i === idx ? { ...item, endTime: e.target.value } : item))
                            )
                          }
                          className="border border-slate-200 dark:border-slate-700 rounded-md px-2 py-1 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-medium"
                        >
                          {END_HOUR_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        <div className="relative flex items-center flex-1 min-w-[78px]">
                          <span className="absolute left-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                            ₱
                          </span>
                          <Input
                            type="number"
                            min="0"
                            step="any"
                            aria-label={`Rate for range ${idx + 1}`}
                            value={rule.rate}
                            onChange={(e) =>
                              setEditingRules((prev) =>
                                prev.map((item, i) => (i === idx ? { ...item, rate: e.target.value } : item))
                              )
                            }
                            className="h-7 pl-5 pr-2 text-xs font-semibold"
                            required
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => setEditingRules((prev) => prev.filter((_, i) => i !== idx))}
                          aria-label={`Remove time range ${idx + 1}`}
                          className="p-1 text-slate-400 hover:text-red-500 rounded cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Optional bulk apply toggle */}
              {courts.length > 1 && (
                <label className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={applyRateToAll}
                    onChange={(e) => setApplyRateToAll(e.target.checked)}
                    className="rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Apply these rates to all {courts.length} courts</span>
                </label>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingCourt(null)}
                  disabled={savingRate}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={savingRate}>
                  {savingRate ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> Saving...
                    </>
                  ) : (
                    "Save Rate"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Court Dialog */}
      <AddCourtModal
        isOpen={isAddCourtOpen}
        onClose={() => {
          setErrorMessage(null);
          setIsAddCourtOpen(false);
        }}
        onSubmit={handleCreateCourt}
        isSubmitting={creating}
        errorMessage={errorMessage}
      />
    </div>
  );
}
