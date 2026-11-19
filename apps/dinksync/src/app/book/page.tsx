import Link from "next/link";
import { MapPin, Phone, Mail } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import DateSelector from "@/components/booking/DateSelector";
import BookingGrid from "@/components/booking/BookingGrid";
import { getBookingGridForDate } from "@/lib/services/booking-grid.service";
import { createClient } from "@/lib/supabase/server";
import { getManilaNow } from "@/lib/utils/date";

export const dynamic = "force-dynamic";

type PageProps = {
    searchParams?: Promise<{
        date?: string;
        error?: string;
        selectCourt?: string;
        selectHour?: string;
    }>;
};

export default async function BookPage({ searchParams }: PageProps) {
    const params = searchParams ? await searchParams : {};
    const today = getManilaNow().todayISO;
    const date = params?.date || today;
    const error = params?.error;
    const selectCourt = params?.selectCourt;
    const selectHour = params?.selectHour;

    let rawCourts: any[] = [];
    let gridData: any = null;

    try {
        const supabase = await createClient();
        const [{ data }, grid] = await Promise.all([
            supabase
                .from("courts")
                .select("id, name, status, is_active, hourly_rate")
                .eq("is_active", true)
                .order("name", { ascending: true }),
            getBookingGridForDate(date),
        ]);
        rawCourts = data || [];
        gridData = grid;
    } catch (err) {
        console.error("Failed to load courts or schedule for /book:", err);
    }

    const courts = (rawCourts ?? [])
        .filter((c: any) => c.is_active !== false && c.status !== "Deactivated" && c.status !== "Not Available")
        .map((c: any) => ({
            id: c.id,
            name: c.name,
            hourly_rate: c.hourly_rate != null ? Number(c.hourly_rate) : 300,
            status: c.status === "Maintenance" ? "Maintenance" : "Available",
        }))
        .sort((a: { name: string }, b: { name: string }) =>
            a.name.localeCompare(b.name, undefined, { numeric: true })
        );

    return (
        <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
            <Navbar />

            <main className="flex-1 flex flex-col">
                {/* How It Works: 3 Simple Steps */}
                <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 border-b border-slate-200/70 dark:border-slate-800/80 bg-slate-900/40">
                    <div className="mx-auto max-w-4xl text-center">
                        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl text-slate-900 dark:text-white">
                            Book a court in 3 simple steps
                        </h1>
                        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                            No account creation required. Seamless reservations in seconds.
                        </p>

                        <div className="relative mt-10 grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-6">
                            {/* Desktop connecting line behind step indicators */}
                            <div className="hidden sm:block absolute top-6 left-[18%] right-[18%] h-[3px] bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden -z-0" aria-hidden="true">
                                <div className="h-full bg-gradient-to-r from-blue-600 via-blue-500 to-emerald-500 rounded-full animate-step-beam" />
                            </div>

                            {[
                                { step: "1", title: "Select your slot", body: "Pick your preferred date and tap any open 1-hour slot across our master courts.", pulse: "" },
                                { step: "2", title: "Scan & pay", body: "Scan the venue GCash QR code and input your payment reference to lock the reservation.", pulse: "animate-step-node-2" },
                                { step: "3", title: "Take the court", body: "Show your confirmation upon arrival. Your net, court, and time are guaranteed.", pulse: "animate-step-node-3" },
                            ].map(({ step, title, body, pulse }) => (
                                <div key={step} className="relative z-10 flex flex-col items-center gap-3">
                                    <div className={`flex items-center justify-center size-12 rounded-full bg-white dark:bg-slate-900 border-2 border-blue-600 text-blue-600 dark:text-blue-400 font-bold text-sm shadow-xs ${pulse}`}>
                                        {step}
                                    </div>
                                    <h2 className="font-bold text-slate-900 dark:text-white text-base mt-1">{title}</h2>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-xs">{body}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Court Booking Schedule Section */}
                <section id="book-a-court" className="py-12 sm:py-14 px-4 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-6xl">
                        <div className="mb-6 text-center">
                            <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl text-slate-900 dark:text-white">
                                Court Availability &amp; Schedule
                            </h2>
                            <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400 max-w-lg mx-auto">
                                Select a date to view live hourly rates and open time slots across all courts.
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
                                                        ? "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 shadow-xs"
                                                        : isMaintenance
                                                            ? "opacity-60 cursor-not-allowed bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300"
                                                            : "opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                                                }`}
                                                style={{ animationDelay: `${idx * 60}ms` }}
                                            >
                                                <span
                                                    className={`size-2 rounded-full ${
                                                        isAvailable
                                                            ? "bg-emerald-500"
                                                            : isMaintenance
                                                                ? "bg-amber-500"
                                                                : "bg-slate-400"
                                                    }`}
                                                />
                                                <span className="font-semibold">{court.name}</span>
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
            </main>

            <footer className="border-t border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm text-slate-500 dark:text-slate-400">
                <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="flex flex-col items-center sm:items-start gap-2">
                        <span className="font-bold text-slate-900 dark:text-white text-base">DinkSync</span>
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
                            <a href="mailto:play@dinksync.com" className="flex items-center gap-1.5 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                <Mail className="size-3.5 text-slate-400 shrink-0" />
                                play@dinksync.com
                            </a>
                        </div>
                        <span className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                            &copy; {new Date().getFullYear()} DinkSync. All rights reserved.
                        </span>
                    </div>
                    <nav className="flex gap-6 text-xs sm:text-sm font-medium" aria-label="Footer">
                        <Link href="/#faq" className="hover:text-slate-900 dark:hover:text-white transition-colors">FAQ</Link>
                        <Link href="/privacy" className="hover:text-slate-900 dark:hover:text-white transition-colors">Privacy Policy</Link>
                        <Link href="/terms" className="hover:text-slate-900 dark:hover:text-white transition-colors">Terms of Use</Link>
                    </nav>
                </div>
            </footer>
        </div>
    );
}
