import { Navbar } from "@/components/Navbar";

export default function OpenPlayLoading() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
            <Navbar />

            <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
                {/* Header Skeleton */}
                <div className="text-center mb-10 space-y-3 flex flex-col items-center">
                    <div className="h-6 w-36 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse" />
                    <div className="h-8 w-72 sm:w-96 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
                    <div className="h-4 w-60 sm:w-80 rounded-lg bg-slate-200 dark:bg-slate-800/60 animate-pulse" />
                </div>

                {/* Session Cards Skeleton */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                        <div
                            key={i}
                            className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 space-y-4 animate-pulse shadow-2xs"
                        >
                            <div className="flex items-center justify-between">
                                <div className="h-5 w-24 rounded-lg bg-slate-200 dark:bg-slate-800" />
                                <div className="h-5 w-16 rounded-full bg-slate-200 dark:bg-slate-800" />
                            </div>
                            <div className="space-y-2 py-2">
                                <div className="h-4 w-32 rounded bg-slate-200 dark:bg-slate-800" />
                                <div className="h-4 w-28 rounded bg-slate-200 dark:bg-slate-800" />
                            </div>
                            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                                <div className="h-5 w-20 rounded bg-slate-200 dark:bg-slate-800" />
                                <div className="h-8 w-24 rounded-xl bg-slate-200 dark:bg-slate-800" />
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}
