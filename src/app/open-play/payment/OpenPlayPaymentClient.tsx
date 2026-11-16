"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    QrCode,
    Download,
    CheckCircle2,
    Loader2,
    AlertCircle,
    Calendar,
    Clock,
    MapPin,
    ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { formatTime } from "@/lib/utils/date";
import { completeOpenPlayPaymentAction } from "@/app/open-play/actions";

export interface OpenPlayPaymentClientProps {
    entryId: string;
    totalPrice: number;
    courtName: string;
    sessionDate: string;
    startTime: string;
    endTime: string;
    qrImageUrl?: string | null;
    gcashName?: string | null;
    gcashNumber?: string | null;
    completeAction?: (id: string) => Promise<{ success: boolean; error?: string }>;
}

export function OpenPlayPaymentClient({
    entryId,
    totalPrice,
    courtName,
    sessionDate,
    startTime,
    endTime,
    qrImageUrl: propQrUrl,
    gcashName,
    gcashNumber,
    completeAction = completeOpenPlayPaymentAction,
}: OpenPlayPaymentClientProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [downloadSuccess, setDownloadSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const qrImage = propQrUrl?.trim() || "/gcash-qr.jpg";

    const handleSaveQr = async () => {
        setIsDownloading(true);
        setError(null);

        try {
            const response = await fetch(qrImage);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = blobUrl;
            link.download = `open-play-qr-ph-${entryId.slice(0, 8)}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);

            setDownloadSuccess(true);
            setTimeout(() => setDownloadSuccess(false), 3000);
        } catch {
            const link = document.createElement("a");
            link.href = qrImage;
            link.target = "_blank";
            link.download = "open-play-qr-ph.jpg";
            link.click();
            setDownloadSuccess(true);
            setTimeout(() => setDownloadSuccess(false), 3000);
        } finally {
            setIsDownloading(false);
        }
    };

    const handleCompletedPayment = async () => {
        setIsSubmitting(true);
        setError(null);

        try {
            const res = await completeAction(entryId);
            if (res.success) {
                router.push(`/open-play/confirmation?entryId=${encodeURIComponent(entryId)}`);
            } else {
                setError(res.error || "Failed to confirm payment. Please try again.");
                setIsSubmitting(false);
            }
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "An unexpected error occurred.";
            setError(msg);
            setIsSubmitting(false);
        }
    };

    return (
        <div className="w-full max-w-md mx-auto">
            <div className="mb-4">
                <Link
                    href="/open-play"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                >
                    <ArrowLeft className="w-3.5 h-3.5" /> Back to Open Play
                </Link>
            </div>

            <Card className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                <CardHeader className="p-6 text-center border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="inline-flex items-center justify-center size-12 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 mb-2 border border-blue-100 dark:border-blue-900/60 shadow-xs mx-auto">
                        <QrCode className="w-6 h-6" />
                    </div>
                    <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
                        Scan QR Ph to Pay
                    </CardTitle>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Use GCash, Maya, or any QR Ph enabled banking app to complete your Open Play reservation.
                    </p>

                    {/* Session Details Chip */}
                    <div className="mt-3.5 inline-flex flex-wrap items-center justify-center gap-2 px-3 py-1.5 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/60 text-xs text-blue-900 dark:text-blue-300 font-medium">
                        <span className="flex items-center gap-1">
                            <MapPin className="size-3 text-blue-600 dark:text-blue-400" />
                            <strong className="font-semibold">{courtName}</strong>
                        </span>
                        <span className="text-blue-300 dark:text-blue-700">•</span>
                        <span className="flex items-center gap-1">
                            <Calendar className="size-3 text-blue-600 dark:text-blue-400" />
                            {sessionDate}
                        </span>
                        <span className="text-blue-300 dark:text-blue-700">•</span>
                        <span className="flex items-center gap-1">
                            <Clock className="size-3 text-blue-600 dark:text-blue-400" />
                            {formatTime(startTime)} – {formatTime(endTime)}
                        </span>
                    </div>
                </CardHeader>

                <CardContent className="p-6 space-y-4">
                    {error && (
                        <div className="p-3.5 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-xs flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* QR Code Standee Card */}
                    <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-3">
                        <div className="relative size-52 sm:size-56 overflow-hidden rounded-xl bg-white p-2 shadow-xs border border-slate-200 dark:border-slate-700">
                            <Image
                                src={qrImage}
                                alt="QR Ph Payment Code"
                                fill
                                className="object-contain p-1"
                                priority
                                unoptimized
                            />
                        </div>

                        {/* Amount Display directly below QR */}
                        <div className="text-center pt-1">
                            <span className="text-xs uppercase font-semibold tracking-wider text-slate-500 dark:text-slate-400">
                                Exact Amount to Pay
                            </span>
                            <div className="text-2xl sm:text-3xl font-extrabold text-blue-600 dark:text-blue-400 tabular-nums">
                                ₱{totalPrice.toFixed(2)}
                            </div>
                            {gcashName && (
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                                    Account: {gcashName} {gcashNumber ? `(${gcashNumber})` : ""}
                                </p>
                            )}
                        </div>

                        {/* Save QR to Photos Button */}
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleSaveQr}
                            disabled={isDownloading}
                            className="w-full h-10 rounded-xl border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                        >
                            {isDownloading ? (
                                <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    Saving…
                                </>
                            ) : downloadSuccess ? (
                                <>
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                    Saved to photos!
                                </>
                            ) : (
                                <>
                                    <Download className="w-3.5 h-3.5" />
                                    Save QR to photos
                                </>
                            )}
                        </Button>
                    </div>

                    <p className="text-xs text-slate-400 dark:text-slate-500 text-center leading-relaxed">
                        Open your e-wallet or banking app, scan or upload this QR code from your photos, and send the exact amount. Then tap below.
                    </p>
                </CardContent>

                <CardFooter className="p-6 pt-0 flex flex-col gap-2.5">
                    <Button
                        type="button"
                        onClick={handleCompletedPayment}
                        disabled={isSubmitting}
                        className="w-full py-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Confirming Spot…
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="w-4 h-4" />
                                I&apos;ve Completed Payment
                            </>
                        )}
                    </Button>

                    <Link href="/open-play" className="w-full">
                        <Button
                            type="button"
                            variant="ghost"
                            disabled={isSubmitting}
                            className="w-full rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold"
                        >
                            Cancel
                        </Button>
                    </Link>
                </CardFooter>
            </Card>
        </div>
    );
}
