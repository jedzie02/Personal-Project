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

export default function DateSelector({ selectedDate }: { selectedDate: string }) {
    const router = useRouter();
    const [weekOffset, setWeekOffset] = useState(0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = toISO(today);

    const days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(today);
        d.setDate(today.getDate() + weekOffset * 7 + i);
        return d;
    });

    const go = (iso: string) => router.push(`/book?date=${iso}`);

    return (
        <div className="flex w-full items-stretch gap-2 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
            {weekOffset > 0 && (
                <button
                    onClick={() => setWeekOffset(weekOffset - 1)}
                    aria-label="Previous week"
                    className="flex w-9 shrink-0 items-center justify-center self-center rounded-full border border-gray-200 text-gray-700 hover:bg-gray-100 aspect-square"
                >
                    <ChevronLeft size={16} />
                </button>
            )}

            {/* Date cards fill all remaining width evenly */}
            <div className="grid flex-1 grid-cols-7 gap-2">
                {days.map((d) => {
                    const iso = toISO(d);
                    const isSelected = iso === selectedDate;
                    const isToday = iso === todayISO;
                    return (
                        <button
                            key={iso}
                            onClick={() => go(iso)}
                            className={`flex flex-col items-center justify-center rounded-xl px-1 py-3 transition-all ${isSelected
                                    ? "border-2 border-gray-900 bg-white text-gray-900 shadow-sm"
                                    : "border border-gray-200 bg-gray-50 text-gray-900 hover:border-gray-300 hover:bg-gray-100"
                                }`}
                        >
                            <span className={`text-[10px] font-semibold tracking-wide ${isSelected ? "text-gray-900" : "text-gray-500"}`}>
                                {isToday ? "TODAY" : DAYS[d.getDay()]}
                            </span>
                            <span className="text-2xl font-extrabold leading-tight">{d.getDate()}</span>
                            <span className={`text-[10px] ${isSelected ? "text-gray-900" : "text-gray-500"}`}>
                                {MONTHS[d.getMonth()]}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* More Dates: native date picker laid over the button */}
            <label className="relative flex w-24 shrink-0 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-gray-300 bg-white text-sm font-bold text-gray-900 hover:border-gray-400 hover:bg-gray-50">
                <CalendarDays size={16} />
                <span className="text-center leading-tight">More<br />Dates</span>
                <input
                    type="date"
                    min={todayISO}
                    value={selectedDate}
                    onChange={(e) => e.target.value && go(e.target.value)}
                    className="absolute inset-0 cursor-pointer opacity-0"
                />
            </label>

            <button
                onClick={() => setWeekOffset(weekOffset + 1)}
                aria-label="Next week"
                className="flex w-9 shrink-0 items-center justify-center self-center rounded-full border border-gray-200 text-gray-700 hover:bg-gray-100 aspect-square"
            >
                <ChevronRight size={16} />
            </button>
        </div>
    );
}
