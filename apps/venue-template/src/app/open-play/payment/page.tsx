import Link from "next/link";
import { redirect } from "next/navigation";
import { Calendar } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { getCurrentProfile } from "@/lib/services/auth.server";
import { getEntryForCustomer } from "@/lib/services/open-play.service";
import { getGCashSettings } from "@/lib/services/settings.service";
import { OpenPlayPaymentClient } from "./OpenPlayPaymentClient";

export const dynamic = "force-dynamic";

export default async function OpenPlayPaymentPage({
    searchParams,
}: {
    searchParams: Promise<{ entryId?: string }>;
}) {
    const profile = await getCurrentProfile();
    if (!profile) {
        redirect("/login");
    }

    const { entryId } = await searchParams;
    const cleanId = entryId?.trim() || "";

    const entry = cleanId ? await getEntryForCustomer(cleanId, profile.id) : null;

    if (!entry || entry.status === "cancelled") {
        return (
            <div className="min-h-screen flex flex-col bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100">
                <Navbar />
                <main className="flex-1 flex items-center justify-center px-4 py-16">
                    <div className="mx-auto max-w-md text-center space-y-3">
                        <div className="size-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                            <Calendar className="size-6" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            Open Play Entry Not Found
                        </h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            We couldn&apos;t locate that Open Play reservation. Please start from the Open Play sessions list.
                        </p>
                        <Link href="/open-play" className="pt-2 inline-block">
                            <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6">
                                Return to Open Play
                            </Button>
                        </Link>
                    </div>
                </main>
            </div>
        );
    }

    if (entry.status === "paid") {
        redirect(`/open-play/confirmation?entryId=${encodeURIComponent(cleanId)}`);
    }

    const gcashSettings = await getGCashSettings();

    return (
        <div className="min-h-screen flex flex-col bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
            <Navbar />
            <main className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
                <OpenPlayPaymentClient
                    entryId={entry.id}
                    totalPrice={entry.amount}
                    courtName={entry.session.courtName}
                    sessionDate={entry.session.date}
                    startTime={entry.session.startTime}
                    endTime={entry.session.endTime}
                    qrImageUrl={gcashSettings?.gcash_qr_url}
                    gcashName={gcashSettings?.gcash_name}
                    gcashNumber={gcashSettings?.gcash_number}
                />
            </main>
        </div>
    );
}
