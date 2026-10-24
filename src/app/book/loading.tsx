import { Skeleton } from "@/components/ui/skeleton";
import { BookingGridSkeleton } from "@/components/booking/BookingGridSkeleton";

export default function BookLoading() {
    return (
        <div className="min-h-screen bg-slate-50/50 py-10 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header Skeleton */}
                <div className="flex items-center justify-between pb-2">
                    <div className="space-y-1.5">
                        <Skeleton className="h-7 w-44 rounded-lg bg-slate-200" />
                        <Skeleton className="h-4 w-64 rounded-md bg-slate-100" />
                    </div>
                    <Skeleton className="h-9 w-28 rounded-full bg-slate-200" />
                </div>

                {/* Date Selector Skeleton */}
                <div className="flex w-full items-stretch gap-2 rounded-2xl border border-gray-200 bg-white p-3 shadow-xs">
                    <div className="grid flex-1 grid-cols-7 gap-2">
                        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                            <div
                                key={i}
                                className="flex flex-col items-center justify-center rounded-xl p-3 border border-gray-100 bg-gray-50/60 gap-1.5"
                            >
                                <Skeleton className="h-3 w-8 bg-slate-200" />
                                <Skeleton className="h-6 w-7 bg-slate-300" />
                                <Skeleton className="h-3 w-6 bg-slate-200" />
                            </div>
                        ))}
                    </div>
                    <Skeleton className="w-24 shrink-0 rounded-xl bg-slate-100 border border-gray-200" />
                </div>

                {/* Grid Skeleton */}
                <BookingGridSkeleton />
            </div>
        </div>
    );
}