import Link from "next/link";
import { MapPin, Phone, Mail } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { listUpcomingSessions } from "@/lib/services/open-play.service";
import OpenPlaySection from "@/components/booking/OpenPlaySection";

export const revalidate = 10;

export default async function OpenPlayPage() {
    let sessions: any[] = [];
    try {
        sessions = await listUpcomingSessions();
    } catch (err) {
        console.error("Failed to load sessions for /open-play:", err);
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
            <Navbar />

            <main className="flex-1 py-4 sm:py-8">
                <OpenPlaySection sessions={sessions} borderTop={false} />
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
