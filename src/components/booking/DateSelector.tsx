"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

const DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Local-time helpers (avoids the UTC shift from toISOString)
function toISO(d: Date) {
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${d.getFullYear()}-${m}-${day}`;
}

export default function DateSelector({
    selectedDate,
    today,
}: {
    selectedDate: string;
    today?: string;
}) {
    const router = useRouter();
    const [weekOffset, setWeekOffset] = useState(0);

    const todayISO = today || toISO(new Date());
    const [tYear, tMonth, tDay] = todayISO.split("-").map(Number);

    const days = Array.from({ length: 7 }, (_, i) => {
        return new Date(tYear, tMonth - 1, tDay + weekOffset * 7 + i);
    });

    const go = (iso: string) => router.push(`/?date=${iso}#book-a-court`);

    return (
        <div className="flex w-full items-center gap-1.5 sm:gap-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-2 sm:p-3 shadow-xs">
            <button
                onClick={() => setWeekOffset(Math.max(0, weekOffset - 1))}
                disabled={weekOffset === 0}
                aria-label="Previous week"
                className={`flex size-9 sm:size-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 transition-colors ${
                    weekOffset === 0
                        ? "opacity-30 cursor-not-allowed text-slate-400 dark:text-slate-600"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                }`}
            >
                <ChevronLeft size={18} />
            </button>

            {/* Date cards: swipeable on mobile, 7-col grid on tablet/desktop */}
            <div className="flex sm:grid flex-1 overflow-x-auto sm:overflow-visible sm:grid-cols-7 gap-1.5 sm:gap-2 scrollbar-none snap-x snap-mandatory scroll-smooth py-0.5 touch-pan-x">
                {days.map((d) => {
                    const iso = toISO(d);
                    const isSelected = iso === selectedDate;
                    const isToday = iso === todayISO;
                    return (
                        <button
                            key={iso}
                            onClick={() => go(iso)}
                            className={`snap-center flex flex-col items-center justify-center rounded-xl px-2 sm:px-1 py-2 sm:py-2.5 min-w-[56px] sm:min-w-0 flex-1 transition-all cursor-pointer relative ${
                                isSelected
                                    ? "border-2 border-blue-600 bg-blue-50/80 dark:bg-blue-950/70 text-blue-950 dark:text-blue-100 shadow-xs scale-[1.02]"
                                    : "border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                            }`}
                        >
                            <span className={`text-xs font-semibold tracking-wider uppercase flex items-center gap-1 ${isSelected ? "text-blue-700 dark:text-blue-300 font-bold" : "text-slate-500 dark:text-slate-400"}`}>
                                {isToday ? "TODAY" : DAYS[d.getDay()]}
                                {isToday && !isSelected && (
                                    <span className="size-1 rounded-full bg-blue-600 dark:bg-blue-400 inline-block" />
                                )}
                            </span>
                            <span className="text-lg sm:text-2xl font-black leading-tight tabular-nums my-0.5">{d.getDate()}</span>
                            <span className={`text-xs font-medium ${isSelected ? "text-blue-700 dark:text-blue-300" : "text-slate-500 dark:text-slate-400"}`}>
                                {MONTHS[d.getMonth()]}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* More Dates: native date picker */}
            <label className="relative flex w-12 sm:w-24 min-h-[44px] shrink-0 cursor-pointer flex-col items-center justify-center gap-0.5 sm:gap-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 text-xs font-bold text-slate-800 dark:text-slate-200 hover:border-blue-300 dark:hover:border-blue-500 hover:bg-blue-50/40 dark:hover:bg-blue-950/40 hover:text-blue-700 dark:hover:text-blue-300 transition-all py-1.5 sm:py-0">
                <CalendarDays size={18} className="text-slate-500 dark:text-slate-400 shrink-0" />
                <span className="hidden sm:inline text-center leading-tight">More<br />Dates</span>
                <span className="sm:hidden text-xs uppercase font-bold text-slate-500 dark:text-slate-400">Date</span>
                <input
                    type="date"
                    min={todayISO}
                    value={selectedDate}
                    onChange={(e) => e.target.value && go(e.target.value)}
                    className="absolute inset-0 cursor-pointer opacity-0"
                    aria-label="Select custom date"
                />
            </label>

            <button
                onClick={() => setWeekOffset(weekOffset + 1)}
                aria-label="Next week"
                className="flex size-9 sm:size-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            >
                <ChevronRight size={18} />
            </button>
        </div>
    );
}
