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
        <div className="flex w-full items-stretch gap-2 rounded-2xl border border-border bg-card p-3 shadow-xs">
            {weekOffset > 0 && (
                <button
                    onClick={() => setWeekOffset(weekOffset - 1)}
                    aria-label="Previous week"
                    className="flex w-9 shrink-0 items-center justify-center self-center rounded-full border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors aspect-square cursor-pointer"
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
                            className={`flex flex-col items-center justify-center rounded-xl px-1 py-3 transition-all cursor-pointer relative ${
                                isSelected
                                    ? "border-2 border-primary bg-primary text-primary-foreground shadow-sm scale-[1.02]"
                                    : "border border-border bg-card text-foreground hover:border-foreground/40 hover:bg-muted/50"
                            }`}
                        >
                            {isSelected && (
                                <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-accent-court ring-2 ring-primary" />
                            )}
                            <span className={`text-[11px] font-semibold tracking-wider uppercase ${isSelected ? "text-primary-foreground/90 font-bold" : "text-muted-foreground"}`}>
                                {isToday ? "TODAY" : DAYS[d.getDay()]}
                            </span>
                            <span className="text-2xl font-black leading-tight tabular-nums my-0.5">{d.getDate()}</span>
                            <span className={`text-[11px] font-medium ${isSelected ? "text-primary-foreground/90" : "text-muted-foreground"}`}>
                                {MONTHS[d.getMonth()]}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* More Dates: native date picker laid over the button */}
            <label className="relative flex w-24 shrink-0 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-border bg-muted/40 text-xs font-bold text-foreground hover:border-foreground/40 hover:bg-muted transition-all">
                <CalendarDays size={16} className="text-muted-foreground" />
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
                className="flex w-9 shrink-0 items-center justify-center self-center rounded-full border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors aspect-square cursor-pointer"
            >
                <ChevronRight size={16} />
            </button>
        </div>
    );
}
