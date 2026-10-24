import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function AdminScheduleLoading() {
    return (
        <div className="space-y-6 animate-in fade-in duration-200">
            {/* Header with Title and Date Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <Skeleton className="h-8 w-48 rounded-lg bg-slate-200 dark:bg-slate-800" />
                    <Skeleton className="h-4 w-72 max-w-full mt-1 rounded-md bg-slate-100 dark:bg-slate-900" />
                </div>
                {/* Date Navigation buttons */}
                <div className="flex items-center gap-2">
                    <Skeleton className="h-9 w-9 rounded-lg bg-slate-100 dark:bg-slate-800" />
                    <Skeleton className="h-9 w-32 rounded-lg bg-slate-100 dark:bg-slate-800" />
                    <Skeleton className="h-9 w-9 rounded-lg bg-slate-100 dark:bg-slate-800" />
                    <Skeleton className="h-9 w-20 rounded-lg bg-blue-100 dark:bg-blue-950" />
                </div>
            </div>

            {/* Schedule Timeline Grid Card */}
            <Card className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
                <CardHeader className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="grid grid-cols-[80px_repeat(4,1fr)] items-center">
                        <span className="text-xs font-semibold text-slate-400 uppercase text-center">
                            Time
                        </span>
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="text-center">
                                <Skeleton className="h-4 w-20 mx-auto bg-slate-200 dark:bg-slate-800" />
                            </div>
                        ))}
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {[
                            "09:00",
                            "10:00",
                            "11:00",
                            "12:00",
                            "13:00",
                            "14:00",
                            "15:00",
                            "16:00",
                            "17:00",
                            "18:00",
                        ].map((hour, idx) => (
                            <div
                                key={idx}
                                className="grid grid-cols-[80px_repeat(4,1fr)] min-h-[56px] items-stretch"
                            >
                                <div className="border-r border-slate-100 dark:border-slate-800 flex items-center justify-center p-2 text-xs text-slate-400 font-mono">
                                    {hour}
                                </div>
                                {[1, 2, 3, 4].map((c) => (
                                    <div
                                        key={c}
                                        className="border-r last:border-r-0 border-slate-100 dark:border-slate-800 p-1.5 flex items-center"
                                    >
                                        {(idx + c) % 3 === 0 ? (
                                            <Skeleton className="w-full h-10 rounded-lg bg-blue-100/70 dark:bg-blue-950/60" />
                                        ) : (idx + c) % 5 === 0 ? (
                                            <Skeleton className="w-full h-10 rounded-lg bg-slate-100 dark:bg-slate-800" />
                                        ) : null}
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
