import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function AdminCourtsLoading() {
    return (
        <div className="space-y-6 animate-in fade-in duration-200">
            {/* Header with status badges */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                    <Skeleton className="h-8 w-44 rounded-lg bg-slate-200 dark:bg-slate-800" />
                    <Skeleton className="h-4 w-72 max-w-full rounded-md bg-slate-100 dark:bg-slate-900" />
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <Skeleton className="h-6 w-24 rounded-full bg-emerald-100 dark:bg-emerald-950" />
                    <Skeleton className="h-6 w-28 rounded-full bg-amber-100 dark:bg-amber-950" />
                    <Skeleton className="h-6 w-24 rounded-full bg-slate-100 dark:bg-slate-800" />
                </div>
            </div>

            {/* Add Court Card Form */}
            <Card className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
                <CardHeader className="pb-3">
                    <Skeleton className="h-5 w-28 bg-slate-200 dark:bg-slate-800" />
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
                        <Skeleton className="h-10 rounded-md bg-slate-100 dark:bg-slate-800" />
                        <Skeleton className="h-10 rounded-md bg-slate-100 dark:bg-slate-800" />
                        <Skeleton className="h-10 rounded-md bg-slate-100 dark:bg-slate-800" />
                        <Skeleton className="h-10 rounded-md bg-slate-100 dark:bg-slate-800" />
                        <Skeleton className="h-10 rounded-md bg-blue-200 dark:bg-blue-900" />
                    </div>
                </CardContent>
            </Card>

            {/* Courts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                    <Card key={i} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
                        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
                            <Skeleton className="h-6 w-24 bg-slate-200 dark:bg-slate-800" />
                            <Skeleton className="h-5 w-20 rounded-full bg-emerald-100 dark:bg-emerald-950" />
                        </CardHeader>
                        <CardContent className="p-5 space-y-4">
                            <div className="space-y-1">
                                <Skeleton className="h-4 w-16 bg-slate-200 dark:bg-slate-800" />
                                <Skeleton className="h-7 w-24 bg-blue-100 dark:bg-blue-950 rounded-lg" />
                            </div>
                            <div className="space-y-1.5">
                                <Skeleton className="h-4 w-28 bg-slate-200 dark:bg-slate-800" />
                                <Skeleton className="h-10 w-full rounded-md bg-slate-100 dark:bg-slate-800" />
                            </div>
                            <div className="pt-2 flex items-center justify-between">
                                <Skeleton className="h-8 w-20 rounded-lg bg-slate-100 dark:bg-slate-800" />
                                <Skeleton className="h-8 w-24 rounded-lg bg-slate-100 dark:bg-slate-800" />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
