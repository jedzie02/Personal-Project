"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, X, AlertCircle } from "lucide-react";

type CourtStatus = "Available" | "Not Available" | "Maintenance";

interface Court {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  status: CourtStatus;
  hourly_rate?: number | null;
  created_at?: string;
}

const STATUS_OPTIONS: { value: CourtStatus; label: string }[] = [
  { value: "Available", label: "Available (Open for player reservations)" },
  { value: "Maintenance", label: "Maintenance (Temporarily closed for court maintenance)" },
  { value: "Not Available", label: "Not Available (Hidden from booking grid)" },
];

function statusBadge(status: CourtStatus) {
  switch (status) {
    case "Available":
      return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Available</Badge>;
    case "Maintenance":
      return <Badge className="bg-amber-100 text-amber-800 border-amber-200">Maintenance</Badge>;
    case "Not Available":
      return <Badge variant="secondary">Unavailable</Badge>;
  }
}

export default function AdminCourtsPage() {
  const router = useRouter();
  const [courts, setCourts] = useState<Court[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [newStatus, setNewStatus] = useState<CourtStatus>("Available");
  const [hourlyRate, setHourlyRate] = useState("25");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Edit Rate dialog state
  const [editingCourt, setEditingCourt] = useState<Court | null>(null);
  const [newRate, setNewRate] = useState("");
  const [savingRate, setSavingRate] = useState(false);

  const fetchCourts = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("courts")
      .select("id, name, description, is_active, status, hourly_rate, created_at")
      .order("name", { ascending: true });

    if (!error && data) {
      setCourts(
        data.map((c: any) => ({
          ...c,
          hourly_rate: c.hourly_rate != null ? Number(c.hourly_rate) : 25,
          status: c.status || (c.is_active ? "Available" : "Not Available"),
        }))
      );
    } else if (error) {
      setErrorMessage("Unable to load courts. Please refresh the page to try again.");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCourts();
  }, [fetchCourts]);

  const updateCourtStatus = async (courtId: string, status: CourtStatus) => {
    setErrorMessage(null);
    const court = courts.find((c) => c.id === courtId);

    // Optimistic UI
    setCourts((prev) =>
      prev.map((c) =>
        c.id === courtId
          ? { ...c, status, is_active: status === "Available" }
          : c
      )
    );

    const { error } = await supabase
      .from("courts")
      .update({ status, is_active: status === "Available" })
      .eq("id", courtId);

    if (error) {
      console.error("Failed to update court status:", error);
      fetchCourts(); // Rollback
      setErrorMessage(
        `Unable to update status for ${court?.name ?? "this court"}. Please check your connection and try again.`
      );
    }
  };

  const handleCreateCourt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setCreating(true);
    setErrorMessage(null);

    const { error } = await supabase.from("courts").insert({
      name: name.trim(),
      description: description.trim() || null,
      status: newStatus,
      is_active: newStatus === "Available",
      hourly_rate: parseFloat(hourlyRate) || 25,
    });

    setCreating(false);

    if (!error) {
      setName("");
      setDescription("");
      setHourlyRate("25");
      setNewStatus("Available");
      fetchCourts();
    } else {
      setErrorMessage("Unable to add court. Please verify the court name is unique and try again.");
    }
  };

  const handleUpdateRate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourt) return;
    const rateVal = parseFloat(newRate);
    if (isNaN(rateVal) || rateVal < 0) return;

    setSavingRate(true);
    setErrorMessage(null);

    const { error } = await supabase
      .from("courts")
      .update({ hourly_rate: rateVal })
      .eq("id", editingCourt.id);

    setSavingRate(false);

    if (error) {
      setErrorMessage(`Unable to update hourly rate for ${editingCourt.name}. Please try again.`);
      return;
    }

    setCourts((prev) =>
      prev.map((c) =>
        c.id === editingCourt.id ? { ...c, hourly_rate: rateVal } : c
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
          <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
            {countByStatus("Available")} Available
          </Badge>
          <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
            {countByStatus("Maintenance")} Maintenance
          </Badge>
          <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-700">
            {countByStatus("Not Available")} Unavailable
          </Badge>
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

      {/* Add Court Form */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Add Court</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateCourt} className="grid grid-cols-1 sm:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="court-name">Court Name</Label>
              <Input
                id="court-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Court 3"
                required
              />
            </div>
            <div>
              <Label htmlFor="court-description">Location / Notes (Optional)</Label>
              <Input
                id="court-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., Indoor near entrance"
              />
            </div>
            <div>
              <Label htmlFor="court-rate">Hourly Rate (₱)</Label>
              <Input
                id="court-rate"
                type="number"
                min="0"
                step="any"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
                placeholder="25"
                required
              />
            </div>
            <div>
              <Label htmlFor="court-status">Initial Status</Label>
              <select
                id="court-status"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as CourtStatus)}
                className="w-full border rounded-md px-3 py-2 text-sm bg-white font-medium shadow-xs focus:ring-2 focus:ring-blue-500"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <Button type="submit" className="w-full" disabled={creating}>
                {creating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Adding...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" /> Add Court
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Courts List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          <p className="mt-2 text-xs text-muted-foreground">Loading venue courts...</p>
        </div>
      ) : courts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 p-12 text-center bg-slate-50/50">
          <h3 className="font-semibold text-slate-900">No courts created yet</h3>
          <p className="mt-1 text-sm text-muted-foreground max-w-sm mx-auto">
            Add your first court above to set availability and start accepting reservations.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courts.map((court) => (
            <Card key={court.id}>
              <CardContent className="pt-6 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">{court.name}</h3>
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
                    className="w-full border rounded-md px-3 py-1.5 text-sm bg-white font-medium shadow-xs focus:ring-2 focus:ring-blue-500"
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {/* Hourly Rate & Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <div>
                    <span className="text-xs text-muted-foreground block">Hourly Rate</span>
                    <span className="text-base font-bold text-slate-900">
                      ₱{court.hourly_rate ?? 25}
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
                        setEditingCourt(court);
                        setNewRate(String(court.hourly_rate ?? 25));
                      }}
                      className="text-xs h-8 px-2.5"
                      aria-label={`Edit hourly rate for ${court.name}`}
                    >
                      Edit Rate
                    </Button>
                  </div>
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
            className="relative w-full max-w-sm bg-white rounded-xl shadow-xl border border-slate-200 p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center">
              <div>
                <h3 id="edit-rate-title" className="font-semibold text-lg">
                  Edit Hourly Rate
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Updating rate for {editingCourt.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingCourt(null)}
                className="text-gray-400 hover:text-gray-600 rounded p-1 cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateRate} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="court-hourly-rate" className="text-sm font-medium">
                  Hourly Rate (₱)
                </Label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-sm font-semibold text-slate-500">₱</span>
                  <Input
                    id="court-hourly-rate"
                    type="number"
                    min="0"
                    step="any"
                    value={newRate}
                    onChange={(e) => setNewRate(e.target.value)}
                    className="pl-8"
                    placeholder="25"
                    required
                    autoFocus
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  New rate applies to upcoming bookings created on this court.
                </p>
              </div>

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
    </div>
  );
}
