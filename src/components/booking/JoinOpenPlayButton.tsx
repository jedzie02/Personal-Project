"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { joinOpenPlayAction } from "@/app/open-play/actions";

export default function JoinOpenPlayButton({
    sessionId,
    spotsLeft,
    pricePerPlayer: _pricePerPlayer,
}: {
    sessionId: string;
    spotsLeft: number;
    pricePerPlayer?: number;
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
        <div className="space-y-1.5">
            <Button
                type="button"
                disabled={isFull || isPending}
                onClick={handleJoin}
                className={`w-full h-9 rounded-full text-xs font-semibold px-4 transition-all cursor-pointer ${
                    isFull
                        ? "bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
                }`}
            >
                {isFull ? (
                    "Session Full"
                ) : isPending ? (
                    <span className="inline-flex items-center justify-center gap-1.5">
                        <Loader2 className="size-3.5 animate-spin shrink-0" />
                        <span>Reserving…</span>
                    </span>
                ) : (
                    <span className="inline-flex items-center justify-center gap-1.5">
                        <span>Join Session</span>
                        <ArrowRight className="size-3.5 shrink-0" />
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
