import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function PaymentCancelledLoading() {
    return (
        <div className="min-h-[70vh] flex items-center justify-center px-4 py-12 bg-slate-50/50 animate-in fade-in duration-200">
            <Card className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm text-center space-y-4">
                <Skeleton className="size-12 rounded-full mx-auto bg-amber-100" />
                <Skeleton className="h-6 w-44 mx-auto rounded-lg bg-slate-200" />
                <Skeleton className="h-4 w-72 max-w-full mx-auto rounded-md bg-slate-100" />
                <div className="pt-4 flex flex-col sm:flex-row gap-2">
                    <Skeleton className="h-10 flex-1 rounded-xl bg-slate-100" />
                    <Skeleton className="h-10 flex-1 rounded-xl bg-blue-200" />
                </div>
            </Card>
        </div>
    );
}
