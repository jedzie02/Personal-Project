import Link from "next/link";
import { redirect } from "next/navigation";
import {
    CheckCircle2,
    AlertTriangle,
    Calendar,
    MapPin,
    ArrowLeft,
    QrCode,
    Banknote,
    Hash,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { getCurrentProfile } from "@/lib/services/auth.server";
import { getEntryForCustomer } from "@/lib/services/open-play.service";
import { formatTime } from "@/lib/utils/date";

export const dynamic = "force-dynamic";

type PageProps = {
    searchParams?: Promise<{ entryId?: string }>;
};

export default async function OpenPlayConfirmationPage({ searchParams }: PageProps) {
    const profile = await getCurrentProfile();
    if (!profile) {
        redirect("/login");
    }

    const params = searchParams ? await searchParams : {};
    const entryId = params?.entryId?.trim() || "";

    const entry = entryId ? await getEntryForCustomer(entryId, profile.id) : null;

    if (!entry || entry.status === "cancelled") {
        return (
            <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
                <Navbar />
                <main className="flex-1 flex items-center justify-center px-4 py-16">
                    <div className="max-w-md w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center space-y-4">
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                            Open Play Entry Not Found
                        </h1>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            We could not find an active Open Play spot for this link.
                        </p>
                        <Link href="/open-play" className="inline-block pt-2">
                            <Button className="rounded-full bg-blue-600 hover:bg-blue-700 text-white px-6">
                                Back to Open Play Sessions
                            </Button>
                        </Link>
                    </div>
                </main>
            </div>
        );
    }

    const isPaid = entry.status === "paid";
    const isNeedsRefund = entry.status === "needs_refund";

    // If spot is still pending payment, route player to the payment step
    if (!isPaid && !isNeedsRefund) {
        redirect(`/open-play/payment?entryId=${encodeURIComponent(entryId)}`);
    }

    const shortRef = `#${entryId.slice(0, 8).toUpperCase()}`;
    const displayRef = entry.paymentReference || shortRef;

    return (
        <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
            <Navbar />
            <main className="flex-1 flex items-center justify-center px-4 py-12 sm:py-16">
                <div className="max-w-lg w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 space-y-6">
                    {isNeedsRefund ? (
                        <div className="flex flex-col items-center text-center space-y-2">
                            <div className="flex size-12 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400">
                                <AlertTriangle className="size-6" />
                            </div>
                            <span className="inline-flex items-center rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 px-3 py-1 text-xs font-semibold text-amber-800 dark:text-amber-300">
                                Session Cancelled — Refund Pending
                            </span>
                            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white pt-1">
                                Session Cancelled
                            </h1>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                This Open Play session was cancelled by the venue. Your payment ({displayRef}) has been flagged for a full refund.
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center text-center space-y-2">
                            <div className="flex size-12 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 className="size-6" />
                            </div>
                            <span className="inline-flex items-center rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-3 py-1 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                                Spot Reserved & Paid
                            </span>
                            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white pt-1">
                                You&apos;re in for Open Play!
                            </h1>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Your Open Play spot has been reserved and confirmed. Present this pass at the counter upon arrival.
                            </p>
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 font-mono">
                                <Hash className="size-3 text-slate-400" />
                                <span>Ref: {displayRef}</span>
                            </div>
                        </div>
                    )}

                    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 p-4 space-y-3 text-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                Court
                            </span>
                            <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                                <MapPin className="size-3.5 text-blue-600 dark:text-blue-400" />
                                {entry.session.courtName}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                Date
                            </span>
                            <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5 tabular-nums">
                                <Calendar className="size-3.5 text-blue-600 dark:text-blue-400" />
                                {entry.session.date}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                Time
                            </span>
                            <span className="font-semibold text-slate-900 dark:text-white tabular-nums">
                                {formatTime(entry.session.startTime)} – {formatTime(entry.session.endTime)}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                Payment Method
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200">
                                {entry.paymentMethod === "Cash walk in" ? (
                                    <Banknote className="size-3 text-emerald-600 dark:text-emerald-400" />
                                ) : (
                                    <QrCode className="size-3 text-blue-600 dark:text-blue-400" />
                                )}
                                {entry.paymentMethod}
                            </span>
                        </div>
                        {entry.paymentReference && (
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                    Reference #
                                </span>
                                <span className="font-mono text-xs font-semibold text-slate-900 dark:text-white bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                                    {entry.paymentReference}
                                </span>
                            </div>
                        )}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                Entry Fee
                            </span>
                            <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                                ₱{entry.amount.toFixed(2)}
                            </span>
                        </div>
                    </div>

                    {!isNeedsRefund && (
                        <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/70 text-emerald-950 dark:bg-emerald-950/40 dark:border-emerald-800/80 dark:text-emerald-200 space-y-1">
                            <div className="font-semibold flex items-center gap-1.5 text-xs text-emerald-800 dark:text-emerald-300">
                                <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                                Payment Completed — Official Spot Confirmation
                            </div>
                            <p className="text-xs leading-relaxed opacity-95 dark:text-slate-300">
                                Your spot is officially secured for this session. Present this pass at the reception counter upon arrival.
                            </p>
                        </div>
                    )}

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                        <Link href="/bookings" className="w-full sm:w-auto">
                            <Button className="w-full sm:w-auto rounded-full bg-blue-600 hover:bg-blue-700 text-white px-6 cursor-pointer">
                                View My Bookings
                            </Button>
                        </Link>
                        <Link
                            href="/open-play"
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                        >
                            <ArrowLeft className="size-3.5" />
                            Back to Open Play
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    );
}
