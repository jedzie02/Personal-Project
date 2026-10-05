import { getDashboardStats } from "@/lib/services/dashboard.service";
import { getTodaysBookings } from "@/lib/services/booking.service";
import { BookingsTable } from "@/components/ui/admin/bookingstable";

/**
 * This REPLACES the placeholder AdminDashboardPage from Phase 3 —
 * same file, same route (/admin), now backed by real data instead
 * of a static "coming later" message.
 */
export default async function AdminDashboardPage() {
    const [stats, todaysBookings] = await Promise.all([
        getDashboardStats(),
        getTodaysBookings(),
    ]);

    return (
        <div className="flex flex-col gap-8">
            <div>
                <h1 className="text-2xl font-semibold">Dashboard</h1>
                <p className="text-muted-foreground">Today at a glance.</p>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <StatCard label="Today's bookings" value={stats.todaysBookingsCount} />
                <StatCard label="Today's revenue" value={`$${stats.todaysRevenue.toFixed(2)}`} />
                <StatCard label="Upcoming bookings" value={stats.upcomingBookingsCount} />
                <StatCard label="Active courts" value={stats.activeCourtsCount} />
            </div>

            <div>
                <h2 className="text-lg font-medium">Today's bookings</h2>
                <div className="mt-3">
                    {/* Same BookingsTable component from Phase 5's admin bookings
              page — reused here as-is, no changes needed to it. */}
                    <BookingsTable bookings={todaysBookings} />
                </div>
            </div>
        </div>
    );
}

// Small, local, not exported — only used on this one page, so it
// doesn't need to be its own file in components/.
function StatCard({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-1 text-2xl font-semibold">{value}</p>
        </div>
    );
}