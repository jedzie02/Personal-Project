import DateSelector from "@/components/booking/DateSelector";
import BookingGrid from "@/components/booking/BookingGrid";
import { getBookingGridForDate } from "@/lib/services/booking-grid.service";

function todayISO() {
    const d = new Date();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${d.getFullYear()}-${m}-${day}`;
}

export default async function BookPage({ searchParams }: { searchParams: { date?: string; error?: string } }) {
    const params = await searchParams;
    const date = params?.date || todayISO();
    const error = params?.error;

    const gridData = await getBookingGridForDate(date);

    return (
        <div className="min-h-screen bg-white text-gray-900">
            <div className="mx-auto max-w-6xl px-4 pt-6 pb-10">
                <div className="mb-6 flex items-center justify-between">
                    <h1 className="text-xl font-bold tracking-tight">Book a Court</h1>
                    <a href="/" className="text-sm text-gray-500 transition-colors hover:text-gray-900">
                        ← Back to home
                    </a>
                </div>

                <div className="space-y-4">
                    <DateSelector selectedDate={date} />
                    {error && (
                        <div className="rounded-lg border border-white-200 bg-white-50 px-4 py-3 text-sm text-white-700">
                            {error}
                        </div>
                    )}

                    {gridData ? (
                        <BookingGrid data={gridData} />
                    ) : (
                        <div className="rounded-xl border border-gray-200 bg-gray-50 p-12 text-center">
                            <p className="text-lg text-gray-500">The venue is closed on this date.</p>
                            <p className="mt-2 text-sm text-gray-400">
                                Please select a different day to view availability.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}