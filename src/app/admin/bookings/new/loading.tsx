import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function NewBookingLoading() {
    return (
        <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-200">
            {/* Header */}
            <div>
                <Skeleton className="h-8 w-52 rounded-lg bg-slate-200 dark:bg-slate-800" />
                <Skeleton className="h-4 w-72 max-w-full mt-1 rounded-md bg-slate-100 dark:bg-slate-900" />
            </div>

            {/* Form Card */}
            <Card className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
                <CardHeader className="pb-4">
                    <Skeleton className="h-5 w-36 bg-slate-200 dark:bg-slate-800" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-1.5">
                        <Skeleton className="h-4 w-24 bg-slate-200 dark:bg-slate-800" />
                        <Skeleton className="h-10 w-full rounded-md bg-slate-100 dark:bg-slate-800" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Skeleton className="h-4 w-20 bg-slate-200 dark:bg-slate-800" />
                            <Skeleton className="h-10 w-full rounded-md bg-slate-100 dark:bg-slate-800" />
                        </div>
                        <div className="space-y-1.5">
                            <Skeleton className="h-4 w-20 bg-slate-200 dark:bg-slate-800" />
                            <Skeleton className="h-10 w-full rounded-md bg-slate-100 dark:bg-slate-800" />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Skeleton className="h-4 w-28 bg-slate-200 dark:bg-slate-800" />
                        <Skeleton className="h-10 w-full rounded-md bg-slate-100 dark:bg-slate-800" />
                    </div>

                    <div className="space-y-2 pt-2">
                        <Skeleton className="h-4 w-32 bg-slate-200 dark:bg-slate-800" />
                        <div className="grid grid-cols-2 gap-3">
                            <Skeleton className="h-14 rounded-xl bg-slate-100 dark:bg-slate-800" />
                            <Skeleton className="h-14 rounded-xl bg-slate-100 dark:bg-slate-800" />
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <Skeleton className="h-10 w-24 rounded-lg bg-slate-100 dark:bg-slate-800" />
                        <Skeleton className="h-10 w-36 rounded-lg bg-blue-200 dark:bg-blue-900" />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
