import { Skeleton } from "@/components/ui/skeleton";

export default function BookReviewLoading() {
    return (
        <div className="mx-auto max-w-md px-4 py-10 space-y-6 animate-in fade-in duration-200">
            {/* Title */}
            <div className="space-y-1.5">
                <Skeleton className="h-8 w-56 rounded-lg bg-slate-200" />
                <Skeleton className="h-4 w-72 max-w-full rounded-md bg-slate-100" />
            </div>

            {/* Summary Details Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
                <Skeleton className="h-5 w-32 bg-slate-200 rounded" />

                <div className="divide-y divide-slate-100 space-y-3 pt-1">
                    {[
                        { label: "Court", valWidth: "w-24" },
                        { label: "Date", valWidth: "w-28" },
                        { label: "Time Slot", valWidth: "w-32" },
                        { label: "Duration", valWidth: "w-16" },
                        { label: "Rate", valWidth: "w-20" },
                    ].map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center pt-3">
                            <span className="text-xs text-slate-400 font-medium">{item.label}</span>
                            <Skeleton className={`h-4 ${item.valWidth} bg-slate-200 rounded`} />
                        </div>
                    ))}
                </div>

                <div className="pt-4 border-t border-slate-200 flex justify-between items-center">
                    <span className="text-sm font-semibold text-slate-700">Total Price</span>
                    <Skeleton className="h-7 w-24 bg-blue-200 rounded-lg" />
                </div>
            </div>

            {/* Action Button */}
            <Skeleton className="h-12 w-full rounded-full bg-blue-600/30" />
        </div>
    );
}
