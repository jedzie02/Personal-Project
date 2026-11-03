import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function AdminSettingsLoading() {
    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
            {/* Header */}
            <div className="space-y-1">
                <Skeleton className="h-8 w-44 rounded-lg bg-slate-200 dark:bg-slate-800" />
                <Skeleton className="h-4 w-72 max-w-full rounded-md bg-slate-100 dark:bg-slate-900" />
            </div>

            {/* Settings Form Card */}
            <Card className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
                <CardHeader className="p-6 border-b border-slate-100 dark:border-slate-800">
                    <Skeleton className="h-6 w-52 rounded-md bg-slate-200 dark:bg-slate-800" />
                    <Skeleton className="h-4 w-96 max-w-full rounded bg-slate-100 dark:bg-slate-900 mt-2" />
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-28 bg-slate-200 dark:bg-slate-800" />
                                <Skeleton className="h-10 w-full rounded-xl bg-slate-100 dark:bg-slate-900" />
                            </div>
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-28 bg-slate-200 dark:bg-slate-800" />
                                <Skeleton className="h-10 w-full rounded-xl bg-slate-100 dark:bg-slate-900" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-32 bg-slate-200 dark:bg-slate-800" />
                            <Skeleton className="h-56 w-full rounded-xl bg-slate-100 dark:bg-slate-900" />
                        </div>
                    </div>
                    <Skeleton className="h-11 w-36 rounded-xl bg-slate-200 dark:bg-slate-800" />
                </CardContent>
            </Card>
        </div>
    );
}

