"use client";

import { useState } from "react";
import Image from "next/image";
import {
    Copy,
    Check,
    QrCode,
    ShieldCheck,
    AlertCircle,
    Info,
    ArrowUpRight,
    Loader2,
    Hash,
    Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { submitPaymentReferenceAction } from "@/app/book/confirmation/actions";

interface GCashPaymentCardProps {
    bookingId: string;
    totalPrice: number;
    initialReference?: string | null;
}

export function GCashPaymentCard({
    bookingId,
    totalPrice,
    initialReference,
}: GCashPaymentCardProps) {
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [reference, setReference] = useState(initialReference || "");
    const [savedReference, setSavedReference] = useState(initialReference || "");
    const [isEditing, setIsEditing] = useState(!initialReference);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const bookingRef = `#${bookingId.slice(0, 8).toUpperCase()}`;
    const gcashNumber = "0917-123-4567";
    const gcashName = "PICKLE CLUB INC / J*** D.";
    const formattedAmount = `₱${totalPrice.toFixed(2)}`;

    const copyToClipboard = (text: string, fieldName: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(fieldName);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);
        setSuccessMessage(null);

        const formData = new FormData(e.currentTarget);
        const res = await submitPaymentReferenceAction(bookingId, formData);

        setIsSubmitting(false);
        if (res.success) {
            const cleanRef = ((formData.get("referenceNo") as string) || "").replace(/[\s-]/g, "");
            setSavedReference(cleanRef);
            setReference(cleanRef);
            setIsEditing(false);
            setSuccessMessage("Reference number recorded! Front desk can verify in 2 seconds.");
            setTimeout(() => setSuccessMessage(null), 4000);
        } else {
            setError(res.error || "Failed to save reference number.");
        }
    };

    return (
        <div className="space-y-4 rounded-2xl border border-blue-200/80 bg-gradient-to-b from-blue-50/50 to-white p-5 shadow-xs">
            {/* Header Badge */}
            <div className="flex items-center justify-between border-b border-blue-100 pb-3.5">
                <div className="flex items-center gap-2">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-xs">
                        <QrCode className="size-4" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-slate-900">GCash QR Payment</h3>
                        <p className="text-[11px] text-slate-500">Scan or send directly via GCash app</p>
                    </div>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-[11px] font-semibold text-blue-800">
                    <ShieldCheck className="size-3 text-blue-600" />
                    Verified Merchant
                </span>
            </div>

            {/* QR Image + Account Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                {/* QR Code Graphic Standee */}
                <div className="relative mx-auto flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
                    <div className="relative size-44 sm:size-48 overflow-hidden rounded-lg bg-slate-50 border border-slate-100">
                        <Image
                            src="/gcash-qr.jpg"
                            alt="GCash QR Code - Scan to Pay"
                            fill
                            className="object-contain"
                            priority
                        />
                    </div>
                    <span className="mt-2 text-[10px] font-medium text-slate-500 flex items-center gap-1">
                        <Sparkles className="size-3 text-blue-600" /> Long-press or screenshot to scan
                    </span>
                </div>

                {/* Account Details & Prompt */}
                <div className="space-y-2.5 text-xs">
                    {/* GCash Name */}
                    <div className="rounded-xl border border-slate-200/80 bg-white p-2.5 shadow-2xs">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                            GCash Name
                        </span>
                        <div className="text-sm font-bold text-slate-900 mt-0.5">
                            {gcashName}
                        </div>
                    </div>

                    {/* GCash Number with Copy */}
                    <div className="rounded-xl border border-slate-200/80 bg-white p-2.5 shadow-2xs flex items-center justify-between">
                        <div>
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                                GCash Number
                            </span>
                            <div className="text-sm font-bold font-mono text-blue-700 tracking-wide mt-0.5">
                                {gcashNumber}
                            </div>
                        </div>
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(gcashNumber.replace(/-/g, ""), "number")}
                            className="h-8 gap-1 rounded-lg border-slate-200 text-slate-700 hover:bg-blue-50 hover:text-blue-700 text-xs cursor-pointer font-medium"
                        >
                            {copiedField === "number" ? (
                                <>
                                    <Check className="size-3 text-emerald-600" /> Copied!
                                </>
                            ) : (
                                <>
                                    <Copy className="size-3" /> Copy
                                </>
                            )}
                        </Button>
                    </div>

                    {/* Exact Amount with Copy */}
                    <div className="rounded-xl border border-slate-200/80 bg-white p-2.5 shadow-2xs flex items-center justify-between">
                        <div>
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                                Exact Amount
                            </span>
                            <div className="text-sm font-bold text-slate-900 tabular-nums mt-0.5">
                                {formattedAmount}
                            </div>
                        </div>
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(totalPrice.toFixed(2), "amount")}
                            className="h-8 gap-1 rounded-lg border-slate-200 text-slate-700 hover:bg-blue-50 hover:text-blue-700 text-xs cursor-pointer font-medium"
                        >
                            {copiedField === "amount" ? (
                                <>
                                    <Check className="size-3 text-emerald-600" /> Copied!
                                </>
                            ) : (
                                <>
                                    <Copy className="size-3" /> Copy
                                </>
                            )}
                        </Button>
                    </div>

                    {/* Prompt with Booking Ref */}
                    <div className="rounded-xl border border-blue-200/80 bg-blue-50/70 p-2.5 text-blue-950 flex items-start justify-between gap-2">
                        <div className="space-y-0.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">
                                Payment Note Prompt
                            </span>
                            <p className="text-[11px] leading-snug">
                                Put your Booking Ref <strong className="font-mono text-blue-900">{bookingRef}</strong> in the GCash message note.
                            </p>
                        </div>
                        <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(bookingRef, "ref")}
                            className="h-7 px-2 shrink-0 text-blue-700 hover:bg-blue-100/80 text-[11px] cursor-pointer"
                        >
                            {copiedField === "ref" ? (
                                <Check className="size-3 text-emerald-600" />
                            ) : (
                                <Copy className="size-3" />
                            )}
                        </Button>
                    </div>
                </div>
            </div>

            {/* 13-Digit Reference Number Capture */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                        <Hash className="size-3.5 text-blue-600" />
                        GCash Reference Number
                    </span>
                    {savedReference && !isEditing && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200/60">
                            Awaiting Counter Verification
                        </span>
                    )}
                </div>

                {savedReference && !isEditing ? (
                    <div className="space-y-2">
                        <div className="flex items-center justify-between rounded-lg bg-slate-50 border border-slate-200/80 p-3">
                            <div>
                                <span className="text-[10px] uppercase font-semibold text-slate-400">
                                    Submitted Reference
                                </span>
                                <div className="text-sm font-bold font-mono text-slate-800 tracking-wider">
                                    {savedReference}
                                </div>
                            </div>
                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => setIsEditing(true)}
                                className="h-7 text-xs border-slate-200 text-slate-600 hover:text-slate-900 cursor-pointer"
                            >
                                Edit Reference
                            </Button>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-relaxed">
                            ✓ Your reference is tagged to this reservation. Front-desk staff can instantly verify your booking when you arrive.
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleFormSubmit} className="space-y-2.5">
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                            <div className="relative flex-1">
                                <input
                                    type="text"
                                    name="referenceNo"
                                    value={reference}
                                    onChange={(e) => setReference(e.target.value)}
                                    placeholder="Enter 13-digit reference (e.g. 1029 3847 5610 2)"
                                    required
                                    className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-mono text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                                />
                            </div>
                            <Button
                                type="submit"
                                disabled={isSubmitting || !reference.trim()}
                                className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 cursor-pointer disabled:opacity-60 flex items-center justify-center gap-1.5"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="size-3 animate-spin" /> Saving…
                                    </>
                                ) : (
                                    <>
                                        Submit Reference
                                    </>
                                )}
                            </Button>
                        </div>

                        {error && (
                            <div className="flex items-center gap-1.5 text-xs text-red-600">
                                <AlertCircle className="size-3.5 shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        {successMessage && (
                            <div className="flex items-center gap-1.5 text-xs text-emerald-600">
                                <Check className="size-3.5 shrink-0" />
                                <span>{successMessage}</span>
                            </div>
                        )}

                        <p className="text-[11px] text-slate-400">
                            You can find the 13-digit reference number on your GCash transaction receipt or SMS confirmation.
                        </p>
                    </form>
                )}
            </div>

            {/* Desk Verification Strategy Note */}
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-3 text-[11px] text-slate-600 flex items-start gap-2">
                <Info className="size-4 text-blue-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                    <strong>Desk Verification:</strong> Your court slot is securely locked in. Payment status remains <span className="text-amber-800 font-semibold">pending</span> until venue staff checks your GCash receipt at the front desk or marks it paid on the system.
                </p>
            </div>
        </div>
    );
}
