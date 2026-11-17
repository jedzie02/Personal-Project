import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function PaymentCancelledLoading() {
    return (
        <div className="min-h-[70vh] flex items-center justify-center px-4 py-12 bg-slate-950 animate-in fade-in duration-200">
            <Card className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-sm text-center space-y-4">
                <Skeleton className="size-12 rounded-full mx-auto bg-amber-950/60" />
                <Skeleton className="h-6 w-44 mx-auto rounded-lg bg-slate-800" />
                <Skeleton className="h-4 w-72 max-w-full mx-auto rounded-md bg-slate-800/60" />
                <div className="pt-4 flex flex-col sm:flex-row gap-2">
                    <Skeleton className="h-10 flex-1 rounded-xl bg-slate-800" />
                    <Skeleton className="h-10 flex-1 rounded-xl bg-blue-900/80" />
                </div>
            </Card>
        </div>
    );
}
