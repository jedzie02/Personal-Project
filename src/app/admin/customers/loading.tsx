import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function AdminCustomersLoading() {
    return (
        <div className="flex flex-col gap-6 animate-in fade-in duration-200">
            {/* Header */}
            <div>
                <Skeleton className="h-8 w-44 rounded-lg bg-slate-200 dark:bg-slate-800" />
                <Skeleton className="h-4 w-56 mt-1 rounded-md bg-slate-100 dark:bg-slate-900" />
            </div>

            {/* Search Bar Skeleton */}
            <div className="max-w-md">
                <Skeleton className="h-10 w-full rounded-xl bg-slate-100 dark:bg-slate-800" />
            </div>

            {/* Customers Table Card */}
            <Card className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
                <CardContent className="p-0">
                    {/* Header Row */}
                    <div className="grid grid-cols-5 p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                        {["Customer", "Bookings", "Tier", "Joined", ""].map((col, idx) => (
                            <span key={idx} className="text-xs font-semibold text-slate-400 uppercase">
                                {col}
                            </span>
                        ))}
                    </div>

                    {/* Customer Rows */}
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="grid grid-cols-5 p-4 items-center">
                                {/* Customer with avatar */}
                                <div className="flex items-center gap-3">
                                    <Skeleton className="size-9 rounded-full bg-slate-200 dark:bg-slate-800" />
                                    <div className="space-y-1">
                                        <Skeleton className="h-4 w-28 bg-slate-200 dark:bg-slate-800" />
                                        <Skeleton className="h-3 w-36 bg-slate-100 dark:bg-slate-800" />
                                    </div>
                                </div>

                                <Skeleton className="h-4 w-12 bg-slate-200 dark:bg-slate-800" />
                                <Skeleton className="h-6 w-24 rounded-full bg-blue-100 dark:bg-blue-950" />
                                <Skeleton className="h-4 w-24 bg-slate-200 dark:bg-slate-800" />
                                <div className="flex justify-end">
                                    <Skeleton className="h-8 w-16 rounded-lg bg-slate-100 dark:bg-slate-800" />
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
