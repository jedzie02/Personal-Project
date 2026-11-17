import { getGCashSettings } from "@/lib/services/settings.service";
import { SettingsForm } from "./SettingsForm";
import { Settings } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
    const settings = await getGCashSettings();

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-slate-900 dark:text-white">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shadow-2xs">
                        <Settings className="size-5" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                    Manage payment credentials, merchant accounts, and public display preferences.
                </p>
            </div>

            <SettingsForm
                initialNumber={settings.gcash_number || "0917-123-4567"}
                initialName={settings.gcash_name || "PICKLE CLUB INC / J*** D."}
                initialQrUrl={settings.gcash_qr_url || "/gcash-qr.jpg"}
            />
        </div>
    );
}

