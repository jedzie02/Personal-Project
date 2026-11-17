import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function AdminLoading() {
    return (
        <div className="space-y-6 animate-in fade-in duration-200">
            {/* Header Skeleton */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-1.5">
                    <Skeleton className="h-8 w-48 rounded-lg bg-slate-200 dark:bg-slate-800" />
                    <Skeleton className="h-4 w-72 max-w-[80vw] rounded-md bg-slate-100 dark:bg-slate-900" />
                </div>
                <div className="flex items-center gap-2">
                    <Skeleton className="h-9 w-28 rounded-lg bg-slate-200 dark:bg-slate-800" />
                    <Skeleton className="h-9 w-32 rounded-lg bg-blue-200 dark:bg-blue-900" />
                </div>
            </div>

            {/* Metric KPI Cards (4 cards) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                    <Card key={i} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <Skeleton className="h-4 w-28 bg-slate-200 dark:bg-slate-800" />
                            <Skeleton className="size-8 rounded-lg bg-slate-100 dark:bg-slate-800" />
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Skeleton className="h-7 w-20 rounded-md bg-slate-200 dark:bg-slate-800" />
                            <Skeleton className="h-3 w-36 rounded-md bg-slate-100 dark:bg-slate-800" />
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Main Content Area (Table / Ledger / Grid Card) */}
            <Card className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
                <CardHeader className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="space-y-1.5">
                        <Skeleton className="h-5 w-40 bg-slate-200 dark:bg-slate-800" />
                        <Skeleton className="h-3.5 w-60 bg-slate-100 dark:bg-slate-800" />
                    </div>
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-8 w-44 rounded-lg bg-slate-100 dark:bg-slate-800" />
                        <Skeleton className="h-8 w-24 rounded-lg bg-slate-100 dark:bg-slate-800" />
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {/* Table Header Row */}
                    <div className="grid grid-cols-5 p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                        {[1, 2, 3, 4, 5].map((col) => (
                            <Skeleton key={col} className="h-4 w-20 bg-slate-200 dark:bg-slate-800" />
                        ))}
                    </div>
                    {/* Table Body Rows */}
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {[1, 2, 3, 4, 5, 6].map((row) => (
                            <div key={row} className="grid grid-cols-5 p-4 items-center">
                                <Skeleton className="h-4 w-28 bg-slate-200 dark:bg-slate-800" />
                                <Skeleton className="h-4 w-24 bg-slate-100 dark:bg-slate-800" />
                                <Skeleton className="h-4 w-20 bg-slate-100 dark:bg-slate-800" />
                                <Skeleton className="h-6 w-16 rounded-full bg-slate-200 dark:bg-slate-800" />
                                <Skeleton className="h-4 w-12 bg-slate-100 dark:bg-slate-800" />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
