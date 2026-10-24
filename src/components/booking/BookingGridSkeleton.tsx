import { Skeleton } from "@/components/ui/skeleton";
import { Clock } from "lucide-react";

export function BookingGridSkeleton() {
    return (
        <div className="w-full space-y-4">
            {/* Quick onboarding guide skeleton */}
            <div className="flex items-center justify-between p-3.5 rounded-xl border border-blue-100 bg-blue-50/40">
                <div className="flex items-center gap-2.5">
                    <Skeleton className="size-6 rounded-full bg-blue-200" />
                    <Skeleton className="h-4 w-72 max-w-[60vw] bg-blue-100" />
                </div>
                <Skeleton className="h-6 w-16 rounded-md bg-blue-200" />
            </div>

            {/* Grid Container */}
            <div className="w-full bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                {/* Header Title */}
                <div className="flex items-center gap-3 p-4 border-b border-slate-100 bg-white">
                    <Clock className="w-5 h-5 text-blue-500 animate-pulse" />
                    <Skeleton className="h-6 w-36 bg-slate-200" />
                </div>

                {/* Grid Table */}
                <div className="relative overflow-x-auto w-full">
                    <div className="min-w-[700px]">
                        {/* Court headers */}
                        <div className="grid grid-cols-[175px_repeat(4,1fr)] border-b border-slate-100 bg-slate-50/50">
                            <div className="py-4 px-2 text-center text-sm font-semibold text-gray-400 border-r border-slate-100 flex items-center justify-center">
                                Time
                            </div>
                            {[1, 2, 3, 4].map((i) => (
                                <div
                                    key={i}
                                    className="py-4 px-2 flex flex-col items-center justify-center gap-1.5 border-r last:border-r-0 border-slate-100"
                                >
                                    <Skeleton className="h-4 w-16 bg-slate-200" />
                                    <Skeleton className="h-3 w-12 bg-blue-100" />
                                </div>
                            ))}
                        </div>

                        {/* Rows */}
                        <div className="divide-y divide-slate-100">
                            {[
                                "09:00 AM",
                                "10:00 AM",
                                "11:00 AM",
                                "12:00 PM",
                                "01:00 PM",
                                "02:00 PM",
                                "03:00 PM",
                                "04:00 PM",
                            ].map((label, idx) => (
                                <div
                                    key={idx}
                                    className="grid grid-cols-[175px_repeat(4,1fr)] items-center"
                                >
                                    {/* Time Label Column */}
                                    <div className="p-3 border-r border-slate-100 flex flex-col items-center justify-center gap-1">
                                        <span className="text-xs font-semibold text-slate-400">
                                            {label}
                                        </span>
                                    </div>

                                    {/* Court Columns */}
                                    {[1, 2, 3, 4].map((courtIdx) => (
                                        <div
                                            key={courtIdx}
                                            className="p-1.5 border-r last:border-r-0 border-slate-100"
                                        >
                                            <Skeleton className="w-full h-11 rounded-[14px] bg-slate-100/80" />
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
