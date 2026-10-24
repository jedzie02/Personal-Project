import {
    getDashboardStats,
    getUpcomingReservations,
    getLiveSystemAlerts,
} from "@/lib/services/dashboard.service";
import { getTodaysBookings } from "@/lib/services/booking.service";
import { BookingsTable } from "@/components/ui/admin/bookingstable";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    CalendarCheck,
    Coins,
    Trophy,
    Clock,
    AlertTriangle,
    Info,
    CheckCircle2,
    Banknote,
    CreditCard,
} from "lucide-react";

const STATUS_STYLES: Record<string, string> = {
    confirmed: "bg-green-100 text-green-800 hover:bg-green-100",
    pending:   "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
    cancelled: "bg-gray-100 text-gray-600 hover:bg-gray-100",
};

const PAYMENT_BADGES: Record<string, { label: string; cls: string }> = {
    succeeded_card: { label: "Paid (Card)", cls: "bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100" },
    succeeded_cash: { label: "Paid (Cash)", cls: "bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100" },
    pending_cash:   { label: "Pay at Desk", cls: "bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100" },
    pending_card:   { label: "Awaiting Card", cls: "bg-sky-100 text-sky-800 border-sky-200 hover:bg-sky-100" },
};

const ALERT_STYLES: Record<string, { cls: string; Icon: React.ElementType }> = {
    warning: { cls: "border-yellow-200 bg-yellow-50 text-yellow-800", Icon: AlertTriangle },
    info:    { cls: "border-blue-200 bg-blue-50 text-blue-800",       Icon: Info           },
    success: { cls: "border-green-200 bg-green-50 text-green-800",    Icon: CheckCircle2   },
};

const SAFE_DEFAULTS = {
    todaysBookingsCount: 0,
    todaysRevenue: 0,
    todaysUncollected: 0,
    activeCourtsCount: 0,
    upcomingBookingsCount: 0,
};

export default async function AdminDashboardPage() {
    const [statsResult, todaysBookings, upcomingReservations, systemAlerts] = await Promise.all([
        getDashboardStats().catch(() => SAFE_DEFAULTS),
        getTodaysBookings().catch(() => []),
        getUpcomingReservations(5).catch(() => []),
        getLiveSystemAlerts().catch(() => []),
    ]);

    const stats = statsResult;

    const kpiCards = [
        {
            label: "Today's Bookings",
            value: stats.todaysBookingsCount,
            icon: CalendarCheck,
            sub: "Total scheduled",
        },
        {
            label: "Collected Today (₱)",
            value: `₱${stats.todaysRevenue.toFixed(2)}`,
            icon: Coins,
            sub: "Realized revenue",
        },
        {
            label: "Pay at Desk (₱)",
            value: `₱${(stats.todaysUncollected ?? 0).toFixed(2)}`,
            icon: Banknote,
            sub: "Uncollected cash",
            highlight: (stats.todaysUncollected ?? 0) > 0,
        },
        {
            label: "Active Courts",
            value: stats.activeCourtsCount,
            icon: Trophy,
            sub: "Ready for play",
        },
        {
            label: "Upcoming Bookings",
            value: stats.upcomingBookingsCount,
            icon: Clock,
            sub: "Future reservations",
        },
    ];

    return (
        <div className="flex flex-col gap-8">
            {/* Page heading */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-muted-foreground text-sm mt-1">
                    Welcome back — here&apos;s what&apos;s happening today.
                </p>
            </div>

            {/* Row 1 — KPI Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                {kpiCards.map(({ label, value, icon: Icon, sub, highlight }) => (
                    <Card
                        key={label}
                        className={`shadow-sm hover:shadow-md transition-shadow duration-200 ${
                            highlight ? "border-amber-300 dark:border-amber-800" : ""
                        }`}
                    >
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                {label}
                            </CardTitle>
                            <div className={`flex items-center justify-center size-8 rounded-lg ${
                                highlight ? "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400" : "bg-primary/10 text-primary"
                            }`}>
                                <Icon className="size-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold tracking-tight tabular-nums">{value}</p>
                            <p className="text-xs text-muted-foreground mt-1">{sub}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Row 2 — Upcoming Reservations + System Alerts */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

                {/* Upcoming Reservations — spans 2/3 */}
                <Card className="lg:col-span-2 shadow-sm">
                    <CardHeader>
                        <CardTitle>Upcoming Reservations</CardTitle>
                        <CardDescription>Next 5 reservations across all courts.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0 overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Court</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Time</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Payment</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {upcomingReservations.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-28 text-center text-sm text-muted-foreground">
                                            No upcoming reservations in the system.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    upcomingReservations.map((r) => {
                                        const paymentKey = `${r.paymentStatus ?? (r.status === "confirmed" ? "succeeded" : "pending")}_${r.paymentMethod ?? "card"}`;
                                        const badge = PAYMENT_BADGES[paymentKey] ?? PAYMENT_BADGES["succeeded_card"];

                                        return (
                                            <TableRow key={r.id}>
                                                <TableCell>
                                                    <p className="font-medium leading-none">{r.customer}</p>
                                                    <p className="text-xs text-muted-foreground mt-0.5">{r.email}</p>
                                                </TableCell>
                                                <TableCell>{r.court}</TableCell>
                                                <TableCell className="text-muted-foreground">{r.date}</TableCell>
                                                <TableCell className="text-muted-foreground">{r.time}</TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant="secondary"
                                                        className={STATUS_STYLES[r.status] ?? ""}
                                                    >
                                                        {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant="outline"
                                                        className={`text-xs font-medium border ${badge.cls}`}
                                                    >
                                                        {badge.label}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right font-medium">
                                                    ₱{r.amount.toFixed(2)}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* System Alerts — spans 1/3 */}
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle>System Alerts</CardTitle>
                        <CardDescription>Live operational notices.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-3">
                        {systemAlerts.length === 0 ? (
                            <p className="text-xs text-muted-foreground">No alerts at this time.</p>
                        ) : (
                            systemAlerts.map(({ id, level, message }) => {
                                const { cls, Icon } = ALERT_STYLES[level] ?? ALERT_STYLES.info;
                                return (
                                    <div
                                        key={id}
                                        className={`flex items-start gap-3 rounded-lg border p-3 text-sm ${cls}`}
                                    >
                                        <Icon className="size-4 mt-0.5 shrink-0" />
                                        <span>{message}</span>
                                    </div>
                                );
                            })
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Row 3 — Today's Bookings (live data) */}
            <div>
                <h2 className="text-lg font-semibold mb-3">Today&apos;s Bookings</h2>
                <Card className="shadow-sm">
                    <CardContent className="p-0">
                        <BookingsTable bookings={todaysBookings} />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}