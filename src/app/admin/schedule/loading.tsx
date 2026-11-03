import { Skeleton } from "@/components/ui/skeleton";

export default function AdminScheduleLoading() {
  return (
    <div className="flex flex-col gap-5 animate-in fade-in duration-150">
      {/* 1. Header with Title and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Skeleton className="h-8 w-56 rounded-lg bg-slate-200 dark:bg-slate-800" />
          <Skeleton className="h-4 w-80 max-w-full mt-1.5 rounded-md bg-slate-100 dark:bg-slate-800/60" />
        </div>
        <div className="flex items-center gap-2.5">
          <Skeleton className="h-9 w-36 rounded-lg bg-slate-100 dark:bg-slate-800" />
          <Skeleton className="h-9 w-32 rounded-lg bg-blue-100 dark:bg-blue-950" />
        </div>
      </div>

      {/* 2. Command Bar & Operational Strip Skeleton */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden">
        <div className="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <Skeleton className="h-9 w-48 rounded-xl bg-slate-100 dark:bg-slate-800" />
            <Skeleton className="h-8 w-16 rounded-lg bg-slate-100 dark:bg-slate-800" />
            <Skeleton className="h-5 w-44 rounded-md bg-slate-100 dark:bg-slate-800 hidden sm:block" />
          </div>

          <div className="flex items-center gap-1.5">
            <Skeleton className="h-7 w-20 rounded-xl bg-slate-200 dark:bg-slate-800" />
            <Skeleton className="h-7 w-16 rounded-xl bg-slate-100 dark:bg-slate-800" />
            <Skeleton className="h-7 w-16 rounded-xl bg-slate-100 dark:bg-slate-800" />
            <Skeleton className="h-7 w-16 rounded-xl bg-slate-100 dark:bg-slate-800" />
            <Skeleton className="h-7 w-16 rounded-xl bg-slate-100 dark:bg-slate-800" />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-slate-800 bg-slate-50/40 dark:bg-slate-950/30">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="px-4 py-3 space-y-1.5">
              <Skeleton className="h-3.5 w-24 rounded bg-slate-200/70 dark:bg-slate-800" />
              <Skeleton className="h-5 w-28 rounded bg-slate-200 dark:bg-slate-700" />
            </div>
          ))}
        </div>
      </div>

      {/* 3. Status Legend skeleton */}
      <div className="flex items-center justify-between gap-4 px-1">
        <div className="flex items-center gap-3">
          <Skeleton className="h-4 w-28 bg-slate-100 dark:bg-slate-800 rounded" />
          <Skeleton className="h-4 w-28 bg-slate-100 dark:bg-slate-800 rounded" />
          <Skeleton className="h-4 w-24 bg-slate-100 dark:bg-slate-800 rounded" />
          <Skeleton className="h-4 w-24 bg-slate-100 dark:bg-slate-800 rounded" />
        </div>
        <Skeleton className="h-4 w-36 bg-slate-100 dark:bg-slate-800 rounded hidden md:block" />
      </div>

      {/* 4. Schedule Timeline Grid Card */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden">
        <div className="min-w-[820px]">
          <div className="grid grid-cols-[130px_repeat(4,minmax(170px,1fr))] sm:grid-cols-[165px_repeat(4,1fr)] border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40">
            <div className="p-3.5 border-r border-slate-200 dark:border-slate-800 flex items-center justify-center">
              <Skeleton className="h-4 w-24 bg-slate-200 dark:bg-slate-800" />
            </div>
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="p-3.5 border-r last:border-r-0 border-slate-200 dark:border-slate-800 flex items-center justify-center gap-2"
              >
                <Skeleton className="h-4 w-20 bg-slate-200 dark:bg-slate-800" />
                <Skeleton className="h-4 w-12 bg-slate-100 dark:bg-slate-800" />
              </div>
            ))}
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {[
              "09:00 AM – 10:00 AM",
              "10:00 AM – 11:00 AM",
              "11:00 AM – 12:00 PM",
              "12:00 PM – 01:00 PM",
              "01:00 PM – 02:00 PM",
              "02:00 PM – 03:00 PM",
              "03:00 PM – 04:00 PM",
              "04:00 PM – 05:00 PM",
              "05:00 PM – 06:00 PM",
              "06:00 PM – 07:00 PM",
              "07:00 PM – 08:00 PM",
              "08:00 PM – 09:00 PM",
              "09:00 PM – 10:00 PM",
              "10:00 PM – 11:00 PM",
            ].map((slotLabel, idx) => (
              <div
                key={idx}
                className="grid grid-cols-[130px_repeat(4,minmax(170px,1fr))] sm:grid-cols-[165px_repeat(4,1fr)] min-h-[68px] items-stretch"
              >
                <div className="border-r border-slate-200 dark:border-slate-800 flex items-center justify-center p-2.5 bg-white dark:bg-slate-900">
                  <span className="text-xs font-semibold text-slate-400 tabular-nums">
                    {slotLabel}
                  </span>
                </div>
                {[1, 2, 3, 4].map((c) => (
                  <div
                    key={c}
                    className="border-r last:border-r-0 border-slate-100 dark:border-slate-800/80 p-1.5 flex items-center"
                  >
                    {(idx + c) % 4 === 0 ? (
                      <Skeleton className="w-full h-[54px] rounded-xl bg-blue-100/70 dark:bg-blue-950/50" />
                    ) : (idx + c) % 5 === 0 ? (
                      <Skeleton className="w-full h-[54px] rounded-xl bg-amber-50 dark:bg-amber-950/40" />
                    ) : (
                      <Skeleton className="w-full h-[54px] rounded-xl bg-slate-50 dark:bg-slate-800/40" />
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
