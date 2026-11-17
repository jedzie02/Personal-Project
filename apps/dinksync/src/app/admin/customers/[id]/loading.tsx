import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function CustomerDetailLoading() {
    return (
        <div className="flex flex-col gap-6 animate-in fade-in duration-200">
            {/* Back link */}
            <Skeleton className="h-4 w-32 bg-slate-200 dark:bg-slate-800" />

            {/* Profile Overview Header */}
            <div className="space-y-2">
                <Skeleton className="h-8 w-56 rounded-lg bg-slate-200 dark:bg-slate-800" />
                <div className="flex flex-wrap items-center gap-4">
                    <Skeleton className="h-4 w-44 bg-slate-100 dark:bg-slate-800" />
                    <Skeleton className="h-4 w-32 bg-slate-100 dark:bg-slate-800" />
                    <Skeleton className="h-4 w-36 bg-slate-100 dark:bg-slate-800" />
                </div>
            </div>

            {/* 3 Metric Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                    { label: "Total Spend", w: "w-24" },
                    { label: "Total Bookings", w: "w-16" },
                    { label: "Active Status", w: "w-20" },
                ].map((stat, i) => (
                    <Card key={i} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                {stat.label}
                            </span>
                            <Skeleton className="size-7 rounded-lg bg-slate-100 dark:bg-slate-800" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className={`h-7 ${stat.w} bg-slate-200 dark:bg-slate-800 rounded-md`} />
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Customer Bookings Table Card */}
            <Card className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
                <CardHeader className="p-5 border-b border-slate-100 dark:border-slate-800">
                    <Skeleton className="h-5 w-44 bg-slate-200 dark:bg-slate-800" />
                </CardHeader>
                <CardContent className="p-0">
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {[1, 2, 3, 4].map((row) => (
                            <div key={row} className="flex items-center justify-between p-4">
                                <div className="space-y-1">
                                    <Skeleton className="h-4 w-28 bg-slate-200 dark:bg-slate-800" />
                                    <Skeleton className="h-3 w-40 bg-slate-100 dark:bg-slate-800" />
                                </div>
                                <div className="flex items-center gap-3">
                                    <Skeleton className="h-4 w-16 bg-slate-200 dark:bg-slate-800" />
                                    <Skeleton className="h-6 w-20 rounded-full bg-emerald-100 dark:bg-emerald-950" />
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
