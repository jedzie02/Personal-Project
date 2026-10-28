"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Payment } from "@/lib/types/domain";
import { refundPaymentAction, markPaymentPaidInCashAction } from "./actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  Download,
  RotateCcw,
  TrendingUp,
  Clock,
  DollarSign,
  FileText,
  X,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Calendar,
  User,
  ShieldCheck,
  Printer,
} from "lucide-react";

interface PaymentsLedgerProps {
  initialPayments: Payment[];
}

function formatPHP(amount: number): string {
  return `₱${amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  try {
    const [y, m, d] = dateStr.split("-").map(Number);
    if (!y || !m || !d) return dateStr;
    const dateObj = new Date(y, m - 1, d);
    return dateObj.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export function PaymentsLedger({ initialPayments }: PaymentsLedgerProps) {
  const router = useRouter();
  const [payments, setPayments] = useState<Payment[]>(initialPayments);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedReceipt, setSelectedReceipt] = useState<{
    payment: Payment;
    method: string;
  } | null>(null);
  const [refundConfirm, setRefundConfirm] = useState<Payment | null>(null);
  const [refundStatus, setRefundStatus] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    setPayments(initialPayments);
  }, [initialPayments]);

  // Memoized single-pass KPI computation (O(n) instead of 4 separate array scans on every keystroke)
  const { todayRevenue, outstanding, refunded, monthlyRevenue } = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    let todayRev = 0;
    let out = 0;
    let ref = 0;
    let monthlyRev = 0;

    for (let i = 0; i < payments.length; i++) {
      const p = payments[i];
      if (p.status === "succeeded") {
        monthlyRev += p.amount;
        if (p.bookingDate === today) {
          todayRev += p.amount;
        }
      } else if (p.status === "pending") {
        out += p.amount;
      } else if (p.status === "refunded") {
        ref += p.amount;
      }
    }

    return {
      todayRevenue: todayRev,
      outstanding: out,
      refunded: ref,
      monthlyRevenue: monthlyRev,
    };
  }, [payments]);

  // Filtered dataset
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      const method = p.method || "Cash";
      const matchesStatus =
        statusFilter === "all" ? true : p.status === statusFilter;

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (p.customerName?.toLowerCase().includes(q) ?? false) ||
        (p.customerEmail?.toLowerCase().includes(q) ?? false) ||
        p.courtName.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        (p.paymentReference?.toLowerCase().includes(q) ?? false) ||
        method.toLowerCase().includes(q);

      return matchesStatus && matchesSearch;
    });
  }, [payments, statusFilter, searchQuery]);

  // Export CSV handler
  const handleExportCSV = () => {
    const headers = [
      "Transaction ID",
      "Booking ID",
      "Date",
      "Customer Name",
      "Customer Email",
      "Court",
      "Payment Method",
      "Status",
      "Amount (PHP)",
    ];

    const rows = filteredPayments.map((p) => [
      p.id,
      p.bookingId,
      p.bookingDate,
      `"${p.customerName || (p.bookingId ? `Customer (${p.bookingId.slice(0, 8)})` : "Customer")}"`,
      `"${p.customerEmail || "N/A"}"`,
      `"${p.courtName}"`,
      p.method || "Cash",
      p.status,
      p.amount.toFixed(2),
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `paddlix-payments-${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Header & Quick Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Payments Ledger
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time transaction records, billing settlement, and customer payment statuses across all courts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="rounded-lg border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-all cursor-pointer font-medium"
          >
            <Download className="size-4 mr-1.5 text-slate-500" /> Export CSV
          </Button>
        </div>
      </div>

      {/* 2. Operational KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Today's Revenue */}
        <div className="flex flex-col justify-between p-5 min-h-[116px] rounded-xl border border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-800 hover:-translate-y-0.5 hover:shadow-xs transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Today&apos;s Revenue
            </span>
            <div className="flex items-center justify-center size-8 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <DollarSign className="size-4" />
            </div>
          </div>
          <div className="mt-3 space-y-1">
            <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums leading-none">
              {formatPHP(todayRevenue)}
            </div>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
              <ShieldCheck className="size-3" /> Settled today
            </p>
          </div>
        </div>

        {/* Outstanding Balance */}
        <div className="flex flex-col justify-between p-5 min-h-[116px] rounded-xl border border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-800 hover:-translate-y-0.5 hover:shadow-xs transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Pending Balance
            </span>
            <div className="flex items-center justify-center size-8 rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
              <Clock className="size-4" />
            </div>
          </div>
          <div className="mt-3 space-y-1">
            <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums leading-none">
              {formatPHP(outstanding)}
            </div>
            <p className="text-xs text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
              <Clock className="size-3" /> Awaiting payment capture
            </p>
          </div>
        </div>

        {/* Refunds Processed */}
        <div className="flex flex-col justify-between p-5 min-h-[116px] rounded-xl border border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-800 hover:-translate-y-0.5 hover:shadow-xs transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Refunds Processed
            </span>
            <div className="flex items-center justify-center size-8 rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              <RotateCcw className="size-4" />
            </div>
          </div>
          <div className="mt-3 space-y-1">
            <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums leading-none">
              {formatPHP(refunded)}
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Total refunded to date
            </p>
          </div>
        </div>

        {/* Total Monthly Revenue */}
        <div className="flex flex-col justify-between p-5 min-h-[116px] rounded-xl border border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-800 hover:-translate-y-0.5 hover:shadow-xs transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Monthly Total
            </span>
            <div className="flex items-center justify-center size-8 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
              <TrendingUp className="size-4" />
            </div>
          </div>
          <div className="mt-3 space-y-1">
            <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums leading-none">
              {formatPHP(monthlyRevenue)}
            </div>
            <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
              Completed bookings
            </p>
          </div>
        </div>
      </div>

      {/* 3. Transaction Table & Ledger Controls */}
      <Card className="rounded-xl border border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-800 shadow-none overflow-hidden">
        {/* Controls Toolbar */}
        <div className="p-4 sm:px-6 sm:py-4 border-b border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between bg-slate-50/40 dark:bg-slate-950/30">
          {/* Status Tabs */}
          <div className="overflow-x-auto pb-1 lg:pb-0">
            <div className="flex items-center gap-1.5 min-w-max">
              {[
                { id: "all", label: "All Records", count: payments.length },
                {
                  id: "succeeded",
                  label: "Succeeded",
                  count: payments.filter((p) => p.status === "succeeded").length,
                },
                {
                  id: "pending",
                  label: "Pending",
                  count: payments.filter((p) => p.status === "pending").length,
                },
                {
                  id: "refunded",
                  label: "Refunded",
                  count: payments.filter((p) => p.status === "refunded").length,
                },
                {
                  id: "failed",
                  label: "Failed",
                  count: payments.filter((p) => p.status === "failed").length,
                },
              ].map(({ id, label, count }) => {
                const active = statusFilter === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setStatusFilter(id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer shrink-0 ${
                      active
                        ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs border border-slate-200 dark:border-slate-700 font-semibold"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    <span>{label}</span>
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-xs font-semibold ${
                        active
                          ? "bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200"
                          : "bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search Box */}
          <div className="relative w-full lg:w-72 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search customer, court, ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 w-full"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Table Content */}
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="w-full min-w-[840px]">
              <TableHeader>
                <TableRow className="bg-slate-50/75 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800 hover:bg-transparent">
                  <TableHead className="w-[180px] text-xs font-semibold uppercase tracking-wider text-slate-500 py-3.5 pl-6">
                    Date & Court
                  </TableHead>
                  <TableHead className="w-[240px] text-xs font-semibold uppercase tracking-wider text-slate-500 py-3.5">
                    Customer Details
                  </TableHead>
                  <TableHead className="w-[140px] text-xs font-semibold uppercase tracking-wider text-slate-500 py-3.5">
                    Method
                  </TableHead>
                  <TableHead className="w-[140px] text-xs font-semibold uppercase tracking-wider text-slate-500 py-3.5">
                    Payment Status
                  </TableHead>
                  <TableHead className="w-[140px] text-xs font-semibold uppercase tracking-wider text-slate-500 py-3.5 text-right">
                    Amount
                  </TableHead>
                  <TableHead className="w-[160px] text-xs font-semibold uppercase tracking-wider text-slate-500 py-3.5 pr-6 text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredPayments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-48 text-center">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <FileText className="size-8 text-slate-300" />
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          No transactions found
                        </p>
                        <p className="text-xs text-slate-400">
                          {searchQuery || statusFilter !== "all"
                            ? "Try adjusting your search query or status filter."
                            : "New transactions will appear here once customers book courts."}
                        </p>
                        {(searchQuery || statusFilter !== "all") && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSearchQuery("");
                              setStatusFilter("all");
                            }}
                            className="mt-2 text-xs h-7 rounded-lg"
                          >
                            Reset filters
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPayments.map((payment) => {
                    const method = payment.method || "Cash";

                    return (
                      <TableRow
                        key={payment.id}
                        className="border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        {/* 1. Date & Court */}
                        <TableCell className="pl-6 py-3.5">
                          <div className="font-semibold text-sm text-slate-900 dark:text-white">
                            {formatDate(payment.bookingDate)}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5 text-xs text-slate-500">
                            <span className="size-1.5 rounded-full bg-slate-300" />
                            <span>{payment.courtName}</span>
                          </div>
                        </TableCell>

                        {/* 2. Customer */}
                        <TableCell className="py-3.5">
                          <div className="font-medium text-sm text-slate-900 dark:text-white">
                            {payment.customerName || (payment.bookingId ? `Customer (${payment.bookingId.slice(0, 8)})` : "Customer")}
                          </div>
                          <div className="text-xs text-slate-500">
                            {payment.customerEmail || "No email provided"}
                          </div>
                        </TableCell>

                        {/* 3. Method */}
                        <TableCell className="py-3.5">
                          <div className="space-y-1">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                                method.toLowerCase().includes("gcash")
                                  ? "bg-sky-50 text-sky-700 border-sky-200/80 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800"
                                  : method.toLowerCase().includes("card")
                                  ? "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
                                  : "bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                              }`}
                            >
                              <CreditCard className="size-3" />
                              {method}
                            </span>
                            {payment.paymentReference && (
                              <div className="text-[10px] font-mono text-slate-500">
                                Ref: #{payment.paymentReference}
                              </div>
                            )}
                          </div>
                        </TableCell>

                        {/* 4. Payment Status */}
                        <TableCell className="py-3.5">
                          {payment.status === "succeeded" ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                              <span className="size-1.5 rounded-full bg-emerald-500" />
                              Succeeded
                            </span>
                          ) : payment.status === "pending" ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
                              <span className="size-1.5 rounded-full bg-amber-500" />
                              Pending
                            </span>
                          ) : payment.status === "failed" ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800">
                              <span className="size-1.5 rounded-full bg-rose-500" />
                              Failed
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                              <span className="size-1.5 rounded-full bg-slate-400" />
                              Refunded
                            </span>
                          )}
                        </TableCell>

                        {/* 5. Amount */}
                        <TableCell className="py-3.5 text-right font-bold text-sm text-slate-900 dark:text-white tabular-nums">
                          {formatPHP(payment.amount)}
                        </TableCell>

                        {/* 6. Actions */}
                        <TableCell className="pr-6 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {payment.status === "pending" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={isProcessing}
                                onClick={async () => {
                                  setIsProcessing(true);
                                  await markPaymentPaidInCashAction(payment.id, payment.bookingId);
                                  setPayments((prev) =>
                                    prev.map((p) =>
                                      p.id === payment.id ? { ...p, status: "succeeded", method: "Cash" } : p
                                    )
                                  );
                                  setIsProcessing(false);
                                  router.refresh();
                                }}
                                className="h-8 px-2.5 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg cursor-pointer"
                              >
                                <CheckCircle2 className="size-3 mr-1 text-emerald-600" /> Mark Paid
                              </Button>
                            )}

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedReceipt({ payment, method })}
                              className="h-8 px-2.5 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer"
                            >
                              <FileText className="size-3.5 mr-1 text-slate-400" /> Receipt
                            </Button>

                            {(payment.status === "pending" || payment.status === "succeeded") && (
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={isProcessing}
                                onClick={() => setRefundConfirm(payment)}
                                className="h-8 px-2.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer"
                              >
                                <RotateCcw className="size-3 mr-1" /> Refund
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* 4. Receipt Details Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl p-6 overflow-hidden">
            <button
              type="button"
              onClick={() => setSelectedReceipt(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
            >
              <X className="size-5" />
            </button>

            <div className="text-center pb-5 border-b border-slate-100 dark:border-slate-800">
              <div className="inline-flex items-center justify-center size-12 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 mb-2.5">
                <CheckCircle2 className="size-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Payment Receipt
              </h3>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                ID: {selectedReceipt.payment.id}
              </p>
            </div>

            <div className="py-4 space-y-3 text-sm">
              <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                <span className="text-xs uppercase tracking-wider font-medium text-slate-400">Date</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {formatDate(selectedReceipt.payment.bookingDate)}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                <span className="text-xs uppercase tracking-wider font-medium text-slate-400">Court Reserved</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {selectedReceipt.payment.courtName}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                <span className="text-xs uppercase tracking-wider font-medium text-slate-400">Customer</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {selectedReceipt.payment.customerName || (selectedReceipt.payment.bookingId ? `Customer (${selectedReceipt.payment.bookingId.slice(0, 8)})` : "Customer")}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                <span className="text-xs uppercase tracking-wider font-medium text-slate-400">Email</span>
                <span className="font-medium text-slate-700 dark:text-slate-300 text-xs">
                  {selectedReceipt.payment.customerEmail || "N/A"}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                <span className="text-xs uppercase tracking-wider font-medium text-slate-400">Payment Method</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {selectedReceipt.method}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                <span className="text-xs uppercase tracking-wider font-medium text-slate-400">Settlement</span>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  {selectedReceipt.payment.status}
                </span>
              </div>

              <div className="pt-4 border-t border-dashed border-slate-200 dark:border-slate-800 flex justify-between items-baseline">
                <span className="font-semibold text-slate-900 dark:text-white text-base">
                  Total Paid
                </span>
                <span className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
                  {formatPHP(selectedReceipt.payment.amount)}
                </span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex gap-2">
              <Button
                variant="outline"
                className="flex-1 rounded-lg text-xs h-9 cursor-pointer"
                onClick={() => window.print()}
              >
                <Printer className="size-3.5 mr-1.5" /> Print
              </Button>
              <Button
                className="flex-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs h-9 cursor-pointer"
                onClick={() => setSelectedReceipt(null)}
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Refund Confirmation Dialog */}
      {refundConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="size-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
                <AlertCircle className="size-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Process Refund
                </h3>
                <p className="text-xs text-slate-500">
                  Transaction {refundConfirm.id}
                </p>
              </div>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
              Are you sure you want to refund{" "}
              <strong className="text-slate-900 dark:text-white font-semibold">
                {formatPHP(refundConfirm.amount)}
              </strong>{" "}
              to {refundConfirm.customerName || "customer"}? Card and GCash refunds are synchronized directly with your payment processor.
            </p>

            {refundStatus && (
              <div className="mb-4 p-2.5 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-medium border border-emerald-200">
                {refundStatus}
              </div>
            )}

            <div className="flex items-center gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg text-xs"
                onClick={() => {
                  setRefundConfirm(null);
                  setRefundStatus(null);
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={isProcessing}
                className="rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs cursor-pointer"
                onClick={async () => {
                  if (!refundConfirm) return;
                  setIsProcessing(true);
                  setRefundStatus("Recording refund in live database...");
                  try {
                    await refundPaymentAction(refundConfirm.id, refundConfirm.bookingId);
                    setPayments((prev) =>
                      prev.map((p) =>
                        p.id === refundConfirm.id || p.bookingId === refundConfirm.bookingId
                          ? { ...p, status: "refunded" }
                          : p
                      )
                    );
                    setRefundStatus("Refund processed successfully.");
                    setTimeout(() => {
                      setRefundConfirm(null);
                      setRefundStatus(null);
                      setIsProcessing(false);
                      router.refresh();
                    }, 800);
                  } catch {
                    setRefundStatus("Failed to process refund. Please try again.");
                    setIsProcessing(false);
                  }
                }}
              >
                {isProcessing ? "Processing..." : "Confirm Refund"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default PaymentsLedger;
