import { getAllCourts } from "@/lib/services/court.service";
import { getAllBookings } from "@/lib/services/booking.service";
import { getOperatingHours } from "@/lib/services/schedule.service";
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

  const [courtsData, bookingsData, operatingHoursData] = await Promise.all([
    getAllCourts(),
    getAllBookings({ dateFrom: date, dateTo: date }),
    getOperatingHours(),
  ]);

  // Master list of courts: sort naturally by court name so Court 1, Court 2, Court 3, Court 4 always render in exact order
  const courts = (
    courtsData.length > 0
      ? courtsData.map((c) => ({
          id: c.id,
          name: c.name,
          status: c.status,
          hourlyRate: c.hourlyRate,
        }))
      : [
          { id: "c1", name: "Court 1", status: "Available", hourlyRate: 300 },
          { id: "c2", name: "Court 2", status: "Available", hourlyRate: 300 },
          { id: "c3", name: "Court 3", status: "Available", hourlyRate: 300 },
          { id: "c4", name: "Court 4", status: "Available", hourlyRate: 300 },
        ]
  ).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

  // Filter out cancelled bookings so cancelled slots are immediately visible as available
  const activeBookings = bookingsData
    .filter((b) => b.status !== "cancelled")
    .map((b) => ({
      id: b.id,
      courtId: b.courtId,
      courtName: b.courtName,
      customerId: b.customerId,
      customerName: b.customerName || "Walk-in Player",
      customerEmail: b.customerEmail,
      bookingDate: b.bookingDate,
      startTime: b.startTime,
      endTime: b.endTime,
      status: b.status,
      paymentStatus: b.paymentStatus || "pending",
      paymentMethod: b.paymentMethod,
      paymentReference: b.paymentReference,
      totalPrice: b.totalPrice,
      createdAt: b.createdAt,
    }));

  return (
    <ScheduleTimeline
      selectedDate={date}
      todayDate={today}
      initialCourts={courts}
      initialBookings={activeBookings}
      initialOperatingHours={operatingHoursData}
    />
  );
}
