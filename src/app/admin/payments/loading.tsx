import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function AdminPaymentsLoading() {
    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
            {/* Header with Title and Export Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                    <Skeleton className="h-8 w-52 rounded-lg bg-slate-200 dark:bg-slate-800" />
                    <Skeleton className="h-4 w-80 max-w-full rounded-md bg-slate-100 dark:bg-slate-900" />
                </div>
                <Skeleton className="h-9 w-28 rounded-lg bg-slate-100 dark:bg-slate-800" />
            </div>

            {/* 4 Financial KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    "Today's Revenue",
                    "Pending Balance",
                    "Refunds Processed",
                    "Settled Count",
                ].map((title, i) => (
                    <div
                        key={i}
                        className="flex flex-col justify-between p-5 min-h-[116px] rounded-xl border border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-800 shadow-xs space-y-3"
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                {title}
                            </span>
                            <Skeleton className="size-8 rounded-lg bg-slate-100 dark:bg-slate-800" />
                        </div>
                        <div className="space-y-1">
                            <Skeleton className="h-7 w-24 bg-slate-200 dark:bg-slate-800 rounded-md" />
                            <Skeleton className="h-3 w-32 bg-slate-100 dark:bg-slate-800 rounded" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Ledger Transactions Card */}
            <Card className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
                {/* Search & Filter Toolbar */}
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <Skeleton className="h-10 w-72 max-w-full rounded-xl bg-slate-100 dark:bg-slate-800" />
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-9 w-28 rounded-lg bg-slate-100 dark:bg-slate-800" />
                        <Skeleton className="h-9 w-24 rounded-lg bg-slate-100 dark:bg-slate-800" />
                    </div>
                </div>

                {/* Table Rows */}
                <CardContent className="p-0">
                    <div className="grid grid-cols-6 p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                        {["Booking ID", "Customer", "Court & Date", "Method", "Amount", "Status"].map((col, idx) => (
                            <span key={idx} className="text-xs font-semibold text-slate-400 uppercase">
                                {col}
                            </span>
                        ))}
                    </div>

                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {[1, 2, 3, 4, 5, 6].map((row) => (
                            <div key={row} className="grid grid-cols-6 p-4 items-center">
                                <Skeleton className="h-4 w-20 bg-slate-200 dark:bg-slate-800" />
                                <div className="space-y-1">
                                    <Skeleton className="h-4 w-28 bg-slate-200 dark:bg-slate-800" />
                                    <Skeleton className="h-3 w-36 bg-slate-100 dark:bg-slate-800" />
                                </div>
                                <div className="space-y-1">
                                    <Skeleton className="h-4 w-24 bg-slate-200 dark:bg-slate-800" />
                                    <Skeleton className="h-3 w-28 bg-slate-100 dark:bg-slate-800" />
                                </div>
                                <Skeleton className="h-4 w-16 bg-slate-200 dark:bg-slate-800" />
                                <Skeleton className="h-5 w-16 bg-slate-200 dark:bg-slate-800 font-bold" />
                                <Skeleton className="h-6 w-20 rounded-full bg-emerald-100 dark:bg-emerald-950" />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
