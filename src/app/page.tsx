import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MapPin, Mail, Phone, Zap, Users, Trophy, CalendarCheck, ChevronDown } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import DateSelector from "@/components/booking/DateSelector";
import BookingGrid from "@/components/booking/BookingGrid";
import HeroQuickSlots, { HeroLiveStatusBadge } from "@/components/booking/HeroQuickSlots";
import { getBookingGridForDate } from "@/lib/services/booking-grid.service";
import { createClient } from "@/lib/supabase/server";
import { getManilaNow } from "@/lib/utils/date";
import { extractQuickSlotsSummary } from "@/lib/utils/quick-slots";

export const dynamic = "force-dynamic";

function addOneDayISO(isoDate: string): string {
    const [y, m, d] = isoDate.split("-").map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d + 1));
    return dt.toISOString().slice(0, 10);
}

type PageProps = {
    searchParams?: Promise<{
        date?: string;
        error?: string;
        selectCourt?: string;
        selectHour?: string;
    }>;
};

export default async function LandingPage({ searchParams }: PageProps) {
    const params = searchParams ? await searchParams : {};
    const today = getManilaNow().todayISO;
    const date = params?.date || today;
    const error = params?.error;
    const selectCourt = params?.selectCourt;
    const selectHour = params?.selectHour;

    let rawCourts: any[] = [];
    let gridData: any = null;
    let quickSummary = extractQuickSlotsSummary(null);

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
        quickSummary = extractQuickSlotsSummary(grid);

        if (date === today && quickSummary.totalOpenSlots === 0) {
            const tomorrowISO = addOneDayISO(today);
            const tomorrowGrid = await getBookingGridForDate(tomorrowISO);
            const tomorrowSummary = extractQuickSlotsSummary(tomorrowGrid);
            if (tomorrowSummary.totalOpenSlots > 0) {
                quickSummary = tomorrowSummary;
            }
        }
    } catch (err) {
        console.error("Failed to load courts or schedule for landing page:", err);
    }

    const courts = (rawCourts ?? []).map((c: any) => ({
        id: c.id,
        name: c.name,
        hourly_rate: c.hourly_rate != null ? Number(c.hourly_rate) : 300,
        status: c.status === "Maintenance"
            ? "Maintenance"
            : (c.status === "Not Available" || c.status === "Deactivated" || c.is_active === false)
                ? "Not Available"
                : "Available",
    }));

    return (
        <div className="flex min-h-screen flex-col bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
            <Navbar />

            <main className="flex-1 flex flex-col">
                {/* 1. Home / Hero Section */}
                <section className="relative flex flex-col items-center justify-center text-center px-4 pt-20 pb-16 sm:px-6 lg:px-8 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(37,99,235,0.08),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(37,99,235,0.2),rgba(2,6,23,0))]">
                    <div className="max-w-3xl mx-auto space-y-6 w-full">
                        <div>
                            <HeroLiveStatusBadge summary={quickSummary} todayISO={today} />
                        </div>

                        <h1
                            className="animate-hero-rise text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-slate-900 dark:text-white leading-[1.12]"
                            style={{ animationDelay: "0ms" }}
                        >
                            Effortless booking for your next{" "}
                            <span className="text-blue-600 dark:text-blue-400">pickleball match</span>
                        </h1>
                        <p
                            className="animate-hero-rise max-w-2xl mx-auto text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed"
                            style={{ animationDelay: "120ms" }}
                        >
                            Reserve courts in real time with live hourly rates in Philippine Pesos (₱). Check open slots, pick your schedule, and get right onto the court.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-3.5 justify-center items-center pt-2">
                            <a
                                href="#book-a-court"
                                className="animate-hero-rise w-full sm:w-auto"
                                style={{ animationDelay: "240ms" }}
                            >
                                <Button className="w-full sm:w-auto text-base font-semibold px-8 py-6 rounded-full bg-blue-600 text-white shadow-sm hover:bg-blue-700 hover:shadow-md transition-all duration-200 cursor-pointer">
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
                                    className="w-full sm:w-auto text-base font-semibold px-8 py-6 rounded-full border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-blue-600 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all duration-200 cursor-pointer"
                                >
                                    Learn More
                                </Button>
                            </a>
                        </div>

                        <HeroQuickSlots summary={quickSummary} activeDate={date} todayISO={today} />

                        <div className="pt-2 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 dark:text-slate-400 font-medium">
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
                </section>

                {/* How It Works */}
                <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-slate-200/70 dark:border-slate-800/80 bg-slate-50/40 dark:bg-slate-900/20">
                    <div className="mx-auto max-w-4xl text-center">
                        <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl text-slate-900 dark:text-white">
                            Book a court in 3 simple steps
                        </h2>
                        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                            No account creation required. Seamless reservations in seconds.
                        </p>

                        <div className="relative mt-12 grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-6">
                            {/* Desktop connecting line behind step indicators */}
                            <div className="hidden sm:block absolute top-6 left-[18%] right-[18%] h-[2px] bg-slate-200 dark:bg-slate-800 -z-0" aria-hidden="true" />

                            {[
                                { step: "1", title: "Select your slot", body: "Pick your preferred date and tap any open 1-hour slot across our 4 master courts." },
                                { step: "2", title: "Scan & pay", body: "Scan the venue GCash QR code and input your payment reference to lock the reservation." },
                                { step: "3", title: "Take the court", body: "Show your confirmation upon arrival. Your net, court, and time are guaranteed." },
                            ].map(({ step, title, body }) => (
                                <div key={step} className="relative z-10 flex flex-col items-center gap-3">
                                    <div className="flex items-center justify-center size-12 rounded-full bg-white dark:bg-slate-900 border-2 border-blue-600 text-blue-600 dark:text-blue-400 font-bold text-sm shadow-xs">
                                        {step}
                                    </div>
                                    <h3 className="font-bold text-slate-900 dark:text-white text-base mt-1">{title}</h3>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-xs">{body}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* 2. Court Booking Section (Middle) */}
                <section id="book-a-court" className="py-14 px-4 sm:px-6 lg:px-8 bg-slate-50/60 dark:bg-slate-900/40 border-t border-slate-200/70 dark:border-slate-800/80">
                    <div className="mx-auto max-w-6xl">
                        <div className="mb-6 text-center">
                            <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl text-slate-900 dark:text-white">
                                Court Availability & Schedule
                            </h2>
                            <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400 max-w-lg mx-auto">
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
                                                className={`animate-pill-pop flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${isAvailable
                                                        ? "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 shadow-xs"
                                                        : isMaintenance
                                                            ? "opacity-60 cursor-not-allowed bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300"
                                                            : "opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                                                    }`}
                                                style={{ animationDelay: `${idx * 60}ms` }}
                                            >
                                                <span
                                                    className={`size-2 rounded-full ${isAvailable
                                                            ? "bg-emerald-500"
                                                            : isMaintenance
                                                                ? "bg-amber-500"
                                                                : "bg-slate-400"
                                                        }`}
                                                />
                                                <span className="font-semibold">{court.name}</span>
                                                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                                                    ₱{court.hourly_rate}/hr
                                                </span>
                                                <span className="text-xs opacity-90">
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
                                <div className="rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-700 dark:text-red-300">
                                    {error.startsWith("Something went wrong") || error.length < 200 ? error : "Something went wrong. Please try again."}
                                </div>
                            )}

                            {gridData ? (
                                <BookingGrid
                                    data={gridData}
                                    initialSelectCourt={selectCourt}
                                    initialSelectHour={selectHour}
                                />
                            ) : (
                                <div className="rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center shadow-sm">
                                    <p className="text-lg text-gray-600 dark:text-slate-300 font-medium">The venue is closed on this date.</p>
                                    <p className="mt-2 text-sm text-gray-400 dark:text-slate-500">
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
                    className="px-4 py-24 sm:px-6 lg:px-8 bg-slate-50/50 dark:bg-slate-900/40 border-t border-slate-200/70 dark:border-slate-800/80"
                    aria-labelledby="about-heading"
                >
                    <div className="max-w-5xl mx-auto">
                        <div className="text-center mb-16">
                            <h2
                                id="about-heading"
                                className="text-3xl font-extrabold tracking-tight sm:text-4xl text-slate-900 dark:text-white"
                            >
                                Why players choose the Paddlix courts
                            </h2>
                            <p className="mt-4 max-w-2xl mx-auto text-base sm:text-lg text-slate-600 dark:text-slate-400">
                                Pickleball blends tennis, badminton, and table tennis into a fast-paced, high-energy game built for everyone.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-950/70 overflow-hidden shadow-xs divide-y md:divide-y-0 divide-slate-200/80 dark:divide-slate-800">
                            {[
                                {
                                    icon: <Zap className="size-5 text-blue-600 dark:text-blue-400" />,
                                    title: "Quick to Learn & Fast Paced",
                                    body: "Pick up the basics in minutes. Compact court dimensions and intuitive scoring make it thrilling from your very first serve.",
                                    tag: "Beginner Friendly",
                                },
                                {
                                    icon: <Users className="size-5 text-blue-600 dark:text-blue-400" />,
                                    title: "Social & Community Focused",
                                    body: "Play doubles or singles. Paddlix courts bring together all ages and skill levels for friendly rallies and open sessions.",
                                    tag: "Open Play",
                                },
                                {
                                    icon: <Trophy className="size-5 text-blue-600 dark:text-blue-400" />,
                                    title: "Tournament-Ready Quality",
                                    body: "High-traction cushioned court surfaces and tournament regulation nets designed for peak competitive play.",
                                    tag: "Pro Spec",
                                },
                                {
                                    icon: <CalendarCheck className="size-5 text-blue-600 dark:text-blue-400" />,
                                    title: "Zero-Wait Real-Time Scheduling",
                                    body: "Skip the back-and-forth chat inquiries. View real-time slot statuses and lock your booking with instant GCash verification.",
                                    tag: "Live Engine",
                                },
                            ].map(({ icon, title, body, tag }, idx) => (
                                <div
                                    key={title}
                                    className={`p-8 sm:p-10 flex flex-col justify-between gap-6 hover:bg-slate-50/60 dark:hover:bg-slate-900/30 transition-colors ${
                                        idx % 2 === 0 ? "md:border-r border-slate-200/80 dark:border-slate-800" : ""
                                    } ${idx < 2 ? "md:border-b border-slate-200/80 dark:border-slate-800" : ""}`}
                                >
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center justify-center size-10 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900/50">
                                                {icon}
                                            </div>
                                            <span className="text-xs font-semibold tracking-wider uppercase text-slate-400 dark:text-slate-500">
                                                {tag}
                                            </span>
                                        </div>
                                        <h3 className="font-bold text-slate-900 dark:text-white text-lg tracking-tight">
                                            {title}
                                        </h3>
                                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                            {body}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
                {/* FAQ */}
                <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-slate-950 border-t border-slate-200/70 dark:border-slate-800/80">
                    <div className="mx-auto max-w-2xl">
                        <div className="text-center mb-12">
                            <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl text-slate-900 dark:text-white">
                                Frequently Asked Questions
                            </h2>
                            <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
                                Everything you need to know before you book.
                            </p>
                        </div>
                        <div className="divide-y divide-slate-200 dark:divide-slate-800">
                            {[
                                {
                                    q: "How do I book a court?",
                                    a: "Pick a date using the date selector above, tap any available time slot on the court grid, review your booking, then pay via GCash QR. Your reservation is confirmed instantly.",
                                },
                                {
                                    q: "What payment methods do you accept?",
                                    a: "We currently accept GCash. After selecting your slot, you'll be shown a QR code to scan. Enter your GCash reference number to complete the booking.",
                                },
                                {
                                    q: "Can I book multiple courts or hours at once?",
                                    a: "Yes — tap multiple slots across courts or time blocks and they'll be added to your cart. Review everything in one go before confirming.",
                                },
                                {
                                    q: "How many players fit on one court?",
                                    a: "A standard pickleball court fits 4 players for doubles, or 2 for singles. You're welcome to rotate players in friendly sessions.",
                                },
                                {
                                    q: "Do I need to bring my own equipment?",
                                    a: "You're welcome to bring your own paddle and balls. Ask the venue staff about equipment rental availability on arrival.",
                                },
                                {
                                    q: "What are the venue operating hours?",
                                    a: "Please check the booking grid for available slots — it reflects the venue's actual open hours for each date. Specific hours may vary on holidays.",
                                },
                                {
                                    q: "Can I cancel or reschedule my booking?",
                                    a: "For cancellations or reschedule requests, please contact us directly via the email or phone number in the footer below.",
                                },
                            ].map(({ q, a }) => (
                                <details key={q} className="group py-4 cursor-pointer list-none">
                                    <summary className="flex items-center justify-between gap-4 font-semibold text-slate-900 dark:text-white text-sm sm:text-base select-none list-none marker:hidden">
                                        {q}
                                        <span className="shrink-0 size-6 rounded-full border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 group-hover:border-slate-300 dark:group-hover:border-slate-700 transition-colors">
                                            <ChevronDown className="size-3.5 group-open:rotate-180 transition-transform duration-200" />
                                        </span>
                                    </summary>
                                    <p className="mt-3 text-sm text-slate-600 dark:text-slate-400 leading-relaxed pr-8">
                                        {a}
                                    </p>
                                </details>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Closing CTA */}
                <section className="py-20 px-4 sm:px-6 lg:px-8 text-center border-t border-slate-200/70 dark:border-slate-800/80">
                    <div className="max-w-xl mx-auto space-y-5">
                        <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                            Ready to play?
                        </h2>
                        <p className="text-slate-600 dark:text-slate-400">
                            Courts are available now. Grab a slot before it&apos;s gone.
                        </p>
                        <a href="#book-a-court">
                            <Button className="text-base font-semibold px-8 py-6 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-all duration-200 cursor-pointer">
                                Book a Court
                            </Button>
                        </a>
                    </div>
                </section>
            </main>

            <footer className="border-t border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm text-slate-500 dark:text-slate-400">
                <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="flex flex-col items-center sm:items-start gap-2">
                        <span className="font-bold text-slate-900 dark:text-white text-base">Paddlix</span>
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                            <span className="flex items-center gap-1.5">
                                <MapPin className="size-3.5 text-slate-400 shrink-0" />
                                J.C. Aquino Ave, Butuan City
                            </span>
                            <span className="hidden sm:inline text-slate-300 dark:text-slate-700">·</span>
                            <span className="flex items-center gap-1.5">
                                <Phone className="size-3.5 text-slate-400 shrink-0" />
                                +63 9171234567
                            </span>
                            <span className="hidden sm:inline text-slate-300 dark:text-slate-700">·</span>
                            <a href="mailto:play@paddlix.com" className="flex items-center gap-1.5 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                <Mail className="size-3.5 text-slate-400 shrink-0" />
                                play@paddlix.com
                            </a>
                        </div>
                        <span className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                            &copy; {new Date().getFullYear()} Paddlix. All rights reserved.
                        </span>
                    </div>
                    <nav className="flex gap-6 text-xs sm:text-sm font-medium" aria-label="Footer">
                        <a href="/privacy" className="hover:text-slate-900 dark:hover:text-white transition-colors">Privacy Policy</a>
                        <a href="/terms" className="hover:text-slate-900 dark:hover:text-white transition-colors">Terms of Use</a>
                    </nav>
                </div>
            </footer>
        </div>
    );
}
