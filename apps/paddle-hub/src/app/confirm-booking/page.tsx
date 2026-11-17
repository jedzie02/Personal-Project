import { Suspense } from "react";
import { Navbar } from "@/components/Navbar";
import ConfirmBookingClient from "./ConfirmBookingClient";
import ConfirmBookingSkeleton from "./ConfirmBookingSkeleton";

export default function ConfirmBookingPage() {
    return (
        <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors">
            <Navbar />
            <main className="flex-1 flex items-center justify-center px-4 py-12 bg-slate-50/50 dark:bg-slate-950">
                <Suspense fallback={<ConfirmBookingSkeleton />}>
                    <ConfirmBookingClient />
                </Suspense>
            </main>
        </div>
    );
}
