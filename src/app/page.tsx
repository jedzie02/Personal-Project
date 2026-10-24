import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CircleDotDashed, Zap, Users, Trophy, CalendarCheck } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import DateSelector from "@/components/booking/DateSelector";
import BookingGrid from "@/components/booking/BookingGrid";
import { getBookingGridForDate } from "@/lib/services/booking-grid.service";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function todayISO() {
    const d = new Date();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${d.getFullYear()}-${m}-${day}`;
}

type PageProps = {
    searchParams?: Promise<{ date?: string; error?: string }>;
};

export default async function LandingPage({ searchParams }: PageProps) {
    const params = searchParams ? await searchParams : {};
    const today = todayISO();
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
        <div className="flex min-h-screen flex-col bg-white">
            <Navbar />

            <main className="flex-1 flex flex-col">
                {/* 1. Home / Hero Section (Top) */}
                <section className="flex flex-col items-center justify-center text-center px-4 py-24 sm:px-6 lg:px-8">
                    <div className="max-w-3xl mx-auto space-y-8">
                        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-gray-900">
                            Effortless booking for your next{" "}
                            <span className="text-blue-600">pickleball match</span>
                        </h1>
                        <p className="max-w-2xl mx-auto text-xl text-gray-600">
                            Reserve courts in real time with live hourly rates. Check open slots, pick your schedule, and get right onto the court.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
                            <a href="#book-a-court">
                                <Button className="w-full sm:w-auto text-xl px-12 py-7 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 hover:scale-105 hover:shadow-xl transition-all duration-300 cursor-pointer">
                                    Book a Court
                                </Button>
                            </a>
                            <a href="#about">
                                <Button
                                    variant="outline"
                                    className="w-full sm:w-auto text-xl px-12 py-7 rounded-full border-gray-300 text-gray-700 hover:border-blue-600 hover:text-blue-600 transition-all duration-300 cursor-pointer"
                                >
                                    Learn More
                                </Button>
                            </a>
                        </div>
                    </div>
                </section>

                {/* 2. Court Booking Section (Middle) */}
                <section id="book-a-court" className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-50/50 border-t border-gray-100">
                    <div className="mx-auto max-w-6xl">
                        <div className="mb-8 text-center">
                        <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-gray-900">
                                Book a Court
                            </h2>
                            <p className="mt-2 text-base text-gray-600 max-w-xl mx-auto">
                                Select a date to view live hourly rates and open time slots across all courts.
                            </p>
                        </div>

                        <div className="space-y-4">
                            {/* Live Court Status Overview */}
                            {courts.length > 0 && (
                                <div className="flex flex-wrap items-center justify-center gap-2.5 pb-2">
                                    {courts.map((court) => {
                                        const isAvailable = court.status === "Available";
                                        const isMaintenance = court.status === "Maintenance";
                                        return (
                                            <div
                                                key={court.id}
                                                className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
                                                    isAvailable
                                                        ? "bg-white border-slate-200 text-slate-800 shadow-xs"
                                                        : isMaintenance
                                                        ? "opacity-60 cursor-not-allowed bg-amber-50 border-amber-200 text-amber-800"
                                                        : "opacity-50 cursor-not-allowed bg-slate-100 border-slate-200 text-slate-600"
                                                }`}
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
                                                <span className="text-xs font-semibold text-blue-600">
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
                                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                    {error.startsWith("Something went wrong") || error.length < 200 ? error : "Something went wrong. Please try again."}
                                </div>
                            )}

                            {gridData ? (
                                <BookingGrid data={gridData} />
                            ) : (
                                <div className="rounded-xl border border-gray-200 bg-white p-12 text-center shadow-sm">
                                    <p className="text-lg text-gray-600 font-medium">The venue is closed on this date.</p>
                                    <p className="mt-2 text-sm text-gray-400">
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
                    className="px-4 py-24 sm:px-6 lg:px-8 bg-gray-50 border-t border-gray-100"
                    aria-labelledby="about-heading"
                >
                    <div className="max-w-5xl mx-auto">
                        <div className="text-center mb-16">
                            <h2
                                id="about-heading"
                                className="text-3xl font-extrabold tracking-tight sm:text-4xl text-gray-900"
                            >
                                The fastest-growing sport in the world
                            </h2>
                            <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-600">
                                Pickleball blends tennis, badminton, and table tennis into a fast-paced, easy-to-learn game for players of all levels.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                            {[
                                {
                                    icon: <Zap className="size-7 text-blue-600" />,
                                    title: "Quick to Learn",
                                    body: "Pick up the basics in minutes. Compact court dimensions and straightforward scoring make it beginner-friendly from day one.",
                                },
                                {
                                    icon: <Users className="size-7 text-blue-600" />,
                                    title: "Social & Inclusive",
                                    body: "Play singles or doubles. Pickleball brings players of every age and fitness level together in a welcoming community.",
                                },
                                {
                                    icon: <Trophy className="size-7 text-blue-600" />,
                                    title: "Competitive Play",
                                    body: "From friendly local round-robins to competitive tournaments, find the right level of challenge to elevate your game.",
                                },
                                {
                                    icon: <CalendarCheck className="size-7 text-blue-600" />,
                                    title: "Instant Booking",
                                    body: "Check live court availability and lock in your reservation in seconds with transparent hourly rates in Philippine Pesos (₱).",
                                },
                            ].map(({ icon, title, body }) => (
                                <div
                                    key={title}
                                    className="flex flex-col items-center text-center gap-4 p-6 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300"
                                >
                                    <div className="flex items-center justify-center size-14 rounded-xl bg-blue-50">
                                        {icon}
                                    </div>
                                    <h3 className="font-bold text-gray-900 text-lg">{title}</h3>
                                    <p className="text-sm text-gray-600 leading-relaxed">{body}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </main>

            <footer className="py-8 border-t border-gray-200 text-center text-sm text-gray-500 bg-gray-50">
                <p>&copy; {new Date().getFullYear()} Paddlix. All rights reserved.</p>
            </footer>
        </div>
    );
}