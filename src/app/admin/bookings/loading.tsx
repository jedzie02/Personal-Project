import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function AdminBookingsLoading() {
    return (
        <div className="space-y-6 animate-in fade-in duration-200">
            {/* Header with Title and "New Booking" action */}
            <div className="flex justify-between items-center">
                <Skeleton className="h-8 w-56 rounded-lg bg-slate-200 dark:bg-slate-800" />
                <Skeleton className="h-9 w-32 rounded-lg bg-blue-200 dark:bg-blue-900" />
            </div>

            {/* Bookings Card */}
            <Card className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
                <CardHeader className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
                    <Skeleton className="h-5 w-44 bg-slate-200 dark:bg-slate-800" />
                    <Skeleton className="h-8 w-36 rounded-md bg-slate-100 dark:bg-slate-800" />
                </CardHeader>
                <CardContent className="p-0">
                    {/* Table Header */}
                    <div className="grid grid-cols-5 p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                        {["Court", "Customer", "Time & Date", "Price", "Status"].map((col, idx) => (
                            <span key={idx} className="text-xs font-semibold text-slate-400 uppercase">
                                {col}
                            </span>
                        ))}
                    </div>

                    {/* Table Rows */}
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {[1, 2, 3, 4, 5, 6, 7].map((row) => (
                            <div key={row} className="grid grid-cols-5 p-4 items-center">
                                <div className="flex items-center gap-2">
                                    <Skeleton className="size-2 rounded-full bg-emerald-500" />
                                    <Skeleton className="h-4 w-20 bg-slate-200 dark:bg-slate-800" />
                                </div>
                                <div className="space-y-1">
                                    <Skeleton className="h-4 w-28 bg-slate-200 dark:bg-slate-800" />
                                    <Skeleton className="h-3 w-36 bg-slate-100 dark:bg-slate-800" />
                                </div>
                                <Skeleton className="h-4 w-32 bg-slate-200 dark:bg-slate-800" />
                                <Skeleton className="h-4 w-16 bg-slate-200 dark:bg-slate-800" />
                                <Skeleton className="h-6 w-20 rounded-full bg-emerald-100 dark:bg-emerald-950" />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
