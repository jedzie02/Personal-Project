import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function SignupLoading() {
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

            {/* Signup Card */}
            <Card className="w-full max-w-sm shadow-lg border">
                <CardHeader className="text-center pb-4 space-y-2">
                    <Skeleton className="h-7 w-48 mx-auto rounded-lg bg-slate-200" />
                    <Skeleton className="h-4 w-60 mx-auto rounded-md bg-slate-100" />
                </CardHeader>
                <CardContent className="space-y-3.5">
                    {[
                        { label: "Full Name", w: "w-20" },
                        { label: "Email", w: "w-12" },
                        { label: "Phone", w: "w-24" },
                        { label: "Password", w: "w-16" },
                    ].map((field, i) => (
                        <div key={i} className="space-y-1">
                            <Skeleton className={`h-3.5 ${field.w} bg-slate-200`} />
                            <Skeleton className="h-9 w-full rounded-md bg-slate-100" />
                        </div>
                    ))}
                    <Skeleton className="h-10 w-full rounded-md bg-blue-200 mt-2" />
                    <Skeleton className="h-4 w-44 mx-auto rounded bg-slate-100" />
                </CardContent>
            </Card>

            <Skeleton className="h-4 w-32 mt-6 rounded bg-slate-100" />
        </div>
    );
}
