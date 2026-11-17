"use client";

import React, { useMemo, useState } from "react";
import type { Booking } from "@/lib/types/domain";
import { cancelBookingAction, markBookingPaidInCashAction } from "@/app/admin/bookings/actions";
import { formatTime } from "@/lib/utils/date";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Banknote,
  QrCode,
  CheckCircle2,
  CalendarX,
  Search,
  CalendarDays,
  X,
  Sparkles,
} from "lucide-react";

function formatDisplayDate(dateStr: string) {
  try {
    const [y, m, d] = dateStr.split("-").map(Number);
    if (!y || !m || !d) return dateStr;
    const dateObj = new Date(Date.UTC(y, m - 1, d));
    return dateObj.toLocaleDateString("en-US", {
      timeZone: "UTC",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

const STATUS_STYLES: Record<Booking["status"], string> = {
  pending:
    "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-950/80",
  confirmed:
    "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-950/80",
  cancelled:
    "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800",
  completed:
    "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-950/80",
};

const CANCEL_PRESETS = ["Player request", "No-show", "Court maintenance"];

type FilterTab = "all" | "today" | "action" | "paid" | "cancelled";

export function BookingsTable({
  bookings,
  showActions = true,
  enableControls = false,
  courts = [],
  todayISO = "",
  initialSearch = "",
  initialStatus = "",
}: {
  bookings: Booking[];
  showActions?: boolean;
  enableControls?: boolean;
  courts?: string[];
  todayISO?: string;
  initialSearch?: string;
  initialStatus?: string;
}) {
  const [activeTab, setActiveTab] = useState<FilterTab>(() => {
    if (initialStatus === "cancelled") return "cancelled";
    if (initialStatus === "confirmed") return "paid";
    if (initialStatus === "pending") return "action";
    return "all";
  });
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedCourt, setSelectedCourt] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [expandedCancelId, setExpandedCancelId] = useState<string | null>(null);
  const [customReason, setCustomReason] = useState<string>("");

  const isBookingGCash = (b: Booking) =>
    Boolean(
      b.paymentMethod?.toLowerCase().includes("gcash") ||
        b.paymentMethod?.toLowerCase().includes("qr")
    );

  const isNeedsPayment = (b: Booking) =>
    b.paymentStatus !== "succeeded" && b.status !== "cancelled";

  // Front-Desk KPI Metrics
  const kpis = useMemo(() => {
    const todaysActive = bookings.filter(
      (b) => todayISO && b.bookingDate === todayISO && b.status !== "cancelled"
    );
    const gcashPending = bookings.filter(
      (b) => isNeedsPayment(b) && isBookingGCash(b)
    );
    const gcashWithRef = gcashPending.filter((b) => Boolean(b.paymentReference));
    const cashPending = bookings.filter(
      (b) => isNeedsPayment(b) && !isBookingGCash(b)
    );
    const cashPendingTotal = cashPending.reduce((sum, b) => sum + b.totalPrice, 0);
    const paidBookings = bookings.filter(
      (b) => b.paymentStatus === "succeeded" && b.status !== "cancelled"
    );
    const paidTotal = paidBookings.reduce((sum, b) => sum + b.totalPrice, 0);

    return {
      todaysCount: todaysActive.length,
      gcashPendingCount: gcashPending.length,
      gcashWithRefCount: gcashWithRef.length,
      cashPendingCount: cashPending.length,
      cashPendingTotal,
      paidCount: paidBookings.length,
      paidTotal,
      actionCount: gcashPending.length + cashPending.length,
      cancelledCount: bookings.filter((b) => b.status === "cancelled").length,
    };
  }, [bookings, todayISO]);

  const courtOptions = useMemo(() => {
    if (courts.length > 0) return courts;
    const set = new Set<string>();
    for (const b of bookings) {
      if (b.courtName) set.add(b.courtName);
    }
    return Array.from(set).sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true })
    );
  }, [courts, bookings]);

  const filteredBookings = useMemo(() => {
    if (!enableControls) return bookings;
    const q = searchQuery.trim().toLowerCase();

    return bookings.filter((b) => {
      if (activeTab === "today") {
        if (!todayISO || b.bookingDate !== todayISO || b.status === "cancelled") {
          return false;
        }
      } else if (activeTab === "action") {
        if (!isNeedsPayment(b)) return false;
      } else if (activeTab === "paid") {
        if (b.paymentStatus !== "succeeded" || b.status === "cancelled") return false;
      } else if (activeTab === "cancelled") {
        if (b.status !== "cancelled") return false;
      }

      if (selectedCourt !== "all" && b.courtName !== selectedCourt) {
        return false;
      }

      if (selectedDate && b.bookingDate !== selectedDate) {
        return false;
      }

      if (q) {
        const nameMatch = b.customerName?.toLowerCase().includes(q);
        const emailMatch = b.customerEmail?.toLowerCase().includes(q);
        const refMatch = b.paymentReference?.toLowerCase().includes(q);
        const courtMatch = b.courtName?.toLowerCase().includes(q);
        if (!nameMatch && !emailMatch && !refMatch && !courtMatch) {
          return false;
        }
      }

      return true;
    });
  }, [
    bookings,
    enableControls,
    activeTab,
    selectedCourt,
    selectedDate,
    searchQuery,
    todayISO,
  ]);

  return (
    <div className="space-y-4">
      {enableControls && (
        <div className="p-4 pb-0 space-y-4">
          {/* 1. Clickable Front-Desk KPI Strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <button
              type="button"
              onClick={() => setActiveTab(activeTab === "today" ? "all" : "today")}
              className={`text-left p-3.5 rounded-xl border transition cursor-pointer ${
                activeTab === "today"
                  ? "border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/30 ring-1 ring-emerald-500/40"
                  : "border-border/60 bg-slate-50/60 dark:bg-slate-900/50 hover:border-emerald-500/50"
              }`}
            >
              <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                <span>Today&apos;s Bookings</span>
                <CalendarDays className="size-3.5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-xl font-bold tracking-tight">
                  {kpis.todaysCount}
                </span>
                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  active today
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab(activeTab === "action" ? "all" : "action")}
              className={`text-left p-3.5 rounded-xl border transition cursor-pointer ${
                activeTab === "action"
                  ? "border-amber-500 bg-amber-50/70 dark:bg-amber-950/40 ring-1 ring-amber-500/40"
                  : kpis.gcashPendingCount > 0
                  ? "border-amber-300/80 dark:border-amber-800/70 bg-amber-50/30 dark:bg-amber-950/20 hover:border-amber-500"
                  : "border-border/60 bg-slate-50/60 dark:bg-slate-900/50 hover:border-amber-500/50"
              }`}
            >
              <div className="flex items-center justify-between text-xs font-semibold text-amber-700 dark:text-amber-400">
                <span>Needs GCash Verify</span>
                <QrCode className="size-3.5" />
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-xl font-bold tracking-tight">
                  {kpis.gcashPendingCount}
                </span>
                <span className="text-xs font-medium text-amber-700/90 dark:text-amber-300">
                  {kpis.gcashWithRefCount} ref submitted
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab(activeTab === "action" ? "all" : "action")}
              className={`text-left p-3.5 rounded-xl border transition cursor-pointer ${
                activeTab === "action" && kpis.cashPendingCount > 0
                  ? "border-blue-500 bg-blue-50/60 dark:bg-blue-950/30"
                  : "border-border/60 bg-slate-50/60 dark:bg-slate-900/50 hover:border-blue-500/50"
              }`}
            >
              <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                <span>Collect Cash at Desk</span>
                <Banknote className="size-3.5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-xl font-bold tracking-tight">
                  {kpis.cashPendingCount}
                </span>
                <span className="text-xs font-medium text-blue-600 dark:text-blue-400 tabular-nums">
                  ₱{kpis.cashPendingTotal.toFixed(2)}
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab(activeTab === "paid" ? "all" : "paid")}
              className={`text-left p-3.5 rounded-xl border transition cursor-pointer ${
                activeTab === "paid"
                  ? "border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/30 ring-1 ring-emerald-500/40"
                  : "border-border/60 bg-slate-50/60 dark:bg-slate-900/50 hover:border-emerald-500/50"
              }`}
            >
              <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                <span>Confirmed &amp; Paid</span>
                <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-xl font-bold tracking-tight">
                  {kpis.paidCount}
                </span>
                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 tabular-nums">
                  ₱{kpis.paidTotal.toFixed(2)}
                </span>
              </div>
            </button>
          </div>

          {/* 2. Search & Quick Filter Toolbar */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 p-2.5 rounded-xl border border-border/60 bg-slate-50/50 dark:bg-slate-900/40">
            <div className="flex flex-wrap items-center gap-1.5">
              {(
                [
                  { id: "all", label: `All (${bookings.length})` },
                  { id: "today", label: `Today (${kpis.todaysCount})` },
                  { id: "action", label: `Needs Action (${kpis.actionCount})` },
                  { id: "paid", label: `Paid (${kpis.paidCount})` },
                  { id: "cancelled", label: `Cancelled (${kpis.cancelledCount})` },
                ] as const
              ).map((tab) => {
                const isSelected = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      isSelected
                        ? "bg-emerald-600 text-white shadow-xs"
                        : tab.id === "action" && kpis.actionCount > 0
                        ? "text-amber-700 dark:text-amber-400 hover:bg-amber-500/10"
                        : "text-muted-foreground hover:text-foreground hover:bg-slate-200/60 dark:hover:bg-slate-800"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedCourt}
                onChange={(e) => setSelectedCourt(e.target.value)}
                aria-label="Filter by court"
                className="h-8 rounded-lg border border-border bg-white dark:bg-slate-950 px-2.5 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              >
                <option value="all">All Courts</option>
                {courtOptions.map((courtName) => (
                  <option key={courtName} value={courtName}>
                    {courtName}
                  </option>
                ))}
              </select>

              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                aria-label="Filter by date"
                className="h-8 w-36 text-xs bg-white dark:bg-slate-950"
              />

              <div className="relative flex-1 sm:w-56">
                <Search className="size-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search player, email, or ref #..."
                  className="h-8 pl-8 pr-7 text-xs bg-white dark:bg-slate-950"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>

              {(activeTab !== "all" ||
                selectedCourt !== "all" ||
                selectedDate !== "" ||
                searchQuery !== "") && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setActiveTab("all");
                    setSelectedCourt("all");
                    setSelectedDate("");
                    setSearchQuery("");
                  }}
                  className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  Reset
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {filteredBookings.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <div className="size-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 mb-3">
            <CalendarX className="size-6" />
          </div>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            No reservations found
          </p>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs">
            No bookings match the selected filters or search query.
          </p>
        </div>
      ) : (
        <Table className="w-full">
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Court</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Price</TableHead>
              {showActions && (
                <TableHead className="text-right">Counter Actions</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredBookings.map((b) => {
              const cancelThisBooking = cancelBookingAction.bind(null, b.id);
              const collectCashForThisBooking = markBookingPaidInCashAction.bind(
                null,
                b.id
              );
              const canCancel =
                b.status === "pending" || b.status === "confirmed";
              const needsPayment = isNeedsPayment(b);
              const isGCash = isBookingGCash(b);
              const isCancelExpanded = expandedCancelId === b.id;
              const isGeneric =
                !b.customerName ||
                b.customerName.toLowerCase() === "customer" ||
                b.customerName.toLowerCase() === "customer user";
              const customerDisplayName = !isGeneric
                ? b.customerName
                : b.customerEmail
                ? b.customerEmail.split("@")[0]
                : b.customerName || "—";

              return (
                <TableRow key={b.id} className="align-top">
                  <TableCell className="font-medium whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span>{formatDisplayDate(b.bookingDate)}</span>
                      {todayISO && b.bookingDate === todayISO && (
                        <span className="px-1.5 py-0.5 rounded text-xs font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                          Today
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground whitespace-nowrap">
                    {formatTime(b.startTime)} – {formatTime(b.endTime)}
                  </TableCell>
                  <TableCell className="font-medium whitespace-nowrap">
                    {b.courtName}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{customerDisplayName}</div>
                    <div className="text-xs text-muted-foreground">
                      {b.customerEmail}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={STATUS_STYLES[b.status]}>
                      {b.status.charAt(0).toUpperCase() + b.status.slice(1)}
                    </Badge>
                    {b.status === "cancelled" && b.cancelledReason && (
                      <div className="mt-1 text-xs text-muted-foreground">
                        Reason: {b.cancelledReason}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {b.paymentStatus === "succeeded" ? (
                      <div className="space-y-1">
                        <Badge
                          variant="outline"
                          className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800"
                        >
                          {b.paymentMethod === "card"
                            ? "Paid (Card)"
                            : isGCash
                            ? "Paid (GCash)"
                            : "Paid (Cash)"}
                        </Badge>
                        {b.paymentReference && (
                          <div className="text-xs font-mono text-slate-500 dark:text-slate-400">
                            Ref: #{b.paymentReference}
                          </div>
                        )}
                      </div>
                    ) : b.paymentStatus === "pending" ? (
                      <div className="space-y-1">
                        <Badge
                          variant="outline"
                          className="bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800"
                        >
                          {isGCash ? "GCash Pending" : "Pay at Desk"}
                        </Badge>
                        {b.paymentReference ? (
                          <div className="text-xs font-mono font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50 px-1.5 py-0.5 rounded border border-blue-200/60 dark:border-blue-900/60 inline-flex items-center gap-1">
                            <QrCode className="size-2.5" /> Ref:{" "}
                            {b.paymentReference}
                          </div>
                        ) : (
                          <div className="text-xs text-muted-foreground">
                            {b.paymentMethod}
                          </div>
                        )}
                      </div>
                    ) : (
                      <Badge
                        variant="outline"
                        className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
                      >
                        {b.paymentStatus || "Unpaid"}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="font-medium tabular-nums">
                    ₱{b.totalPrice.toFixed(2)}
                  </TableCell>
                  {showActions && (
                    <TableCell className="text-right">
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center justify-end gap-2">
                          {needsPayment && (
                            <form action={collectCashForThisBooking}>
                              <Button
                                size="sm"
                                type="submit"
                                className={`h-7 text-xs text-white cursor-pointer font-medium ${
                                  isGCash
                                    ? "bg-blue-600 hover:bg-blue-700"
                                    : "bg-emerald-600 hover:bg-emerald-700"
                                }`}
                              >
                                {isGCash ? (
                                  <>
                                    <CheckCircle2 className="size-3 mr-1" />{" "}
                                    Verify GCash
                                  </>
                                ) : (
                                  <>
                                    <Banknote className="size-3 mr-1" /> Collect
                                    Cash
                                  </>
                                )}
                              </Button>
                            </form>
                          )}
                          {canCancel && (
                            <Button
                              variant="outline"
                              size="sm"
                              type="button"
                              onClick={() => {
                                setExpandedCancelId(
                                  isCancelExpanded ? null : b.id
                                );
                                setCustomReason("");
                              }}
                              className={`h-7 text-xs cursor-pointer ${
                                isCancelExpanded
                                  ? "border-rose-300 text-rose-600 dark:border-rose-800 dark:text-rose-400"
                                  : "hover:border-rose-300 hover:text-rose-600 dark:hover:text-rose-400"
                              }`}
                            >
                              {isCancelExpanded ? "Close" : "Cancel"}
                            </Button>
                          )}
                        </div>

                        {canCancel && isCancelExpanded && (
                          <div className="flex flex-col items-end gap-1.5 p-2 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/60 dark:bg-rose-950/30 max-w-xs">
                            <div className="flex flex-wrap items-center justify-end gap-1">
                              <span className="text-xs text-muted-foreground mr-1">
                                Quick cancel:
                              </span>
                              {CANCEL_PRESETS.map((preset) => (
                                <form
                                  key={preset}
                                  action={cancelThisBooking}
                                  onSubmit={() => setExpandedCancelId(null)}
                                >
                                  <input
                                    type="hidden"
                                    name="reason"
                                    value={preset}
                                  />
                                  <button
                                    type="submit"
                                    className="px-2 py-0.5 rounded-md text-xs font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-rose-400 hover:text-rose-600 dark:hover:text-rose-400 transition cursor-pointer"
                                  >
                                    {preset}
                                  </button>
                                </form>
                              ))}
                            </div>
                            <form
                              action={cancelThisBooking}
                              onSubmit={() => setExpandedCancelId(null)}
                              className="flex items-center gap-1.5 w-full justify-end"
                            >
                              <input
                                type="text"
                                name="reason"
                                value={customReason}
                                onChange={(e) =>
                                  setCustomReason(e.target.value)
                                }
                                placeholder="Or custom reason..."
                                required
                                className="w-36 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-xs text-slate-900 dark:text-slate-100 placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-rose-500"
                              />
                              <Button
                                variant="destructive"
                                size="sm"
                                type="submit"
                                className="h-6 px-2 text-xs cursor-pointer"
                              >
                                Confirm
                              </Button>
                            </form>
                          </div>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
