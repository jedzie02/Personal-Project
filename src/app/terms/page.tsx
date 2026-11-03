import { Navbar } from "@/components/Navbar";
import Link from "next/link";
import { ArrowLeft, FileText, Mail, Calendar, ChevronRight } from "lucide-react";

export const metadata = {
    title: "Terms of Use – Paddlix",
    description: "Guidelines, court etiquette, cancellation rules, and booking policies for Paddlix courts.",
};

const sections = [
    {
        id: "acceptance",
        title: "1. Acceptance of Terms",
        body: "By accessing or reserving courts through Paddlix, you agree to comply with and be bound by these terms. If you disagree with any portion of these conditions, please refrain from submitting reservations.",
    },
    {
        id: "booking-payments",
        title: "2. Reservations & Payment Verification",
        body: "Court time slots are temporarily reserved during cart checkout and officially confirmed only upon submission of a valid, authentic GCash reference number. Paddlix reserves the explicit right to void and reopen reservations associated with invalid, fraudulent, or duplicated payment references.",
    },
    {
        id: "cancellations-refunds",
        title: "3. Cancellations & Rescheduling Policy",
        body: "Rescheduling requests or cancellations must be communicated to venue management via play@paddlix.com at least 24 hours prior to the scheduled slot start time. Due to court capacity constraints, cancellations submitted within 24 hours of play or no-shows are non-refundable.",
    },
    {
        id: "court-rules-conduct",
        title: "4. Court Usage & Player Etiquette",
        body: "Players must arrive punctually for their reserved hours. Courts are held for up to 15 minutes past start time before being designated as forfeited. Appropriate non-marking athletic footwear is mandatory on all court surfaces. All players and guests must treat fellow athletes, venue staff, and facility equipment with respect.",
    },
    {
        id: "liability-assumption-risk",
        title: "5. Health, Safety & Limitation of Liability",
        body: "Pickleball is an active athletic sport with inherent physical risks. Players participate voluntarily at their own discretion and assume full responsibility for their personal health and safety. Paddlix and venue partners disclaim liability for accidental personal injury, equipment loss, or property damage occurring on premises.",
    },
    {
        id: "facility-maintenance-weather",
        title: "6. Weather Closures & Maintenance",
        body: "In the event of severe weather, power disruption, or scheduled court maintenance that renders play unsafe, venue management will notify affected players and provide full credit or alternative slot rescheduling.",
    },
    {
        id: "policy-modifications",
        title: "7. Modifications to Agreement",
        body: "Paddlix reserves the right to amend court pricing, operational guidelines, and these terms as venue operations evolve. Continued engagement with the booking platform after revisions constitutes full acceptance of the updated terms.",
    },
];

export default function TermsPage() {
    return (
        <div className="flex min-h-screen flex-col bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
            <Navbar />

            <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
                {/* Breadcrumbs & Navigation */}
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-8">
                    <Link href="/" className="hover:text-slate-900 dark:hover:text-white transition-colors">
                        Home
                    </Link>
                    <ChevronRight className="size-3.5" />
                    <span>Legal</span>
                    <ChevronRight className="size-3.5" />
                    <span className="text-slate-900 dark:text-white font-medium">Terms of Use</span>
                </div>

                {/* Header */}
                <header className="space-y-3 pb-8 border-b border-slate-200/80 dark:border-slate-800">
                    <div className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-950/60 border border-blue-200/70 dark:border-blue-900/60 text-blue-700 dark:text-blue-300">
                        <FileText className="size-3.5" />
                        Court Agreement & Policies
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                        Terms of Use
                    </h1>
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <Calendar className="size-3.5" />
                        <span>Last updated: November 2026</span>
                        <span>•</span>
                        <span>Facility Operating Agreement</span>
                    </div>
                </header>

                {/* Key Takeaways Card */}
                <section className="my-8 p-5 sm:p-6 rounded-xl border border-blue-100 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/20 space-y-2">
                    <h2 className="text-sm font-bold text-blue-900 dark:text-blue-200 uppercase tracking-wider">
                        Key Booking Conditions
                    </h2>
                    <ul className="text-sm text-slate-700 dark:text-slate-300 space-y-1.5 list-disc list-inside">
                        <li>Bookings are confirmed upon valid GCash payment reference verification.</li>
                        <li>Cancellations or rescheduling require at least 24 hours notice prior to slot start time.</li>
                        <li>Non-marking sports footwear is required on all courts; players participate at their own discretion.</li>
                    </ul>
                </section>

                {/* Content Sections */}
                <div className="space-y-10 my-10">
                    {sections.map((sec) => (
                        <section key={sec.id} id={sec.id} className="scroll-mt-24 space-y-2">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                                {sec.title}
                            </h2>
                            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                                {sec.body}
                            </p>
                        </section>
                    ))}
                </div>

                {/* Contact Box */}
                <section className="mt-12 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <h3 className="font-bold text-slate-900 dark:text-white text-base">
                            Questions regarding court policies?
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                            Reach out directly to venue coordinators for team bookings or dispute resolutions.
                        </p>
                    </div>
                    <a
                        href="mailto:play@paddlix.com"
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
                    >
                        <Mail className="size-3.5" />
                        play@paddlix.com
                    </a>
                </section>

                {/* Footer Back Link */}
                <div className="mt-12 pt-6 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                        <ArrowLeft className="size-4" />
                        Return to Court Booking
                    </Link>
                    <Link
                        href="/privacy"
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                    >
                        View Privacy Policy →
                    </Link>
                </div>
            </main>
        </div>
    );
}
