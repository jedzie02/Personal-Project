import { Skeleton } from "@/components/ui/skeleton";
import { BookingGridSkeleton } from "@/components/booking/BookingGridSkeleton";

export default function BookLoading() {
    return (
        <div className="min-h-screen bg-slate-950 py-10 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header Skeleton */}
                <div className="flex items-center justify-between pb-2">
                    <div className="space-y-1.5">
                        <Skeleton className="h-7 w-44 rounded-lg bg-slate-800" />
                        <Skeleton className="h-4 w-64 rounded-md bg-slate-800/60" />
                    </div>
                    <Skeleton className="h-9 w-28 rounded-full bg-slate-800" />
                </div>

                {/* Date Selector Skeleton */}
                <div className="flex w-full items-stretch gap-2 rounded-2xl border border-slate-800 bg-slate-900 p-3 shadow-xs">
                    <div className="grid flex-1 grid-cols-7 gap-2">
                        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                            <div
                                key={i}
                                className="flex flex-col items-center justify-center rounded-xl p-3 border border-slate-800 bg-slate-950/60 gap-1.5"
                            >
                                <Skeleton className="h-3 w-8 bg-slate-800" />
                                <Skeleton className="h-6 w-7 bg-slate-700" />
                                <Skeleton className="h-3 w-6 bg-slate-800" />
                            </div>
                        ))}
                    </div>
                    <Skeleton className="w-24 shrink-0 rounded-xl bg-slate-800 border border-slate-700" />
                </div>

                {/* Grid Skeleton */}
                <BookingGridSkeleton />
            </div>
        </div>
    );
}