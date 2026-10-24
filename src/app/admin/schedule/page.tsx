import { getAllCourts } from "@/lib/services/court.service";
import { getAllBookings } from "@/lib/services/booking.service";
import { ScheduleTimeline } from "@/components/admin/ScheduleTimeline";
import { getManilaNow } from "@/lib/utils/date";

export default async function AdminSchedulePage({
  searchParams,
}: {
  searchParams?: Promise<{ date?: string }>;
}) {
  const params = searchParams ? await searchParams : {};
  const today = getManilaNow().todayISO;
  const date = params?.date || today;

  const [courtsData, bookingsData] = await Promise.all([
    getAllCourts(),
    getAllBookings({ dateFrom: date, dateTo: date }),
  ]);

  // Master list of courts: sort naturally by court name so Court 1, Court 2, Court 3, Court 4 always render in exact order
  const courts = (
    courtsData.length > 0
      ? courtsData.map((c) => ({
          id: c.id,
          name: c.name,
          status: c.status,
        }))
      : [
          { id: "c1", name: "Court 1", status: "Available" },
          { id: "c2", name: "Court 2", status: "Available" },
          { id: "c3", name: "Court 3", status: "Available" },
          { id: "c4", name: "Court 4", status: "Available" },
        ]
  ).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

  const liveBookings = bookingsData.map((b) => ({
    courtId: b.courtId,
    startTime: b.startTime,
    endTime: b.endTime,
    status: b.status,
  }));

  return <ScheduleTimeline initialCourts={courts} initialBookings={liveBookings} />;
}