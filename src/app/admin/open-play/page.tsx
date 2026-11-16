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
        <OpenPlayAdmin
            sessions={sessions}
            courts={courts}
            todayISO={todayISO}
        />
    );
}

