import { Skeleton } from "@/components/ui/skeleton";
import { BookingGridSkeleton } from "@/components/booking/BookingGridSkeleton";
import { Navbar } from "@/components/Navbar";

export default function BookLoading() {
    return (
        <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
            <Navbar />

            <main className="flex-1 flex flex-col">
                {/* 3-Step Guide Skeleton */}
                <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 border-b border-slate-800 bg-slate-900/40">
                    <div className="mx-auto max-w-4xl text-center space-y-3">
                        <Skeleton className="h-8 w-72 mx-auto rounded-xl bg-slate-800" />
                        <Skeleton className="h-4 w-96 max-w-full mx-auto rounded-md bg-slate-800/60" />

                        <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-6">
                            {[1, 2, 3].map((step) => (
                                <div key={step} className="flex flex-col items-center gap-2.5">
                                    <Skeleton className="size-12 rounded-full bg-slate-800" />
                                    <Skeleton className="h-4 w-32 bg-slate-800" />
                                    <Skeleton className="h-3 w-48 bg-slate-800/60" />
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Court Booking Section Skeleton */}
                <section className="py-12 sm:py-14 px-4 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-6xl space-y-6">
                        {/* Section Header */}
                        <div className="text-center space-y-2">
                            <Skeleton className="h-8 w-64 mx-auto rounded-xl bg-slate-800" />
                            <Skeleton className="h-4 w-80 max-w-full mx-auto rounded-md bg-slate-800/60" />
                        </div>

                        {/* Court Status Overview Pills */}
                        <div className="flex flex-wrap items-center justify-center gap-2.5 pb-2">
                            {[1, 2, 3, 4].map((i) => (
                                <Skeleton
                                    key={i}
                                    className="h-8 w-36 rounded-full bg-slate-800"
                                />
                            ))}
                        </div>

                        {/* Date Selector Skeleton */}
                        <div className="flex w-full items-stretch gap-2 rounded-2xl border border-slate-800 bg-slate-900 p-3 shadow-xs">
                            <div className="grid flex-1 grid-cols-7 gap-2">
                                {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                                    <div
                                        key={i}
                                        className="flex flex-col items-center justify-center rounded-xl p-3 border border-slate-800 bg-slate-950/60 gap-1.5"
                                    >
                                        <Skeleton className="h-3 w-8 bg-slate-800" />
                                        <Skeleton className="h-6 w-7 bg-slate-700" />
                                        <Skeleton className="h-3 w-6 bg-slate-800" />
                                    </div>
                                ))}
                            </div>
                            <Skeleton className="w-24 shrink-0 rounded-xl bg-slate-800 border border-slate-700" />
                        </div>

                        {/* Booking Grid Skeleton */}
                        <BookingGridSkeleton />
                    </div>
                </section>
            </main>
        </div>
    );
}
