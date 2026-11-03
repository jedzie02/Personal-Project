"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, QrCode, Banknote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { joinOpenPlayAction } from "@/app/open-play/actions";

export default function JoinOpenPlayButton({
    sessionId,
    spotsLeft,
    pricePerPlayer,
}: {
    sessionId: string;
    spotsLeft: number;
    pricePerPlayer: number;
}) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [paymentMethod, setPaymentMethod] = useState<"GCash QR" | "Cash walk in">("GCash QR");
    const [error, setError] = useState<string | null>(null);

    const isFull = spotsLeft <= 0;

    const handleJoin = () => {
        if (isFull || isPending) return;
        setError(null);

        startTransition(async () => {
            const res = await joinOpenPlayAction(sessionId, paymentMethod);
            if (res.needsLogin) {
                router.push("/login");
                return;
            }
            if (res.url) {
                router.push(res.url);
                return;
            }
            setError(res.error || "Could not join this Open Play session.");
        });
    };

    return (
        <div className="space-y-2.5">
            {!isFull && (
                <div className="grid grid-cols-2 gap-1.5" role="group" aria-label="Payment method">
                    <button
                        type="button"
                        disabled={isPending}
                        onClick={() => setPaymentMethod("GCash QR")}
                        className={`flex items-center justify-center gap-1.5 rounded-xl border px-2.5 py-2 text-xs font-semibold transition-all cursor-pointer ${
                            paymentMethod === "GCash QR"
                                ? "border-blue-600 bg-blue-50/90 dark:bg-blue-950/70 text-blue-800 dark:text-blue-200 shadow-2xs"
                                : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700"
                        }`}
                    >
                        <QrCode className="size-3.5 shrink-0 text-blue-600 dark:text-blue-400" />
                        <span>GCash QR</span>
                    </button>
                    <button
                        type="button"
                        disabled={isPending}
                        onClick={() => setPaymentMethod("Cash walk in")}
                        className={`flex items-center justify-center gap-1.5 rounded-xl border px-2.5 py-2 text-xs font-semibold transition-all cursor-pointer ${
                            paymentMethod === "Cash walk in"
                                ? "border-blue-600 bg-blue-50/90 dark:bg-blue-950/70 text-blue-800 dark:text-blue-200 shadow-2xs"
                                : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700"
                        }`}
                    >
                        <Banknote className="size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                        <span>Cash</span>
                    </button>
                </div>
            )}

            <Button
                type="button"
                disabled={isFull || isPending}
                onClick={handleJoin}
                className={`w-full rounded-full text-xs font-semibold py-2.5 transition-all cursor-pointer ${
                    isFull
                        ? "bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
                }`}
            >
                {isFull ? (
                    <span>Session Full</span>
                ) : isPending ? (
                    <span>Reserving Spot…</span>
                ) : (
                    <span className="inline-flex items-center gap-1.5 tabular-nums">
                        Join for ₱{pricePerPlayer} ({paymentMethod === "GCash QR" ? "GCash" : "Cash"})
                        <ArrowRight className="size-3.5" />
                    </span>
                )}
            </Button>

            {error && (
                <p className="text-xs font-medium text-red-600 dark:text-red-400 text-center">
                    {error}
                </p>
            )}
        </div>
    );
}
