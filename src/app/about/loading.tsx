import { Skeleton } from "@/components/ui/skeleton";

export default function AboutLoading() {
    return (
        <div className="flex min-h-screen flex-col bg-white animate-in fade-in duration-200">
            {/* Header Skeleton */}
            <header className="grid grid-cols-3 items-center px-6 py-4 bg-white border-b border-gray-200">
                <div className="flex items-center gap-2">
                    <Skeleton className="size-10 rounded-xl bg-slate-200" />
                    <Skeleton className="h-6 w-24 bg-slate-200" />
                </div>
                <div className="flex justify-center gap-8">
                    <Skeleton className="h-4 w-14 bg-slate-200" />
                    <Skeleton className="h-4 w-14 bg-slate-200" />
                </div>
                <div className="flex justify-end gap-3">
                    <Skeleton className="h-9 w-20 rounded-full bg-slate-100" />
                    <Skeleton className="h-9 w-24 rounded-full bg-blue-200" />
                </div>
            </header>

            <main className="flex-1">
                {/* Hero Section */}
                <section className="py-20 px-4 sm:px-6 lg:px-8 text-center bg-gradient-to-b from-blue-50/60 to-white">
                    <div className="max-w-3xl mx-auto space-y-4">
                        <Skeleton className="h-4 w-36 mx-auto rounded-full bg-blue-100" />
                        <Skeleton className="h-12 w-3/4 mx-auto rounded-xl bg-slate-200" />
                        <Skeleton className="h-5 w-2/3 mx-auto rounded-lg bg-slate-100" />
                    </div>
                </section>

                {/* 4 Feature Section Cards */}
                <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {[1, 2, 3, 4].map((i) => (
                            <div
                                key={i}
                                className="rounded-2xl border border-gray-100 p-8 bg-white shadow-sm space-y-4"
                            >
                                <div className="flex items-center gap-4">
                                    <Skeleton className="size-12 rounded-2xl bg-blue-50" />
                                    <Skeleton className="h-6 w-36 bg-slate-200 rounded-lg" />
                                </div>
                                <div className="space-y-2 pt-2">
                                    <Skeleton className="h-4 w-full bg-slate-100 rounded" />
                                    <Skeleton className="h-4 w-5/6 bg-slate-100 rounded" />
                                    <Skeleton className="h-4 w-4/6 bg-slate-100 rounded" />
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Bottom CTA Banner */}
                <section className="py-16 px-4 bg-slate-50 border-t border-gray-100 text-center">
                    <div className="max-w-xl mx-auto space-y-4">
                        <Skeleton className="h-8 w-64 mx-auto rounded-xl bg-slate-200" />
                        <Skeleton className="h-4 w-80 max-w-full mx-auto rounded-md bg-slate-100" />
                        <Skeleton className="h-12 w-44 mx-auto rounded-full bg-blue-200" />
                    </div>
                </section>
            </main>
        </div>
    );
}
