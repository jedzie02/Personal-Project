import { Skeleton } from "@/components/ui/skeleton";

export default function BookingsLoading() {
    return (
        <div className="mx-auto max-w-2xl px-4 py-10 space-y-6 animate-in fade-in duration-200">
            {/* Page Title & Subtitle */}
            <div className="space-y-2">
                <Skeleton className="h-8 w-44 rounded-lg bg-slate-200" />
                <Skeleton className="h-4 w-72 max-w-[80vw] rounded-md bg-slate-100" />
            </div>

            {/* Booking Cards Skeleton List */}
            <div className="space-y-3 pt-2">
                {[1, 2, 3].map((i) => (
                    <div
                        key={i}
                        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4"
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div className="space-y-1.5">
                                <div className="flex items-center gap-2">
                                    <Skeleton className="h-5 w-24 bg-slate-200 rounded-md" />
                                    <Skeleton className="h-5 w-20 rounded-full bg-emerald-100" />
                                </div>
                                <Skeleton className="h-4 w-48 bg-slate-100 rounded-md" />
                            </div>
                            <Skeleton className="h-6 w-16 bg-blue-100 rounded-md" />
                        </div>

                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                            <Skeleton className="h-4 w-32 bg-slate-100 rounded-md" />
                            <Skeleton className="h-8 w-20 rounded-lg bg-slate-100" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
