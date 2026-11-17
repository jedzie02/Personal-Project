import { Navbar } from "@/components/Navbar";

export default function OpenPlayLoading() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
            <Navbar />

            <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
                {/* Header Skeleton without kicker */}
                <div className="text-center mb-8 sm:mb-10 space-y-3 flex flex-col items-center">
                    <div className="h-9 w-64 sm:w-80 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
                    <div className="h-4 w-72 sm:w-96 rounded-lg bg-slate-200 dark:bg-slate-800/60 animate-pulse" />
                </div>

                {/* 3-Step Explainer Skeleton */}
                <div className="mb-10 max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-200/80 dark:divide-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4 sm:p-5 shadow-2xs">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-start gap-3 p-2.5 sm:p-3 animate-pulse">
                            <div className="size-8 rounded-xl bg-slate-200 dark:bg-slate-800 shrink-0" />
                            <div className="space-y-1.5 flex-1">
                                <div className="h-3.5 w-24 rounded bg-slate-200 dark:bg-slate-800" />
                                <div className="h-3 w-36 rounded bg-slate-200 dark:bg-slate-800/60" />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Session Cards Skeleton - Vertical Wide Rows */}
                <div className="flex flex-col gap-4 max-w-4xl mx-auto">
                    {[1, 2, 3].map((i) => (
                        <div
                            key={i}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 sm:p-6 animate-pulse shadow-2xs"
                        >
                            <div className="space-y-2">
                                <div className="flex items-center gap-3">
                                    <div className="h-6 w-28 rounded-lg bg-slate-200 dark:bg-slate-800" />
                                    <div className="h-5 w-24 rounded-full bg-slate-200 dark:bg-slate-800" />
                                </div>
                                <div className="h-4 w-48 rounded bg-slate-200 dark:bg-slate-800/70" />
                            </div>
                            <div className="flex items-center justify-between sm:justify-end gap-5 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                                <div className="h-6 w-20 rounded bg-slate-200 dark:bg-slate-800" />
                                <div className="h-10 w-36 rounded-xl bg-slate-200 dark:bg-slate-800" />
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}
