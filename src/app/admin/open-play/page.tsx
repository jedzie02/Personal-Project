import { requireAdmin } from "@/lib/services/auth.server";
import { getActiveCourts } from "@/lib/services/court.service";
import { listSessionsForAdmin } from "@/lib/services/open-play.service";
import { getManilaNow } from "@/lib/utils/date";
import OpenPlayAdmin from "./OpenPlayAdmin";

export const dynamic = "force-dynamic";

export default async function AdminOpenPlayPage() {
    await requireAdmin();

    const [sessions, activeCourts] = await Promise.all([
        listSessionsForAdmin(),
        getActiveCourts(),
    ]);

    const { todayISO } = getManilaNow();

    const courts = activeCourts
        .map((c) => ({
            id: c.id,
            name: c.name,
        }))
        .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                    Open Play Sessions
                </h1>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                    Schedule venue-hosted Open Play sessions, verify GCash &amp; Cash registrations, and manage session capacity.
                </p>
            </div>

            <OpenPlayAdmin
                sessions={sessions}
                courts={courts}
                todayISO={todayISO}
            />
        </div>
    );
}

