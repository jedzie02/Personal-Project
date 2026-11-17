"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "cn";

export interface CalendarProps {
  selected?: Date;
  onSelect?: (date: Date) => void;
  className?: string;
  minDate?: Date;
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const DAY_NAMES = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export function Calendar({
  selected,
  onSelect,
  className,
  minDate,
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState<Date>(
    () => selected || new Date()
  );

  React.useEffect(() => {
    if (selected) {
      setCurrentMonth(new Date(selected.getFullYear(), selected.getMonth(), 1));
    }
  }, [selected]);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  // Days in month
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const calendarDays: {
    day: number;
    monthOffset: number; // -1 = prev, 0 = curr, 1 = next
    date: Date;
  }[] = [];

  // Previous month padding
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i;
    calendarDays.push({
      day: d,
      monthOffset: -1,
      date: new Date(year, month - 1, d),
    });
  }

  // Current month
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push({
      day: i,
      monthOffset: 0,
      date: new Date(year, month, i),
    });
  }

  // Next month padding to fill out 35 or 42 cells
  const remaining = (7 - (calendarDays.length % 7)) % 7;
  for (let i = 1; i <= remaining; i++) {
    calendarDays.push({
      day: i,
      monthOffset: 1,
      date: new Date(year, month + 1, i),
    });
  }

  const isSameDay = (d1?: Date, d2?: Date) => {
    if (!d1 || !d2) return false;
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };

  const today = new Date();

  return (
    <div className={cn("p-2 select-none w-64", className)}>
      {/* Month & Nav */}
      <div className="flex items-center justify-between pb-2">
        <span className="text-xs font-semibold text-slate-900 dark:text-white">
          {MONTH_NAMES[month]} {year}
        </span>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={handlePrevMonth}
            className="h-6 w-6 p-0 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <ChevronLeft className="size-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={handleNextMonth}
            className="h-6 w-6 p-0 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <ChevronRight className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* Days of week */}
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-muted-foreground pb-1">
        {DAY_NAMES.map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Day Cells */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map(({ day, monthOffset, date }, idx) => {
          const isSelected = isSameDay(selected, date);
          const isCurrentToday = isSameDay(today, date);
          const isCurrentMonth = monthOffset === 0;

          return (
            <button
              key={idx}
              type="button"
              onClick={() => onSelect?.(date)}
              className={cn(
                "h-7 w-7 text-xs rounded-md flex items-center justify-center transition-colors cursor-pointer",
                !isCurrentMonth && "text-slate-300 dark:text-slate-600",
                isCurrentMonth && !isSelected && "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800",
                isCurrentToday && !isSelected && "font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700",
                isSelected && "bg-emerald-600 text-white font-bold hover:bg-emerald-700"
              )}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
