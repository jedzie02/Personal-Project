"use client";

import { useState, useTransition } from "react";
import { Users, Plus, AlertTriangle, XCircle, CheckCircle2, QrCode, Banknote } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AdminSessionView } from "@/lib/services/open-play.service";
import { formatTime } from "@/lib/utils/date";
import {
    createOpenPlaySessionAction,
    cancelOpenPlaySessionAction,
    markOpenPlayEntryPaidAction,
    markOpenPlayEntryRefundedAction,
} from "./actions";

const START_HOURS = [
    "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00",
    "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00",
];
const END_HOURS = [
    "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00",
    "17:00", "18:00", "19:00", "20:00", "21:00", "22:00", "23:00",
];

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

    const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setFormError(null);
        setFormSuccess(null);
        const form = e.currentTarget;
        const formData = new FormData(form);

        startTransition(async () => {
            const res = await createOpenPlaySessionAction(formData);
            if (!res.ok) {
                setFormError(res.error || "Could not create session.");
            } else {
                setFormSuccess("Open Play session created and court reserved.");
            }
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
        <div className="space-y-8">
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

            {/* Create Open Play Session Form */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
                <div className="flex items-center gap-2">
                    <Plus className="size-4 text-blue-600 dark:text-blue-400" />
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">
                        Create Open Play Session
                    </h2>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                    Creating a session automatically places a hold on that court and time window so private bookings cannot overlap it.
                </p>

                {formError && (
                    <div className="rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 px-4 py-2.5 text-xs font-medium text-red-700 dark:text-red-300">
                        {formError}
                    </div>
                )}

                {formSuccess && (
                    <div className="rounded-lg border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/40 px-4 py-2.5 text-xs font-medium text-emerald-800 dark:text-emerald-300">
                        {formSuccess}
                    </div>
                )}

                <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-3 items-end">
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Court
                        </label>
                        <select
                            name="courtId"
                            required
                            defaultValue={courts[0]?.id ?? ""}
                            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-white"
                        >
                            {courts.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Date
                        </label>
                        <input
                            type="date"
                            name="date"
                            required
                            min={todayISO}
                            defaultValue={todayISO}
                            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-white tabular-nums"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Start Time
                        </label>
                        <select
                            name="startTime"
                            defaultValue="18:00"
                            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-white tabular-nums"
                        >
                            {START_HOURS.map((h) => (
                                <option key={h} value={h}>
                                    {formatTime(h)}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            End Time
                        </label>
                        <select
                            name="endTime"
                            defaultValue="20:00"
                            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-white tabular-nums"
                        >
                            {END_HOURS.map((h) => (
                                <option key={h} value={h}>
                                    {formatTime(h)}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Price / Player (₱)
                        </label>
                        <input
                            type="number"
                            name="pricePerPlayer"
                            required
                            min={0}
                            step={1}
                            defaultValue={100}
                            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-white tabular-nums"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Player Cap
                        </label>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                name="playerCap"
                                required
                                min={1}
                                step={1}
                                defaultValue={8}
                                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-white tabular-nums"
                            />
                            <Button
                                type="submit"
                                disabled={isPending || courts.length === 0}
                                className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 shrink-0 cursor-pointer"
                            >
                                {isPending ? "Saving…" : "Create"}
                            </Button>
                        </div>
                    </div>
                </form>
            </div>

            {/* Sessions List */}
            <div className="space-y-4">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Open Play Sessions ({sessions.length})
                </h2>

                {sessions.length === 0 ? (
                    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-10 text-center text-sm text-slate-500 dark:text-slate-400">
                        No open play sessions created yet. Use the form above to schedule your first session.
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
        </div>
    );
}

