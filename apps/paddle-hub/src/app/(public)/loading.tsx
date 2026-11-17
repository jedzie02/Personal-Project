import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import HeroCourtRally from "@/components/booking/HeroCourtRally";
import { Skeleton } from "@/components/ui/skeleton";

export default function LandingLoading() {
    return (
        <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
            <Navbar />

            <main className="flex-1 flex flex-col">
                {/* Hero Section (Static presentation with no skeleton boxes over hero) */}
                <section className="relative flex flex-col items-center justify-center px-4 pt-16 pb-16 sm:px-6 lg:px-8 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(37,99,235,0.08),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(37,99,235,0.2),rgba(2,6,23,0))]">
                    <div className="max-w-6xl mx-auto w-full space-y-8 sm:space-y-10">
                        {/* 2-Column Desktop Grid / 1-Column Mobile Stack */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                            {/* Left Column: Headline, subtext, CTA buttons, and badges */}
                            <div className="lg:col-span-6 flex flex-col items-center lg:items-start text-center lg:text-left space-y-5">
                                {/* Live Status Badge */}
                                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-800/70 bg-emerald-950/50 px-3.5 py-1.5 shadow-xs text-xs font-semibold text-emerald-200">
                                    <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <span>Live Today · Open Daily 9:00 AM – 11:00 PM</span>
                                </div>

                                {/* Headline */}
                                <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-slate-900 dark:text-white leading-[1.12]">
                                    Dink. Rally.{" "}
                                    <span className="text-blue-600 dark:text-blue-400">Repeat.</span>
                                </h1>

                                {/* Subtitle */}
                                <p className="max-w-2xl text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                                    Reserve your court online and jump straight into the action.
                                </p>

                                {/* Action Buttons */}
                                <div className="flex flex-col sm:flex-row gap-3.5 justify-center lg:justify-start items-center pt-1 w-full sm:w-auto">
                                    <Link href="/book" className="w-full sm:w-auto">
                                        <Button className="w-full sm:w-auto text-base font-semibold px-8 py-6 rounded-full bg-blue-600 text-white shadow-sm hover:bg-blue-700 transition-all cursor-pointer">
                                            Book a Court
                                        </Button>
                                    </Link>
                                    <a href="#about" className="w-full sm:w-auto">
                                        <Button
                                            variant="outline"
                                            className="w-full sm:w-auto text-base font-semibold px-8 py-6 rounded-full border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-900 transition-all cursor-pointer"
                                        >
                                            Learn More
                                        </Button>
                                    </a>
                                </div>

                                {/* Feature Bullets */}
                                <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-4 sm:gap-6 text-xs text-slate-500 font-medium">
                                    <span className="flex items-center gap-1.5">
                                        <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        4 Master Courts
                                    </span>
                                    <span>•</span>
                                    <span>Instant GCash &amp; Card Checkout</span>
                                    <span>•</span>
                                    <span>Official Email Receipt</span>
                                </div>
                            </div>

                            {/* Right Column: Court Simulator Animation */}
                            <div className="lg:col-span-6 flex items-center justify-center w-full">
                                <HeroCourtRally className="lg:max-w-none" />
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
            </main>
        </div>
    );
}
