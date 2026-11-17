import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function DashboardLoading() {
    return (
        <div className="space-y-6 animate-in fade-in duration-200">
            {/* Header */}
            <div>
                <Skeleton className="h-8 w-56 rounded-lg bg-slate-200 dark:bg-slate-800" />
                <Skeleton className="h-4 w-80 max-w-full mt-1 rounded-md bg-slate-100 dark:bg-slate-900" />
            </div>

            {/* 4 KPI Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "Today's Bookings", val: "12" },
                    { label: "Today's Revenue", val: "₱3,500" },
                    { label: "Uncollected (Desk)", val: "₱500" },
                    { label: "Active Courts", val: "4 / 4" },
                ].map((stat, idx) => (
                    <Card key={idx} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                {stat.label}
                            </span>
                            <Skeleton className="size-8 rounded-lg bg-slate-100 dark:bg-slate-800" />
                        </CardHeader>
                        <CardContent className="space-y-1.5">
                            <Skeleton className="h-7 w-24 bg-slate-200 dark:bg-slate-800 rounded-md" />
                            <Skeleton className="h-3.5 w-36 bg-slate-100 dark:bg-slate-800 rounded" />
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* 2-Column Split: Today's Bookings (2/3) + System Alerts (1/3) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Bookings Table Card */}
                <Card className="lg:col-span-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
                    <CardHeader className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
                        <div className="space-y-1">
                            <Skeleton className="h-5 w-40 bg-slate-200 dark:bg-slate-800" />
                            <Skeleton className="h-3.5 w-56 bg-slate-100 dark:bg-slate-800" />
                        </div>
                        <Skeleton className="h-8 w-24 rounded-lg bg-slate-100 dark:bg-slate-800" />
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                            {[1, 2, 3, 4, 5].map((row) => (
                                <div key={row} className="flex items-center justify-between p-4">
                                    <div className="flex items-center gap-3">
                                        <Skeleton className="size-9 rounded-lg bg-slate-100 dark:bg-slate-800" />
                                        <div className="space-y-1">
                                            <Skeleton className="h-4 w-32 bg-slate-200 dark:bg-slate-800" />
                                            <Skeleton className="h-3 w-24 bg-slate-100 dark:bg-slate-800" />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Skeleton className="h-6 w-20 rounded-full bg-emerald-100 dark:bg-emerald-950" />
                                        <Skeleton className="h-4 w-14 bg-slate-200 dark:bg-slate-800" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* System Alerts Card */}
                <Card className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
                    <CardHeader className="p-5 border-b border-slate-100 dark:border-slate-800">
                        <Skeleton className="h-5 w-32 bg-slate-200 dark:bg-slate-800" />
                    </CardHeader>
                    <CardContent className="p-4 space-y-3">
                        {[1, 2, 3].map((alert) => (
                            <div key={alert} className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-2">
                                <div className="flex items-center gap-2">
                                    <Skeleton className="size-4 rounded-full bg-slate-200 dark:bg-slate-800" />
                                    <Skeleton className="h-4 w-28 bg-slate-200 dark:bg-slate-800" />
                                </div>
                                <Skeleton className="h-3 w-full bg-slate-100 dark:bg-slate-800" />
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
