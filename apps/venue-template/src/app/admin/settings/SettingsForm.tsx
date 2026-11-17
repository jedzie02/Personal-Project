"use client";

import { useState, useTransition, useRef } from "react";
import Image from "next/image";
import {
    QrCode,
    Smartphone,
    User,
    UploadCloud,
    Loader2,
    CheckCircle2,
    AlertCircle,
    Info,
    RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { saveGCashSettingsAction } from "./actions";

interface SettingsFormProps {
    initialNumber: string;
    initialName: string;
    initialQrUrl: string;
}

export function SettingsForm({
    initialNumber,
    initialName,
    initialQrUrl,
}: SettingsFormProps) {
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const [gcashNumber, setGcashNumber] = useState(initialNumber);
    const [gcashName, setGcashName] = useState(initialName);
    const [currentQrUrl, setCurrentQrUrl] = useState(initialQrUrl);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.type.startsWith("image/")) {
                setError("Please select an image file (PNG, JPG, or WebP).");
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                setError("Image file size should be less than 5MB.");
                return;
            }
            setError(null);
            const objectUrl = URL.createObjectURL(file);
            setPreviewUrl(objectUrl);
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        const form = e.currentTarget;
        const formData = new FormData(form);

        startTransition(async () => {
            const res = await saveGCashSettingsAction(formData);
            if (res.error) {
                setError(res.error);
            } else {
                setSuccess("GCash settings successfully updated! Players will immediately see these details.");
                if (previewUrl) {
                    setCurrentQrUrl(previewUrl);
                }
                if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                }
                setTimeout(() => setSuccess(null), 5000);
            }
        });
    };

    const activeDisplayImage = previewUrl || currentQrUrl;

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
                <div className="p-4 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-sm flex items-start gap-2.5 animate-in fade-in">
                    <AlertCircle className="size-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                </div>
            )}

            {success && (
                <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-sm flex items-start gap-2.5 animate-in fade-in">
                    <CheckCircle2 className="size-4 shrink-0 mt-0.5" />
                    <span>{success}</span>
                </div>
            )}

            <Card className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
                <CardHeader className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                        <QrCode className="size-5" />
                        <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">
                            GCash Payment Configuration
                        </CardTitle>
                    </div>
                    <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                        Configure the official GCash account and QR code displayed on the player reservation confirmation screen.
                    </CardDescription>
                </CardHeader>

                <CardContent className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                        {/* Text Fields */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                                    <Smartphone className="size-3.5 text-blue-600 dark:text-blue-400" />
                                    GCash Mobile Number
                                </label>
                                <input
                                    type="text"
                                    name="gcash_number"
                                    required
                                    value={gcashNumber}
                                    onChange={(e) => setGcashNumber(e.target.value)}
                                    placeholder="e.g. 0917-123-4567"
                                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm font-mono text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                />
                                <p className="text-[11px] text-slate-400 mt-1">
                                    Displayed on the customer&apos;s confirmation receipt with a one-click copy button.
                                </p>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                                    <User className="size-3.5 text-blue-600 dark:text-blue-400" />
                                    Account Name / Merchant Name
                                </label>
                                <input
                                    type="text"
                                    name="gcash_name"
                                    required
                                    value={gcashName}
                                    onChange={(e) => setGcashName(e.target.value)}
                                    placeholder="e.g. PICKLE CLUB INC / JUAN D."
                                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm font-semibold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                />
                                <p className="text-[11px] text-slate-400 mt-1">
                                    Customers verify this recipient name in the GCash app before sending payment.
                                </p>
                            </div>

                            <div className="rounded-xl border border-blue-100 dark:border-blue-900/40 bg-blue-50/60 dark:bg-blue-950/30 p-3.5 text-xs text-blue-900 dark:text-blue-200 flex items-start gap-2.5">
                                <Info className="size-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                                <p className="leading-relaxed text-[11px]">
                                    Changes are instant. When a player books a court with <strong>GCash QR</strong>, they will immediately be presented with this QR image and account number.
                                </p>
                            </div>
                        </div>

                        {/* QR Code Upload & Preview */}
                        <div className="space-y-3">
                            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                                <QrCode className="size-3.5 text-blue-600 dark:text-blue-400" />
                                GCash Standee / QR Code Image
                            </label>

                            <div className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                                {activeDisplayImage ? (
                                    <div className="relative size-48 sm:size-52 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-white shadow-xs mb-3">
                                        <Image
                                            src={activeDisplayImage}
                                            alt="GCash QR Code Standee"
                                            fill
                                            className="object-contain p-2"
                                            unoptimized
                                        />
                                    </div>
                                ) : (
                                    <div className="size-48 sm:size-52 flex flex-col items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 mb-3 text-center p-4">
                                        <QrCode className="size-10 mb-2 opacity-50" />
                                        <span className="text-xs font-medium">No QR Image Uploaded</span>
                                    </div>
                                )}

                                <div className="w-full flex flex-col items-center gap-2">
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        name="qr_file"
                                        id="qr_file"
                                        accept="image/png,image/jpeg,image/webp"
                                        onChange={handleFileChange}
                                        className="hidden"
                                    />
                                    <label
                                        htmlFor="qr_file"
                                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold cursor-pointer shadow-2xs transition-colors"
                                    >
                                        <UploadCloud className="size-3.5 text-blue-600 dark:text-blue-400" />
                                        {previewUrl ? "Change Selected Image" : "Upload New QR Image"}
                                    </label>
                                    <span className="text-[10px] text-slate-400">
                                        PNG, JPG, or WebP up to 5MB.
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end">
                        <Button
                            type="submit"
                            disabled={isPending}
                            className="rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold text-xs px-6 py-2.5 h-auto cursor-pointer shadow-xs transition-all disabled:opacity-70 flex items-center gap-2"
                        >
                            {isPending ? (
                                <>
                                    <Loader2 className="size-3.5 animate-spin" />
                                    Saving Settings…
                                </>
                            ) : (
                                <>
                                    <RefreshCw className="size-3.5" />
                                    Save GCash Details
                                </>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </form>
    );
}

