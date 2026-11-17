"use client";

import { useState, useTransition } from "react";
import { Users, Plus, AlertTriangle, AlertCircle, XCircle, CheckCircle2, QrCode, Banknote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreateOpenPlaySessionModal } from "@/components/ui/admin/CreateOpenPlaySessionModal";
import type { AdminSessionView } from "@/lib/services/open-play.service";
import { formatTime } from "@/lib/utils/date";
import {
    createOpenPlaySessionAction,
    cancelOpenPlaySessionAction,
    markOpenPlayEntryPaidAction,
    markOpenPlayEntryRefundedAction,
} from "./actions";

export default function OpenPlayAdmin({
    sessions,
    courts,
    todayISO,
}: {
    sessions: AdminSessionView[];
    courts: { id: string; name: string }[];
    todayISO: string;
}) {
    const [isPending, startTransition] = useTransition();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [formSuccess, setFormSuccess] = useState<string | null>(null);
    const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);

    const needsRefundEntries = sessions.flatMap((s) =>
        s.players
            .filter((p) => p.status === "needs_refund")
            .map((p) => ({
                ...p,
                sessionDate: s.date,
                startTime: s.startTime,
                endTime: s.endTime,
                courtName: s.courtName,
            }))
    );

    const handleCreateSubmit = async (formData: FormData): Promise<{ ok: boolean; error?: string }> => {
        setFormError(null);
        setFormSuccess(null);

        return new Promise((resolve) => {
            startTransition(async () => {
                const res = await createOpenPlaySessionAction(formData);
                if (!res.ok) {
                    resolve({ ok: false, error: res.error || "Could not create session." });
                } else {
                    setFormSuccess("Open Play session created and court reserved.");
                    resolve({ ok: true });
                }
            });
        });
    };

    const handleCancelSession = (sessionId: string) => {
        setFormError(null);
        startTransition(async () => {
            const res = await cancelOpenPlaySessionAction(sessionId);
            setConfirmCancelId(null);
            if (!res.ok) {
                setFormError(res.error || "Could not cancel session.");
            }
        });
    };

    const handleMarkPaid = (entryId: string) => {
        setFormError(null);
        startTransition(async () => {
            const res = await markOpenPlayEntryPaidAction(entryId);
            if (!res.ok) {
                setFormError(res.error || "Could not mark entry as paid.");
            }
        });
    };

    const handleMarkRefunded = (entryId: string) => {
        setFormError(null);
        startTransition(async () => {
            const res = await markOpenPlayEntryRefundedAction(entryId);
            if (!res.ok) {
                setFormError(res.error || "Could not mark entry as refunded.");
            }
        });
    };

    return (
        <div className="space-y-6">
            {/* Header with Title and Create Session Action */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                        Open Play Sessions
                    </h1>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                        Schedule venue-hosted Open Play sessions, verify registrations, and manage court capacity.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        type="button"
                        onClick={() => {
                            setFormError(null);
                            setIsCreateModalOpen(true);
                        }}
                        size="sm"
                        className="h-9 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold gap-1.5 shadow-xs cursor-pointer"
                    >
                        <Plus className="size-3.5" />
                        <span>Create Session</span>
                    </Button>
                </div>
            </div>

            {/* Notification Banners */}
            {formSuccess && (
                <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/40 p-4 text-xs font-medium text-emerald-800 dark:text-emerald-300 flex items-center justify-between gap-2 shadow-2xs">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span>{formSuccess}</span>
                    </div>
                    <button
                        type="button"
                        onClick={() => setFormSuccess(null)}
                        className="text-emerald-700 hover:text-emerald-900 dark:text-emerald-400 dark:hover:text-emerald-200 text-xs font-semibold cursor-pointer"
                    >
                        Dismiss
                    </button>
                </div>
            )}

            {formError && (
                <div className="rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 p-4 text-xs font-medium text-red-700 dark:text-red-300 flex items-center justify-between gap-2 shadow-2xs">
                    <div className="flex items-center gap-2">
                        <AlertCircle className="size-4 text-red-600 dark:text-red-400 shrink-0" />
                        <span>{formError}</span>
                    </div>
                    <button
                        type="button"
                        onClick={() => setFormError(null)}
                        className="text-red-700 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200 text-xs font-semibold cursor-pointer"
                    >
                        Dismiss
                    </button>
                </div>
            )}

            {/* Needs Refund Alert Box */}
            {needsRefundEntries.length > 0 && (
                <div className="rounded-2xl border border-amber-200 dark:border-amber-800/70 bg-amber-50/80 dark:bg-amber-950/40 p-5 space-y-3">
                    <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-bold text-sm">
                        <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400 shrink-0" />
                        <span>Entries Pending GCash / Cash Refund ({needsRefundEntries.length})</span>
                    </div>
                    <p className="text-xs text-amber-800 dark:text-amber-300">
                        These players paid for a session that was later cancelled. Return their payment via GCash or Cash, then click Mark Refunded to clear this alert.
                    </p>
                    <div className="divide-y divide-amber-200/70 dark:divide-amber-800/60 rounded-xl border border-amber-200 dark:border-amber-800/60 bg-white dark:bg-slate-900 overflow-hidden text-xs">
                        {needsRefundEntries.map((entry) => (
                            <div
                                key={entry.entryId}
                                className="px-4 py-2.5 flex flex-wrap items-center justify-between gap-2"
                            >
                                <div>
                                    <span className="font-semibold text-slate-900 dark:text-white">
                                        {entry.name}
                                    </span>
                                    {entry.email && (
                                        <span className="text-slate-500 dark:text-slate-400 ml-1.5">
                                            ({entry.email})
                                        </span>
                                    )}
                                    <span className="inline-flex items-center rounded-md bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/70 px-1.5 py-0.5 text-xs font-mono font-semibold text-blue-700 dark:text-blue-300 ml-2">
                                        GCash / Phone: {entry.phone || "No phone on file"}
                                    </span>
                                    <span className="text-slate-500 dark:text-slate-400 ml-2">
                                        · {entry.courtName} ({entry.sessionDate}, {formatTime(entry.startTime)}–{formatTime(entry.endTime)})
                                    </span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="font-bold text-amber-800 dark:text-amber-300 tabular-nums">
                                        ₱{entry.amount.toFixed(2)}
                                    </span>
                                    <Button
                                        type="button"
                                        size="sm"
                                        disabled={isPending}
                                        onClick={() => handleMarkRefunded(entry.entryId)}
                                        className="h-7 px-2.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold cursor-pointer"
                                    >
                                        Mark Refunded
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Sessions List */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">
                        Open Play Sessions ({sessions.length})
                    </h2>
                </div>

                {sessions.length === 0 ? (
                    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center space-y-3">
                        <div className="size-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                            <Users className="size-6" />
                        </div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">
                            No Open Play Sessions Scheduled
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                            Schedule your first venue-hosted Open Play session to place court holds and open registrations for players.
                        </p>
                        <div className="pt-2">
                            <Button
                                type="button"
                                onClick={() => setIsCreateModalOpen(true)}
                                className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 gap-1.5 cursor-pointer shadow-xs"
                            >
                                <Plus className="size-3.5" />
                                <span>Schedule First Session</span>
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {sessions.map((s) => {
                            const paidCount = s.players.filter((p) => p.status === "paid").length;
                            const isCancelled = s.status === "cancelled";

                            return (
                                <div
                                    key={s.id}
                                    className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4"
                                >
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-bold text-slate-900 dark:text-white text-sm">
                                                    {s.courtName}
                                                </span>
                                                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 tabular-nums">
                                                    {s.date} · {formatTime(s.startTime)} – {formatTime(s.endTime)}
                                                </span>
                                                <span
                                                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
                                                        isCancelled
                                                            ? "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                                                            : "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                                                    }`}
                                                >
                                                    {isCancelled ? "Cancelled" : "Scheduled"}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                                                <span>₱{s.pricePerPlayer.toFixed(2)} / player</span>
                                                <span className="inline-flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-200">
                                                    <Users className="size-3.5 text-blue-600 dark:text-blue-400" />
                                                    {paidCount} / {s.playerCap} paid ({s.spotsLeft} spots left)
                                                </span>
                                            </div>
                                        </div>

                                        {!isCancelled && (
                                            <div>
                                                {confirmCancelId === s.id ? (
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            type="button"
                                                            disabled={isPending}
                                                            onClick={() => handleCancelSession(s.id)}
                                                            className="rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-3 py-1.5 cursor-pointer"
                                                        >
                                                            Confirm Cancel
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            onClick={() => setConfirmCancelId(null)}
                                                            className="rounded-lg text-xs px-3 py-1.5 cursor-pointer"
                                                        >
                                                            Keep
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        onClick={() => setConfirmCancelId(s.id)}
                                                        className="rounded-lg border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs px-3 py-1.5 cursor-pointer"
                                                    >
                                                        <XCircle className="size-3.5 mr-1" />
                                                        Cancel Session
                                                    </Button>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {s.players.length > 0 && (
                                        <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
                                            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                                                Entries ({s.players.length})
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                                {s.players.map((p) => {
                                                    const badgeTone =
                                                        p.status === "paid"
                                                            ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                                                            : p.isRefunded || p.status === "cancelled"
                                                            ? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                                                            : "bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800";
                                                    const isGCash = p.paymentMethod === "GCash QR";

                                                    return (
                                                        <div
                                                            key={p.entryId}
                                                            className="flex flex-col justify-between gap-2 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 px-3 py-2.5 text-xs"
                                                        >
                                                            <div className="flex items-start justify-between gap-2">
                                                                <div className="min-w-0">
                                                                    <div className="font-semibold text-slate-900 dark:text-white truncate">
                                                                        {p.name}
                                                                    </div>
                                                                    {p.email && (
                                                                        <div className="text-slate-500 dark:text-slate-400 truncate">
                                                                            {p.email}
                                                                        </div>
                                                                    )}
                                                                    {p.phone && (
                                                                        <div className="text-blue-600 dark:text-blue-400 font-mono text-xs truncate">
                                                                            GCash/Tel: {p.phone}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <span
                                                                    className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-semibold ${badgeTone}`}
                                                                >
                                                                    {p.isRefunded
                                                                        ? "Refunded"
                                                                        : p.status === "needs_refund"
                                                                        ? "Needs Refund"
                                                                        : p.status === "paid"
                                                                        ? "Paid"
                                                                        : p.status === "cancelled"
                                                                        ? "Cancelled"
                                                                        : "Pending"}
                                                                </span>
                                                            </div>

                                                            <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-slate-200/60 dark:border-slate-800">
                                                                <span className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-300 font-medium truncate">
                                                                    {isGCash ? (
                                                                        <QrCode className="size-3 text-blue-600 dark:text-blue-400 shrink-0" />
                                                                    ) : (
                                                                        <Banknote className="size-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                                                    )}
                                                                    <span>
                                                                        {p.paymentMethod}
                                                                        {p.paymentReference ? ` (Ref: ${p.paymentReference})` : ""}
                                                                    </span>
                                                                </span>

                                                                {p.status === "pending" && !isCancelled && (
                                                                    <Button
                                                                        type="button"
                                                                        size="sm"
                                                                        disabled={isPending}
                                                                        onClick={() => handleMarkPaid(p.entryId)}
                                                                        className="h-7 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer shrink-0 flex items-center gap-1"
                                                                    >
                                                                        <CheckCircle2 className="size-3" />
                                                                        Mark Paid
                                                                    </Button>
                                                                )}

                                                                {p.status === "needs_refund" && (
                                                                    <Button
                                                                        type="button"
                                                                        size="sm"
                                                                        disabled={isPending}
                                                                        onClick={() => handleMarkRefunded(p.entryId)}
                                                                        className="h-7 px-2.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold cursor-pointer shrink-0"
                                                                    >
                                                                        Mark Refunded
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
            {/* Create Open Play Session Modal */}
            <CreateOpenPlaySessionModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSubmit={handleCreateSubmit}
                courts={courts}
                todayISO={todayISO}
                isSubmitting={isPending}
            />
        </div>
    );
}

