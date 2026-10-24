import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function ConfirmationLoading() {
    return (
        <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-slate-50/50 animate-in fade-in duration-200">
            <Card className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                {/* Top Celebration Banner */}
                <div className="p-6 text-center border-b border-slate-100 bg-emerald-50/40 space-y-3">
                    <Skeleton className="size-14 rounded-full mx-auto bg-emerald-200" />
                    <Skeleton className="h-6 w-48 mx-auto rounded-lg bg-emerald-300" />
                    <Skeleton className="h-4 w-72 max-w-[80vw] mx-auto rounded-md bg-emerald-100" />
                </div>

                {/* Match Details List */}
                <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <Skeleton className="h-4 w-28 bg-slate-200" />
                        <Skeleton className="h-4 w-32 bg-slate-300" />
                    </div>

                    <div className="space-y-3">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Skeleton className="size-4 rounded-full bg-slate-200" />
                                    <Skeleton className="h-4 w-20 bg-slate-200" />
                                </div>
                                <Skeleton className="h-4 w-28 bg-slate-200" />
                            </div>
                        ))}
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                        <Skeleton className="h-5 w-24 bg-slate-300" />
                        <Skeleton className="h-6 w-20 bg-blue-200" />
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="p-6 bg-slate-50/70 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
                    <Skeleton className="h-11 flex-1 rounded-xl bg-slate-200" />
                    <Skeleton className="h-11 flex-1 rounded-xl bg-blue-300" />
                </div>
            </Card>
        </div>
    );
}
