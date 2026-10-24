import { Skeleton } from "@/components/ui/skeleton";
import { BookingGridSkeleton } from "@/components/booking/BookingGridSkeleton";

export default function RootLoading() {
    return (
        <div className="flex min-h-screen flex-col bg-white">
            {/* Top Navigation Skeleton */}
            <header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/80 backdrop-blur-md">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-3">
                        <Skeleton className="size-9 rounded-xl bg-blue-100" />
                        <Skeleton className="h-6 w-24 bg-slate-200" />
                    </div>
                    <div className="hidden md:flex items-center gap-6">
                        <Skeleton className="h-4 w-16 bg-slate-200" />
                        <Skeleton className="h-4 w-24 bg-slate-200" />
                        <Skeleton className="h-4 w-20 bg-slate-200" />
                    </div>
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-9 w-20 rounded-full bg-slate-100" />
                        <Skeleton className="h-9 w-24 rounded-full bg-blue-200" />
                    </div>
                </div>
            </header>

            <main className="flex-1">
                {/* Hero Section Skeleton */}
                <section className="relative overflow-hidden py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-blue-50/50 via-white to-slate-50/50">
                    <div className="mx-auto max-w-4xl text-center space-y-4">
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-blue-100 bg-blue-50/80 mx-auto">
                            <Skeleton className="size-2 rounded-full bg-blue-500" />
                            <Skeleton className="h-3.5 w-32 bg-blue-200" />
                        </div>
                        <Skeleton className="h-12 sm:h-14 w-3/4 max-w-xl mx-auto rounded-2xl bg-slate-200" />
                        <Skeleton className="h-5 w-2/3 max-w-md mx-auto rounded-lg bg-slate-100" />
                    </div>
                </section>

                {/* Court Booking Section Skeleton */}
                <section className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-50/50 border-t border-gray-100">
                    <div className="mx-auto max-w-6xl space-y-6">
                        {/* Section Header */}
                        <div className="text-center space-y-2">
                            <Skeleton className="h-9 w-52 mx-auto rounded-xl bg-slate-200" />
                            <Skeleton className="h-4 w-80 max-w-full mx-auto rounded-md bg-slate-100" />
                        </div>

                        {/* Court Status Overview Pills */}
                        <div className="flex flex-wrap items-center justify-center gap-2.5 pb-2">
                            {[1, 2, 3, 4].map((i) => (
                                <Skeleton
                                    key={i}
                                    className="h-8 w-36 rounded-full bg-slate-200"
                                />
                            ))}
                        </div>

                        {/* Date Selector Skeleton */}
                        <div className="flex w-full items-stretch gap-2 rounded-2xl border border-gray-200 bg-white p-3 shadow-xs">
                            <div className="grid flex-1 grid-cols-7 gap-2">
                                {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                                    <div
                                        key={i}
                                        className="flex flex-col items-center justify-center rounded-xl p-3 border border-gray-100 bg-gray-50/60 gap-1.5"
                                    >
                                        <Skeleton className="h-3 w-8 bg-slate-200" />
                                        <Skeleton className="h-6 w-7 bg-slate-300" />
                                        <Skeleton className="h-3 w-6 bg-slate-200" />
                                    </div>
                                ))}
                            </div>
                            <Skeleton className="w-24 shrink-0 rounded-xl bg-slate-100 border border-gray-200" />
                        </div>

                        {/* Booking Grid Skeleton */}
                        <BookingGridSkeleton />
                    </div>
                </section>
            </main>
        </div>
    );
}
