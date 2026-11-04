import { Skeleton } from "@/components/ui/skeleton";
import { BookingGridSkeleton } from "@/components/booking/BookingGridSkeleton";

export default function LandingLoading() {
    return (
        <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
            {/* Top Navigation Skeleton */}
            <header className="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-3">
                        <Skeleton className="size-9 rounded-xl bg-blue-900/60" />
                        <Skeleton className="h-6 w-24 bg-slate-800" />
                    </div>
                    <div className="hidden md:flex items-center gap-6">
                        <Skeleton className="h-4 w-16 bg-slate-800" />
                        <Skeleton className="h-4 w-24 bg-slate-800" />
                        <Skeleton className="h-4 w-20 bg-slate-800" />
                    </div>
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-9 w-20 rounded-full bg-slate-800" />
                        <Skeleton className="h-9 w-24 rounded-full bg-blue-900/80" />
                    </div>
                </div>
            </header>

            <main className="flex-1 flex flex-col">
                {/* Hero Section Skeleton (Split 2-Column Desktop Grid) */}
                <section className="relative flex flex-col items-center justify-center px-4 pt-16 pb-16 sm:px-6 lg:px-8 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(37,99,235,0.08),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(37,99,235,0.2),rgba(2,6,23,0))]">
                    <div className="max-w-6xl mx-auto w-full space-y-8 sm:space-y-10">
                        {/* 2-Column Desktop Grid / 1-Column Mobile Stack */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                            {/* Left Column: Headline, subtext, CTA buttons, and badges */}
                            <div className="lg:col-span-6 flex flex-col items-center lg:items-start text-center lg:text-left space-y-5">
                                {/* Live Status Badge Skeleton */}
                                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-800/70 bg-emerald-950/50 px-3.5 py-1.5 shadow-xs">
                                    <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <Skeleton className="h-3.5 w-56 bg-emerald-900/60" />
                                </div>

                                {/* Headline Skeleton */}
                                <div className="space-y-2.5 w-full max-w-lg mx-auto lg:mx-0">
                                    <Skeleton className="h-10 sm:h-12 w-full rounded-2xl bg-slate-800" />
                                    <Skeleton className="h-10 sm:h-12 w-4/5 rounded-2xl bg-slate-800" />
                                </div>

                                {/* Subtitle Skeleton */}
                                <div className="space-y-1.5 w-full max-w-md mx-auto lg:mx-0">
                                    <Skeleton className="h-4 w-full rounded-md bg-slate-800/70" />
                                    <Skeleton className="h-4 w-5/6 rounded-md bg-slate-800/70" />
                                </div>

                                {/* Dual Action Buttons Skeleton */}
                                <div className="flex flex-col sm:flex-row gap-3.5 justify-center lg:justify-start items-center pt-1 w-full sm:w-auto">
                                    <Skeleton className="h-12 w-full sm:w-36 rounded-full bg-blue-600/80" />
                                    <Skeleton className="h-12 w-full sm:w-36 rounded-full bg-slate-800 border border-slate-700" />
                                </div>

                                {/* Feature Bullets Skeleton */}
                                <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-4 sm:gap-6 text-xs text-slate-500">
                                    <div className="flex items-center gap-1.5">
                                        <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        <Skeleton className="h-3 w-24 bg-slate-800" />
                                    </div>
                                    <span>•</span>
                                    <Skeleton className="h-3 w-36 bg-slate-800" />
                                    <span>•</span>
                                    <Skeleton className="h-3 w-32 bg-slate-800" />
                                </div>
                            </div>

                            {/* Right Column: Live Court Simulator Card Skeleton */}
                            <div className="lg:col-span-6 flex items-center justify-center w-full">
                                <div className="mx-auto w-full max-w-lg lg:max-w-xl rounded-3xl border border-slate-800 bg-slate-900/90 p-5 sm:p-6 lg:p-7 shadow-xl ring-1 ring-white/10">
                                    {/* Card Header */}
                                    <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-slate-800 text-xs">
                                        <div className="flex items-center gap-2">
                                            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                                            <Skeleton className="h-3.5 w-32 bg-slate-800" />
                                        </div>
                                        <Skeleton className="h-5 w-24 rounded-full bg-blue-950/60 border border-blue-900/60" />
                                    </div>

                                    {/* Static SVG Court Wireframe */}
                                    <svg
                                        viewBox="0 0 260 144"
                                        aria-hidden="true"
                                        className="w-full max-w-[360px] sm:max-w-[440px] lg:max-w-[490px] h-auto mx-auto rounded-2xl border-2 border-blue-500/40 bg-blue-950 shadow-md"
                                    >
                                        <rect
                                            x="14"
                                            y="14"
                                            width="232"
                                            height="116"
                                            rx="5"
                                            fill="#1e3a8a"
                                            stroke="#60a5fa"
                                            strokeWidth="2"
                                            opacity="0.4"
                                        />
                                        <rect
                                            x="96"
                                            y="14"
                                            width="68"
                                            height="116"
                                            fill="#172554"
                                            stroke="#60a5fa"
                                            strokeWidth="1.5"
                                            opacity="0.4"
                                        />
                                        <line
                                            x1="14"
                                            y1="72"
                                            x2="96"
                                            y2="72"
                                            stroke="#60a5fa"
                                            strokeWidth="1.5"
                                            opacity="0.4"
                                        />
                                        <line
                                            x1="164"
                                            y1="72"
                                            x2="246"
                                            y2="72"
                                            stroke="#60a5fa"
                                            strokeWidth="1.5"
                                            opacity="0.4"
                                        />
                                        <line
                                            x1="130"
                                            y1="6"
                                            x2="130"
                                            y2="138"
                                            stroke="#ffffff"
                                            strokeWidth="2.5"
                                            strokeDasharray="4 2"
                                            opacity="0.5"
                                        />
                                    </svg>

                                    {/* Card Footer */}
                                    <div className="mt-4 flex items-center justify-center gap-2 text-center text-xs sm:text-sm">
                                        <span className="size-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                                        <Skeleton className="h-3 w-64 bg-slate-800" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Full-width Quick Slots Skeleton */}
                        <div className="w-full pt-1">
                            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3 shadow-xs">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Skeleton className="size-4 rounded-full bg-amber-500/80" />
                                        <Skeleton className="h-4 w-40 bg-slate-800" />
                                    </div>
                                    <Skeleton className="h-3.5 w-24 bg-slate-800" />
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    {[1, 2, 3, 4].map((i) => (
                                        <div
                                            key={i}
                                            className="flex flex-col gap-1.5 p-3 rounded-xl border border-slate-800 bg-slate-950/60"
                                        >
                                            <Skeleton className="h-4 w-20 bg-slate-800" />
                                            <Skeleton className="h-3 w-16 bg-slate-800/70" />
                                            <Skeleton className="h-3 w-12 bg-blue-900/60 mt-1" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Court Booking Section Skeleton */}
                <section className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-950 border-t border-slate-800">
                    <div className="mx-auto max-w-6xl space-y-6">
                        {/* Section Header */}
                        <div className="text-center space-y-2">
                            <Skeleton className="h-9 w-52 mx-auto rounded-xl bg-slate-800" />
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
