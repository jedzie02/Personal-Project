import { Skeleton } from "@/components/ui/skeleton";
import { Clock } from "lucide-react";

export function BookingGridSkeleton() {
    return (
        <div className="w-full space-y-4">
            {/* Quick onboarding guide skeleton */}
            <div className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-muted/50">
                <div className="flex items-center gap-2.5">
                    <Skeleton className="size-5 rounded-full bg-muted-foreground/30" />
                    <Skeleton className="h-4 w-72 max-w-[60vw] bg-muted-foreground/20" />
                </div>
                <Skeleton className="h-6 w-16 rounded-md bg-muted-foreground/20" />
            </div>

            {/* Grid Container */}
            <div className="w-full bg-card rounded-2xl border border-border overflow-hidden shadow-2xs">
                {/* Header Title */}
                <div className="flex items-center gap-3 p-4 border-b border-border bg-card">
                    <Clock className="w-5 h-5 text-muted-foreground animate-pulse" />
                    <Skeleton className="h-6 w-36 bg-muted" />
                </div>

                {/* Grid Table */}
                <div className="relative overflow-x-auto w-full">
                    <div className="min-w-[700px]">
                        {/* Court headers */}
                        <div className="grid grid-cols-[175px_repeat(4,1fr)] border-b border-border bg-muted/20">
                            <div className="py-4 px-2 text-center text-sm font-semibold text-muted-foreground border-r border-border flex items-center justify-center">
                                Time
                            </div>
                            {[1, 2, 3, 4].map((i) => (
                                <div
                                    key={i}
                                    className="py-4 px-2 flex flex-col items-center justify-center gap-1.5 border-r last:border-r-0 border-border"
                                >
                                    <Skeleton className="h-4 w-16 bg-muted" />
                                    <Skeleton className="h-3 w-12 bg-muted/70" />
                                </div>
                            ))}
                        </div>

                        {/* Rows */}
                        <div className="divide-y divide-border">
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
                                    <div className="p-3 border-r border-border flex flex-col items-center justify-center gap-1">
                                        <span className="text-xs font-semibold text-muted-foreground">
                                            {label}
                                        </span>
                                    </div>

                                    {/* Court Columns */}
                                    {[1, 2, 3, 4].map((courtIdx) => (
                                        <div
                                            key={courtIdx}
                                            className="p-1.5 border-r last:border-r-0 border-border"
                                        >
                                            <Skeleton className="w-full h-11 rounded-[14px] bg-muted/60" />
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
