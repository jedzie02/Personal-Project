"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, QrCode } from "lucide-react";
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
    const [error, setError] = useState<string | null>(null);

    const isFull = spotsLeft <= 0;

    const handleJoin = () => {
        if (isFull || isPending) return;
        setError(null);

        startTransition(async () => {
            const res = await joinOpenPlayAction(sessionId, "GCash QR");
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
                    "Session Full"
                ) : isPending ? (
                    "Reserving Spot…"
                ) : (
                    <span className="flex items-center justify-center gap-1.5">
                        <QrCode className="size-3.5" />
                        <span>Join for ₱{pricePerPlayer} (GCash QR)</span>
                        <ArrowRight className="size-3.5" />
                    </span>
                )}
            </Button>

            {error && (
                <p className="text-xs text-rose-500 text-center font-medium mt-1">
                    {error}
                </p>
            )}
        </div>
    );
}
