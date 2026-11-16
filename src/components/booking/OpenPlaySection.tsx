"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Users, Calendar, Clock, Ticket, RotateCcw, ArrowRight } from "lucide-react";
import type { OpenPlaySessionView } from "@/lib/services/open-play.service";
import { formatTime } from "@/lib/utils/date";
import JoinOpenPlayButton from "./JoinOpenPlayButton";

function formatFullDateHeader(dateStr: string, todayISO?: string): string {
    const [y, m, d] = dateStr.split("-").map(Number);
    if (!y || !m || !d) return dateStr;
    const dt = new Date(Date.UTC(y, m - 1, d));
    const formatted = dt.toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
    });

    if (todayISO && dateStr === todayISO) {
        return `Today · ${formatted}`;
    }
    return formatted;
}

function formatChipDate(dateStr: string, todayISO?: string): string {
    if (todayISO && dateStr === todayISO) return "Today";
    const [y, m, d] = dateStr.split("-").map(Number);
    if (!y || !m || !d) return dateStr;
    const dt = new Date(Date.UTC(y, m - 1, d));
    return dt.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        timeZone: "UTC",
    });
}

export default function OpenPlaySection({
    sessions = [],
    todayISO,
    borderTop = false,
}: {
    sessions: OpenPlaySessionView[];
    todayISO?: string;
    borderTop?: boolean;
}) {
    const [selectedDate, setSelectedDate] = useState<string>("all");
    const hasSessions = sessions && sessions.length > 0;

    // Distinct dates
    const availableDates = useMemo(() => {
        const set = new Set<string>();
        for (const s of sessions) {
            if (s.date) set.add(s.date);
        }
        return Array.from(set).sort();
    }, [sessions]);

    // Filtered sessions
    const filteredSessions = useMemo(() => {
        if (selectedDate === "all") return sessions;
        return sessions.filter((s) => s.date === selectedDate);
    }, [sessions, selectedDate]);

    // Group filtered sessions by date
    const groupedSessions = useMemo(() => {
        const map = new Map<string, OpenPlaySessionView[]>();
        for (const s of filteredSessions) {
            const list = map.get(s.date) || [];
            list.push(s);
            map.set(s.date, list);
        }
        return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
    }, [filteredSessions]);

    return (
        <section
            id="open-play"
            className={`scroll-mt-20 py-8 sm:py-12 px-4 sm:px-6 lg:px-8 ${
                borderTop ? "border-t border-slate-200/80 dark:border-slate-800" : ""
            }`}
            aria-labelledby="open-play-heading"
        >
            <div className="mx-auto max-w-5xl">
                {/* Header */}
                <div className="text-center mb-8 sm:mb-10">
                    <h1
                        id="open-play-heading"
                        className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white"
                    >
                        Open Play Sessions
                    </h1>
                    <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
                        Drop in solo or with a partner. Reserve your individual spot, rotate games with fellow players, and enjoy fast-paced rallies.
                    </p>
                </div>

                {/* 3-Step Rotation Explainer */}
                <div className="mb-10 max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-200/80 dark:divide-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4 sm:p-5 shadow-2xs">
                    <div className="flex items-start gap-3 p-2.5 sm:p-3">
                        <div className="size-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/80 dark:border-blue-800/60 flex items-center justify-center shrink-0">
                            <Ticket className="size-4" />
                        </div>
                        <div>
                            <h2 className="text-xs font-bold text-slate-900 dark:text-white">1. Reserve Online</h2>
                            <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">Lock your paddle spot online by card to guarantee your court time.</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3 p-2.5 sm:p-3">
                        <div className="size-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/60 flex items-center justify-center shrink-0">
                            <RotateCcw className="size-4" />
                        </div>
                        <div>
                            <h2 className="text-xs font-bold text-slate-900 dark:text-white">2. Paddle-Stack Rotation</h2>
                            <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">Standard games to 11 (win by 2). Rotate after matches so everyone plays.</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3 p-2.5 sm:p-3">
                        <div className="size-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200/80 dark:border-purple-800/60 flex items-center justify-center shrink-0">
                            <Users className="size-4" />
                        </div>
                        <div>
                            <h2 className="text-xs font-bold text-slate-900 dark:text-white">3. All Levels Welcome</h2>
                            <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">Friendly doubles pairing welcoming both newcomers and seasoned rec players.</p>
                        </div>
                    </div>
                </div>

                {!hasSessions ? (
                    /* Empty State */
                    <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-8 sm:p-10 text-center shadow-xs">
                        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/60">
                            <Users className="size-6" />
                        </div>
                        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                            No community sessions scheduled yet
                        </h3>
                        <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-sm mx-auto">
                            Venue-hosted Open Play sessions are added throughout the week. Want to play right now with your own group?
                        </p>
                        <div className="mt-6 flex justify-center">
                            <Link
                                href="/book"
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all cursor-pointer"
                            >
                                <span>Book a Private Court</span>
                                <ArrowRight className="size-3.5" />
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div className="max-w-4xl mx-auto space-y-8">
                        {/* Date Filter Chips (shown when 2+ dates exist) */}
                        {availableDates.length > 1 && (
                            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none" aria-label="Filter sessions by date">
                                <button
                                    type="button"
                                    onClick={() => setSelectedDate("all")}
                                    className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                                        selectedDate === "all"
                                            ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs"
                                            : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                                    }`}
                                >
                                    All Dates ({sessions.length})
                                </button>
                                {availableDates.map((dateStr) => {
                                    const label = formatChipDate(dateStr, todayISO);
                                    const count = sessions.filter((s) => s.date === dateStr).length;
                                    const isActive = selectedDate === dateStr;
                                    return (
                                        <button
                                            key={dateStr}
                                            type="button"
                                            onClick={() => setSelectedDate(dateStr)}
                                            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                                                isActive
                                                    ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs"
                                                    : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                                            }`}
                                        >
                                            {label} ({count})
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {/* Date-Grouped Sessions */}
                        <div className="space-y-8">
                            {groupedSessions.map(([dateKey, dateSessions]) => {
                                const headerLabel = formatFullDateHeader(dateKey, todayISO);

                                return (
                                    <div key={dateKey} className="space-y-3.5">
                                        <div className="flex items-center gap-2.5 pt-1">
                                            <Calendar className="size-4 text-blue-600 dark:text-blue-400 shrink-0" />
                                            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                                {headerLabel}
                                            </h2>
                                            <div className="flex-1 h-px bg-slate-200/80 dark:bg-slate-800" />
                                        </div>

                                        <div className="flex flex-col gap-3.5">
                                            {dateSessions.map((session) => {
                                                const isFull = session.spotsLeft <= 0;
                                                const isLowSpots = session.spotsLeft > 0 && session.spotsLeft <= 2;

                                                const badgeClasses = isFull
                                                    ? "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                                                    : isLowSpots
                                                    ? "bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                                                    : "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800";

                                                return (
                                                    <div
                                                        key={session.id}
                                                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 p-5 sm:p-6 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                                                    >
                                                        <div className="space-y-2">
                                                            <div className="flex items-center gap-3">
                                                                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                                                                    {session.courtName}
                                                                </h3>
                                                                <span
                                                                    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold tabular-nums ${badgeClasses}`}
                                                                >
                                                                    {isFull
                                                                        ? "Full"
                                                                        : `${session.spotsLeft} of ${session.playerCap} spots left`}
                                                                </span>
                                                            </div>

                                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-300">
                                                                <div className="flex items-center gap-1.5 tabular-nums">
                                                                    <Clock className="size-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                                                                    <span className="font-semibold">
                                                                        {formatTime(session.startTime)} – {formatTime(session.endTime)}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center justify-between sm:justify-end gap-5 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800 shrink-0">
                                                            <div className="text-left sm:text-right">
                                                                <span className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                                                    Entry Fee
                                                                </span>
                                                                <span className="text-lg font-extrabold text-slate-900 dark:text-white tabular-nums">
                                                                    ₱{session.pricePerPlayer}
                                                                    <span className="text-xs font-normal text-slate-500 dark:text-slate-400 ml-0.5">
                                                                        /player
                                                                    </span>
                                                                </span>
                                                            </div>

                                                            <div className="w-36 sm:w-40">
                                                                <JoinOpenPlayButton
                                                                    sessionId={session.id}
                                                                    spotsLeft={session.spotsLeft}
                                                                    pricePerPlayer={session.pricePerPlayer}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}
