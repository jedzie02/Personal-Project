import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function LoginLoading() {
    return (
        <div className="relative min-h-screen flex flex-col items-center justify-center px-4 bg-background animate-in fade-in duration-200">
            {/* Top Back Link */}
            <div className="absolute top-5 left-6">
                <Skeleton className="h-4 w-16 bg-slate-200" />
            </div>

            {/* Logo */}
            <div className="flex items-center gap-2 mb-8">
                <Skeleton className="size-10 rounded-xl bg-blue-100" />
                <Skeleton className="h-6 w-24 bg-slate-200" />
            </div>

            {/* Login Card */}
            <Card className="w-full max-w-sm shadow-lg border">
                <CardHeader className="text-center pb-4 space-y-2">
                    <Skeleton className="h-7 w-40 mx-auto rounded-lg bg-slate-200" />
                    <Skeleton className="h-4 w-60 mx-auto rounded-md bg-slate-100" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-1.5">
                        <Skeleton className="h-4 w-12 bg-slate-200" />
                        <Skeleton className="h-10 w-full rounded-md bg-slate-100" />
                    </div>
                    <div className="space-y-1.5">
                        <Skeleton className="h-4 w-16 bg-slate-200" />
                        <Skeleton className="h-10 w-full rounded-md bg-slate-100" />
                    </div>
                    <Skeleton className="h-10 w-full rounded-md bg-blue-200" />
                    <Skeleton className="h-4 w-44 mx-auto rounded bg-slate-100" />
                </CardContent>
            </Card>

            <Skeleton className="h-4 w-32 mt-6 rounded bg-slate-100" />
        </div>
    );
}
