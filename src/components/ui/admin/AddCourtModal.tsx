"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, X, AlertCircle } from "lucide-react";

export type CourtStatus = "Available" | "Not Available" | "Maintenance";

export const STATUS_OPTIONS: { value: CourtStatus; label: string }[] = [
  { value: "Available", label: "Available (Open for player reservations)" },
  { value: "Maintenance", label: "Maintenance (Temporarily closed for court maintenance)" },
  { value: "Not Available", label: "Not Available (Hidden from booking grid)" },
];

export interface AddCourtModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (courtData: {
    name: string;
    description: string;
    hourlyRate: string;
    status: CourtStatus;
  }) => Promise<void> | void;
  isSubmitting?: boolean;
  errorMessage?: string | null;
}

export function AddCourtModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
  errorMessage = null,
}: AddCourtModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [hourlyRate, setHourlyRate] = useState("200");
  const [status, setStatus] = useState<CourtStatus>("Available");

  // Handle Escape key to close dialog
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSubmitting) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setName("");
      setDescription("");
      setHourlyRate("200");
      setStatus("Available");
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    await onSubmit({
      name: name.trim(),
      description: description.trim(),
      hourlyRate: hourlyRate.trim() || "200",
      status,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
      onClick={isSubmitting ? undefined : onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-court-dialog-title"
    >
      <div
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Dialog Header */}
        <div className="flex justify-between items-start">
          <div>
            <h3
              id="add-court-dialog-title"
              className="font-semibold text-lg text-slate-900 dark:text-white"
            >
              Add Court
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Configure court details and initial availability for player bookings.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded p-1 cursor-pointer disabled:opacity-50"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Add Court Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="add-court-name">Court Name</Label>
              <Input
                id="add-court-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Court 3"
                required
                autoFocus
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="add-court-rate">Hourly Rate (₱)</Label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-sm font-semibold text-slate-500 dark:text-slate-400">
                  ₱
                </span>
                <Input
                  id="add-court-rate"
                  type="number"
                  min="0"
                  step="any"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                  className="pl-8"
                  placeholder="200"
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="add-court-description">Location / Notes (Optional)</Label>
            <Input
              id="add-court-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Indoor near entrance"
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="add-court-status">Initial Status</Label>
            <select
              id="add-court-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as CourtStatus)}
              disabled={isSubmitting}
              className="w-full border border-slate-200 dark:border-slate-700 rounded-md px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium shadow-xs focus:ring-2 focus:ring-blue-500"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option
                  key={opt.value}
                  value={opt.value}
                  className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                >
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
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
      </div>
    </div>
  );
}
