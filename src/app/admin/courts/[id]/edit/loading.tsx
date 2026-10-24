import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function EditCourtLoading() {
    return (
        <div className="max-w-xl space-y-6 animate-in fade-in duration-200">
            {/* Back link & Title */}
            <div className="space-y-2">
                <Skeleton className="h-4 w-28 bg-slate-200 dark:bg-slate-800" />
                <Skeleton className="h-8 w-52 rounded-lg bg-slate-200 dark:bg-slate-800" />
                <Skeleton className="h-4 w-72 max-w-full rounded-md bg-slate-100 dark:bg-slate-900" />
            </div>

            {/* Edit Form Card */}
            <Card className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
                <CardHeader>
                    <Skeleton className="h-5 w-32 bg-slate-200 dark:bg-slate-800" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-1.5">
                        <Skeleton className="h-4 w-24 bg-slate-200 dark:bg-slate-800" />
                        <Skeleton className="h-10 w-full rounded-md bg-slate-100 dark:bg-slate-800" />
                    </div>
                    <div className="space-y-1.5">
                        <Skeleton className="h-4 w-28 bg-slate-200 dark:bg-slate-800" />
                        <Skeleton className="h-20 w-full rounded-md bg-slate-100 dark:bg-slate-800" />
                    </div>
                    <div className="space-y-1.5">
                        <Skeleton className="h-4 w-32 bg-slate-200 dark:bg-slate-800" />
                        <Skeleton className="h-10 w-full rounded-md bg-slate-100 dark:bg-slate-800" />
                    </div>
                    <div className="pt-4 flex justify-end gap-3">
                        <Skeleton className="h-10 w-24 rounded-lg bg-slate-100 dark:bg-slate-800" />
                        <Skeleton className="h-10 w-32 rounded-lg bg-blue-200 dark:bg-blue-900" />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
