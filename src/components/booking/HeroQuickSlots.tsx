"use client";

import { useRouter } from "next/navigation";
import { Zap, ArrowRight, Users } from "lucide-react";
import type { QuickSlotsSummary, QuickSlotCard } from "@/lib/utils/quick-slots";

export function HeroLiveStatusBadge({
    summary,
    todayISO,
}: {
    summary: QuickSlotsSummary;
    todayISO: string;
}) {
    const isTomorrow = Boolean(summary.date && summary.date > todayISO);
    const hasOpenSlots = summary.totalOpenSlots > 0;

    return (
        <div className="animate-hero-rise inline-flex flex-wrap items-center justify-center gap-2 rounded-full border border-emerald-200/90 dark:border-emerald-800/70 bg-emerald-50/90 dark:bg-emerald-950/50 px-3.5 py-1.5 text-xs font-semibold text-emerald-900 dark:text-emerald-200 shadow-xs">
            <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                {hasOpenSlots ? (
                    <span className="tabular-nums">
                        {isTomorrow
                            ? `Booking Open Tomorrow · ${summary.totalOpenSlots} Open ${summary.totalOpenSlots === 1 ? "Slot" : "Slots"}`
                            : `Live Today · ${summary.totalOpenSlots} Open ${summary.totalOpenSlots === 1 ? "Slot" : "Slots"}`}
                    </span>
                ) : (
                    <span>4 Master Courts · Instant GCash &amp; Card Checkout</span>
                )}
            </span>
            <span className="text-emerald-400 dark:text-emerald-700" aria-hidden="true">
                ·
            </span>
            <span className="inline-flex items-center gap-1 text-blue-700 dark:text-blue-300 tabular-nums">
                <Users className="size-3.5 shrink-0" />
                ₱{summary.lowestHourlyRate}/hr (Only ₱{summary.lowestSplitPerPlayer}/player for 4)
            </span>
        </div>
    );
}

export default function HeroQuickSlots({
    summary,
    activeDate,
    todayISO,
}: {
    summary: QuickSlotsSummary;
    activeDate: string;
    todayISO: string;
}) {
    const router = useRouter();

    if (!summary.slots || summary.slots.length === 0) {
        return null;
    }

    const isTomorrowPreview = Boolean(summary.date && summary.date > todayISO);

    const handleSelectQuickSlot = (slot: QuickSlotCard) => {
        if (slot.date === activeDate) {
            window.dispatchEvent(
                new CustomEvent("paddlix:select-slot", {
                    detail: {
                        courtId: slot.courtId,
                        courtName: slot.courtName,
                        hour: slot.hour,
                    },
                })
            );
            const target = document.getElementById("book-a-court");
            if (target) {
                target.scrollIntoView({ behavior: "smooth", block: "start" });
            }
            return;
        }

        const url = `/?date=${encodeURIComponent(slot.date)}&selectCourt=${encodeURIComponent(slot.courtId)}&selectHour=${encodeURIComponent(slot.hour)}#book-a-court`;
        router.push(url);
    };

    return (
        <div
            className="animate-hero-rise mt-6 w-full max-w-3xl mx-auto rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/90 p-4 sm:p-5 text-left shadow-xs"
            style={{ animationDelay: "360ms" }}
        >
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3.5">
                <div className="flex items-center gap-2">
                    <span className="flex size-6 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 border border-blue-200/70 dark:border-blue-800/60">
                        <Zap className="size-3.5" />
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                        {isTomorrowPreview ? "Next Open Slots Tomorrow" : "Next Open Slots Today"}
                    </span>
                    <span className="hidden sm:inline text-xs text-slate-500 dark:text-slate-400">
                        · Tap any slot to add to your booking cart
                    </span>
                </div>
                <a
                    href="#book-a-court"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                >
                    <span>Full Schedule</span>
                    <ArrowRight className="size-3.5" />
                </a>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
                {summary.slots.map((slot) => {
                    const badgeClasses =
                        slot.badgeTone === "rose"
                            ? "bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200/80 dark:border-rose-800/60"
                            : slot.badgeTone === "amber"
                            ? "bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/60"
                            : "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/60";

                    return (
                        <button
                            key={`${slot.date}-${slot.courtId}-${slot.hour}`}
                            type="button"
                            onClick={() => handleSelectQuickSlot(slot)}
                            className="group flex flex-col justify-between gap-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 p-3.5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50/40 dark:hover:bg-blue-950/30 hover:shadow-md cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                        >
                            <div className="space-y-1.5 w-full">
                                <div className="flex items-center justify-between gap-1.5">
                                    <span
                                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${badgeClasses}`}
                                    >
                                        {slot.badgeLabel}
                                    </span>
                                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 tabular-nums">
                                        {slot.courtName}
                                    </span>
                                </div>

                                <div className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">
                                    {slot.timeLabel}
                                </div>
                            </div>

                            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/70 dark:border-slate-800/80 w-full">
                                <div className="text-xs text-slate-600 dark:text-slate-400 tabular-nums">
                                    <span className="font-bold text-slate-900 dark:text-white">
                                        ₱{slot.hourlyRate}
                                    </span>
                                    <span>/hr · ₱{slot.splitPerPlayer}/player</span>
                                </div>
                                <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-blue-600 dark:text-blue-400 group-hover:translate-x-0.5 transition-transform">
                                    Select
                                    <ArrowRight className="size-3" />
                                </span>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

