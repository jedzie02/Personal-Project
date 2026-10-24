import Link from "next/link";
import { notFound } from "next/navigation";
import { getCustomerProfile } from "@/lib/services/customer.service";
import { getBookingsForCustomer } from "@/lib/services/booking.service";
import { BookingsTable } from "@/components/ui/admin/bookingstable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Mail, Phone, Calendar, Trophy, Coins } from "lucide-react";

export default async function AdminCustomerDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    const [customer, bookings] = await Promise.all([
        getCustomerProfile(id),
        getBookingsForCustomer(id),
    ]);

    if (!customer) {
        notFound();
    }

    const totalSpend = bookings
        .filter((b) => b.paymentStatus === "succeeded")
        .reduce((sum, b) => sum + b.totalPrice, 0);

    const activeBookingsCount = bookings.filter(
        (b) => b.status === "confirmed" || b.status === "completed"
    ).length;

    const memberSince = customer.createdAt
        ? new Date(customer.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
          })
        : "N/A";

    return (
        <div className="flex flex-col gap-6">
            {/* Back link */}
            <div>
                <Link
                    href="/admin/customers"
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ArrowLeft className="size-4" /> Back to Customers
                </Link>
            </div>

            {/* Customer Header & Overview */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        {customer.fullName ?? customer.email}
                    </h1>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                            <Mail className="size-3.5" /> {customer.email}
                        </span>
                        <span className="flex items-center gap-1">
                            <Phone className="size-3.5" /> {customer.phone ?? "No phone on file"}
                        </span>
                        <span className="flex items-center gap-1">
                            <Calendar className="size-3.5" /> Member since {memberSince}
                        </span>
                    </div>
                </div>
            </div>

            {/* Quick Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Total Bookings
                        </CardTitle>
                        <div className="flex items-center justify-center size-8 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                            <Calendar className="size-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold tracking-tight tabular-nums">{bookings.length}</p>
                        <p className="text-xs text-muted-foreground mt-1">{activeBookingsCount} confirmed/completed</p>
                    </CardContent>
                </Card>

                <Card className="shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Lifetime Spend (₱)
                        </CardTitle>
                        <div className="flex items-center justify-center size-8 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                            <Coins className="size-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold tracking-tight tabular-nums">₱{totalSpend.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground mt-1">Paid reservations</p>
                    </CardContent>
                </Card>

                <Card className="shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Membership Tier
                        </CardTitle>
                        <div className="flex items-center justify-center size-8 rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400">
                            <Trophy className="size-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold tracking-tight">
                            {bookings.length >= 20 ? "VIP Member" : bookings.length >= 5 ? "Regular" : "Guest"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                            {bookings.length >= 20 ? "Top frequent player" : bookings.length >= 5 ? "Frequent player" : "Occasional player"}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Booking History Table */}
            <div className="space-y-3">
                <h2 className="text-lg font-semibold tracking-tight">Booking History</h2>
                <Card className="shadow-sm">
                    <CardContent className="p-0">
                        <BookingsTable bookings={bookings} />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}