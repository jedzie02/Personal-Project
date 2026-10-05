import Link from "next/link";
import { getAllBookings } from "@/lib/services/booking.service";
import { getAllCourts } from "@/lib/services/court.service";
import { BookingsTable } from "@/components/ui/admin/bookingstable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SearchParams {
    dateFrom?: string;
    dateTo?: string;
    courtId?: string;
    status?: string;
    customerSearch?: string;
}

export default async function AdminBookingsPage({
    searchParams,
}: {
    searchParams: Promise<SearchParams>;
}) {
    const filters = await searchParams;
    const [bookings, courts] = await Promise.all([
        getAllBookings({
            dateFrom: filters.dateFrom || undefined,
            dateTo: filters.dateTo || undefined,
            courtId: filters.courtId || undefined,
            status: (filters.status as never) || undefined,
            customerSearch: filters.customerSearch || undefined,
        }),
        getAllCourts(),
    ]);

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold">Bookings</h1>
                    <p className="text-muted-foreground">
                        Search, filter, and manage every booking at the venue.
                    </p>
                </div>
                <Link href="/admin/bookings/new">
                    <Button>New manual booking</Button>
                </Link>
            </div>

            {/* GET form: filter values live in the URL, so the list is
          bookmarkable/shareable and survives a page refresh. */}
            <form className="flex flex-wrap items-end gap-3 rounded-lg border p-4">
                <div className="flex flex-col gap-1">
                    <label className="text-xs text-muted-foreground">From</label>
                    <Input type="date" name="dateFrom" defaultValue={filters.dateFrom} />
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-xs text-muted-foreground">To</label>
                    <Input type="date" name="dateTo" defaultValue={filters.dateTo} />
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-xs text-muted-foreground">Court</label>
                    <select
                        name="courtId"
                        defaultValue={filters.courtId ?? ""}
                        className="rounded-md border px-3 py-2 text-sm"
                    >
                        <option value="">All courts</option>
                        {courts.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.name}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-xs text-muted-foreground">Status</label>
                    <select
                        name="status"
                        defaultValue={filters.status ?? ""}
                        className="rounded-md border px-3 py-2 text-sm"
                    >
                        <option value="">All statuses</option>
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="completed">Completed</option>
                    </select>
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-xs text-muted-foreground">Customer</label>
                    <Input
                        name="customerSearch"
                        placeholder="Name or email"
                        defaultValue={filters.customerSearch}
                    />
                </div>
                <Button type="submit" variant="outline">
                    Apply filters
                </Button>
            </form>

            <BookingsTable bookings={bookings} />
        </div>
    );
}