import { Navbar } from "@/components/Navbar";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, Mail, Calendar, ChevronRight } from "lucide-react";

export const metadata = {
    title: "Privacy Policy – DinkSync",
    description: "Learn how DinkSync collects, protects, and handles your booking data and payment information.",
};

const sections = [
    {
        id: "information-we-collect",
        title: "1. Information We Collect",
        body: "When you book a court through DinkSync, we collect your name, contact phone number, and GCash payment reference number. We also record the specific date, operating time slot, and court assignment associated with your reservation.",
    },
    {
        id: "how-we-use-information",
        title: "2. How We Use Your Information",
        body: "We use your details exclusively to coordinate court reservations, reconcile GCash payments, and contact you if an unforeseen schedule adjustment or weather closure arises. We never sell, rent, or share personal data with external marketers or advertising networks.",
    },
    {
        id: "data-storage-security",
        title: "3. Data Storage & Security",
        body: "Your booking records are stored in encrypted database instances hosted with enterprise-grade access controls. Payment references are recorded solely to verify transaction legitimacy with venue management.",
    },
    {
        id: "cookies-sessions",
        title: "4. Cookies & Session Storage",
        body: "DinkSync uses strictly necessary functional cookies and local storage tokens to preserve booking cart items and session authentication. We do not deploy third-party trackers or ad targeting beacons.",
    },
    {
        id: "your-rights",
        title: "5. Your Rights & Data Access",
        body: "You maintain full rights to inspect, update, or request permanent deletion of your booking history and contact details from our records. To exercise these rights, submit a request via play@dinksync.com.",
    },
    {
        id: "policy-updates",
        title: "6. Updates to This Policy",
        body: "We periodically refine this policy to reflect operational or regulatory improvements. Substantive updates will be published directly on this page with an updated effective date.",
    },
];

export default function PrivacyPage() {
    return (
        <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
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
                    <span className="text-slate-900 dark:text-white font-medium">Privacy Policy</span>
                </div>

                {/* Header */}
                <header className="space-y-3 pb-8 border-b border-slate-200/80 dark:border-slate-800">
                    <div className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-950/60 border border-blue-200/70 dark:border-blue-900/60 text-blue-700 dark:text-blue-300">
                        <ShieldCheck className="size-3.5" />
                        Trust & Data Protection
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                        Privacy Policy
                    </h1>
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <Calendar className="size-3.5" />
                        <span>Last updated: November 2026</span>
                        <span>•</span>
                        <span>Standard Philippine Data Privacy Act Compliance</span>
                    </div>
                </header>

                {/* Key Takeaways Card */}
                <section className="my-8 p-5 sm:p-6 rounded-xl border border-blue-100 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/20 space-y-2">
                    <h2 className="text-sm font-bold text-blue-900 dark:text-blue-200 uppercase tracking-wider">
                        Key Highlights
                    </h2>
                    <ul className="text-sm text-slate-700 dark:text-slate-300 space-y-1.5 list-disc list-inside">
                        <li>We only collect details strictly required to confirm your court booking and verify GCash payment.</li>
                        <li>We never sell or distribute your contact details to third parties.</li>
                        <li>You may request complete removal of your booking details at any time by contacting our team.</li>
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
                            Have privacy inquiries?
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                            Our team is available to assist with data requests or policy clarifications.
                        </p>
                    </div>
                    <a
                        href="mailto:play@dinksync.com"
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
                    >
                        <Mail className="size-3.5" />
                        play@dinksync.com
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
                        href="/terms"
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                    >
                        View Terms of Use →
                    </Link>
                </div>
            </main>
        </div>
    );
}
