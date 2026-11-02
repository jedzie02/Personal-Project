import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CircleDotDashed, Zap, Users, Trophy, CalendarCheck } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import DateSelector from "@/components/booking/DateSelector";
import BookingGrid from "@/components/booking/BookingGrid";
import { getBookingGridForDate } from "@/lib/services/booking-grid.service";
import { createClient } from "@/lib/supabase/server";
import { getManilaNow } from "@/lib/utils/date";

export const dynamic = "force-dynamic";

type PageProps = {
    searchParams?: Promise<{ date?: string; error?: string }>;
};

export default async function LandingPage({ searchParams }: PageProps) {
    const params = searchParams ? await searchParams : {};
    const today = getManilaNow().todayISO;
    const date = params?.date || today;
    const error = params?.error;

    let rawCourts: any[] = [];
    let gridData: any = null;

    try {
        const supabase = await createClient();
        const [{ data }, grid] = await Promise.all([
            supabase
                .from("courts")
                .select("id, name, status, is_active, hourly_rate")
                .order("name", { ascending: true }),
            getBookingGridForDate(date),
        ]);
        rawCourts = data || [];
        gridData = grid;
    } catch (err) {
        console.error("Failed to load courts or schedule for landing page:", err);
    }

    const courts = (rawCourts ?? []).map((c: any) => ({
        id: c.id,
        name: c.name,
        hourly_rate: c.hourly_rate != null ? Number(c.hourly_rate) : 25,
        status: c.status === "Maintenance"
            ? "Maintenance"
            : (c.status === "Not Available" || c.status === "Deactivated" || c.is_active === false)
            ? "Not Available"
            : "Available",
    }));

    return (
        <div className="flex min-h-screen flex-col bg-background text-foreground transition-colors">
            <Navbar />

            <main className="flex-1 flex flex-col">
                {/* 1. Home / Hero Section */}
                <section className="relative flex flex-col items-center justify-center text-center px-4 pt-20 pb-16 sm:px-6 lg:px-8 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(0,0,0,0.03),transparent)] dark:bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(255,255,255,0.03),transparent)]">
                    <div className="max-w-3xl mx-auto space-y-6">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted/80 border border-border text-foreground text-xs font-medium shadow-2xs">
                            <span className="size-2 rounded-full bg-accent-court animate-pulse" />
                            Live Real-Time Court Availability
                        </div>

                        <h1
                            className="animate-hero-rise text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-foreground leading-[1.12]"
                            style={{ animationDelay: "0ms" }}
                        >
                            Effortless booking for your next{" "}
                            <span className="text-foreground underline decoration-accent-court decoration-4 underline-offset-4">pickleball match</span>
                        </h1>
                        <p
                            className="animate-hero-rise max-w-2xl mx-auto text-base sm:text-lg text-muted-foreground leading-relaxed"
                            style={{ animationDelay: "120ms" }}
                        >
                            Reserve courts in real time with live hourly rates in Philippine Pesos (₱). Check open slots, pick your schedule, and get right onto the court.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-3.5 justify-center items-center pt-4">
                            <a
                                href="#book-a-court"
                                className="animate-hero-rise w-full sm:w-auto"
                                style={{ animationDelay: "240ms" }}
                            >
                                <Button className="w-full sm:w-auto text-base font-semibold px-8 py-6 rounded-full bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:shadow-md transition-all duration-200 cursor-pointer">
                                    Book a Court
                                </Button>
                            </a>
                            <a
                                href="#about"
                                className="animate-hero-rise w-full sm:w-auto"
                                style={{ animationDelay: "320ms" }}
                            >
                                <Button
                                    variant="outline"
                                    className="w-full sm:w-auto text-base font-medium px-8 py-6 rounded-full border-border text-foreground hover:bg-muted transition-all duration-200 cursor-pointer"
                                >
                                    Learn More
                                </Button>
                            </a>
                        </div>
                    </div>
                </section>

                {/* 2. Court Booking Section (Middle) */}
                <section id="book-a-court" className="py-14 px-4 sm:px-6 lg:px-8 bg-muted/20 border-t border-border">
                    <div className="mx-auto max-w-6xl">
                        <div className="mb-6 text-center">
                            <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl text-foreground">
                                Court Availability & Schedule
                            </h2>
                            <p className="mt-1.5 text-sm text-muted-foreground max-w-lg mx-auto">
                                Select a date to view live hourly rates and open time slots across all 4 master courts.
                            </p>
                        </div>

                        <div className="space-y-4">
                            {/* Live Court Status Overview */}
                            {courts.length > 0 && (
                                <div className="flex flex-wrap items-center justify-center gap-2.5 pb-2">
                                    {courts.map((court, idx) => {
                                        const isAvailable = court.status === "Available";
                                        const isMaintenance = court.status === "Maintenance";
                                        return (
                                            <div
                                                key={court.id}
                                                className={`animate-pill-pop flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
                                                    isAvailable
                                                        ? "bg-card border-border text-foreground shadow-2xs"
                                                        : isMaintenance
                                                        ? "opacity-75 cursor-not-allowed bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400"
                                                        : "opacity-50 cursor-not-allowed bg-muted border-border text-muted-foreground"
                                                }`}
                                                style={{ animationDelay: `${idx * 60}ms` }}
                                            >
                                                <span
                                                    className={`size-2 rounded-full ${
                                                        isAvailable
                                                            ? "bg-accent-court"
                                                            : isMaintenance
                                                            ? "bg-amber-500"
                                                            : "bg-muted-foreground"
                                                    }`}
                                                />
                                                <span className="font-semibold">{court.name}</span>
                                                <span className="text-xs font-semibold text-foreground">
                                                    ₱{court.hourly_rate}/hr
                                                </span>
                                                <span className="text-xs opacity-75">
                                                    {isMaintenance
                                                        ? "Maintenance"
                                                        : court.status === "Not Available"
                                                        ? "Unavailable"
                                                        : "Available"}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            <DateSelector selectedDate={date} today={today} />

                            {error && (
                                <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">
                                    {error.startsWith("Something went wrong") || error.length < 200 ? error : "Something went wrong. Please try again."}
                                </div>
                            )}

                            {gridData ? (
                                <BookingGrid data={gridData} />
                            ) : (
                                <div className="rounded-xl border border-border bg-card p-12 text-center shadow-2xs">
                                    <p className="text-lg text-foreground font-medium">The venue is closed on this date.</p>
                                    <p className="mt-2 text-sm text-muted-foreground">
                                        Please select another date to view available court times.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* 3. About Pickleball Section (Bottom) */}
                <section
                    id="about"
                    className="px-4 py-24 sm:px-6 lg:px-8 bg-muted/10 border-t border-border"
                    aria-labelledby="about-heading"
                >
                    <div className="max-w-5xl mx-auto">
                        <div className="text-center mb-16">
                            <h2
                                id="about-heading"
                                className="text-3xl font-extrabold tracking-tight sm:text-4xl text-foreground"
                            >
                                The fastest-growing sport in the world
                            </h2>
                            <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
                                Pickleball blends tennis, badminton, and table tennis into a fast-paced, easy-to-learn game for players of all levels.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                            {[
                                {
                                    icon: <Zap className="size-6 text-foreground" />,
                                    title: "Quick to Learn",
                                    body: "Pick up the basics in minutes. Compact court dimensions and straightforward scoring make it beginner-friendly from day one.",
                                },
                                {
                                    icon: <Users className="size-6 text-foreground" />,
                                    title: "Social & Inclusive",
                                    body: "Play singles or doubles. Pickleball brings players of every age and fitness level together in a welcoming community.",
                                },
                                {
                                    icon: <Trophy className="size-6 text-foreground" />,
                                    title: "Competitive Play",
                                    body: "From friendly local round-robins to competitive tournaments, find the right level of challenge to elevate your game.",
                                },
                                {
                                    icon: <CalendarCheck className="size-6 text-foreground" />,
                                    title: "Instant Booking",
                                    body: "Check live court availability and lock in your reservation in seconds with transparent hourly rates in Philippine Pesos (₱).",
                                },
                            ].map(({ icon, title, body }, idx) => (
                                <div
                                    key={title}
                                    className="animate-card-reveal flex flex-col items-center text-center gap-4 p-6 bg-card rounded-2xl border border-border shadow-2xs hover:shadow-xs hover:-translate-y-0.5 transition-all duration-300"
                                    style={{ animationDelay: `${idx * 80}ms` }}
                                >
                                    <div className="flex items-center justify-center size-12 rounded-xl bg-muted border border-border/60">
                                        {icon}
                                    </div>
                                    <h3 className="font-semibold text-foreground text-base">{title}</h3>
                                    <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </main>

            <footer className="py-8 border-t border-border text-center text-sm text-muted-foreground bg-background">
                <p>&copy; {new Date().getFullYear()} Paddlix. All rights reserved.</p>
            </footer>
        </div>
    );
}