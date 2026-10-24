import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function ConfirmBookingSkeleton() {
    return (
        <div className="w-full max-w-lg animate-pulse">
            <div className="h-4 w-28 bg-slate-200 rounded mb-4" />
            <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <CardHeader className="p-6 text-center border-b border-slate-100 bg-slate-50/50 flex flex-col items-center">
                    <Skeleton className="size-12 rounded-full mb-2 bg-slate-200" />
                    <Skeleton className="h-6 w-48 mb-2 bg-slate-200" />
                    <Skeleton className="h-3 w-64 bg-slate-200" />
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                    <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4 space-y-3">
                        <div className="flex justify-between items-center">
                            <Skeleton className="h-4 w-24 bg-slate-200" />
                            <Skeleton className="h-4 w-28 bg-slate-200" />
                        </div>
                        <div className="flex justify-between items-center">
                            <Skeleton className="h-4 w-28 bg-slate-200" />
                            <Skeleton className="h-4 w-36 bg-slate-200" />
                        </div>
                        <div className="flex justify-between items-center">
                            <Skeleton className="h-4 w-32 bg-slate-200" />
                            <Skeleton className="h-6 w-24 rounded-full bg-slate-200" />
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                            <Skeleton className="h-4 w-20 bg-slate-200" />
                            <Skeleton className="h-5 w-16 bg-slate-200" />
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="p-6 pt-0 flex flex-col gap-2.5">
                    <Skeleton className="h-12 w-full rounded-xl bg-slate-200" />
                    <Skeleton className="h-8 w-20 mx-auto bg-slate-200" />
                </CardFooter>
            </Card>
        </div>
    );
}
