import Link from "next/link";
import { getAllCustomersWithBookingCounts } from "@/lib/services/customer.service";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Search, UserCircle } from "lucide-react";
import type { CustomerSummary } from "@/lib/types/domain";

// Dynamically derive membership tier from live booking count
function getMembershipTier(count: number): { label: string; cls: string } {
    if (count >= 20) return { label: "VIP Member",     cls: "bg-purple-100 text-purple-800 hover:bg-purple-100" };
    if (count >= 5)  return { label: "Regular Member", cls: "bg-blue-100 text-blue-800 hover:bg-blue-100"       };
    return              { label: "Guest",              cls: "bg-gray-100 text-gray-600 hover:bg-gray-100"       };
}

function getInitials(name: string | null): string {
    if (!name) return "?";
    return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

interface AdminCustomersPageProps {
    searchParams?: Promise<{ q?: string }>;
}

export default async function AdminCustomersPage({ searchParams }: AdminCustomersPageProps) {
    const params = await searchParams;
    const query = params?.q?.toLowerCase().trim() || "";

    const customers = await getAllCustomersWithBookingCounts();

    const filteredCustomers = query
        ? customers.filter(
              (c) =>
                  (c.fullName && c.fullName.toLowerCase().includes(query)) ||
                  (c.email && c.email.toLowerCase().includes(query))
          )
        : customers;

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Customers</h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        {customers.length} registered customer{customers.length !== 1 ? "s" : ""}.
                    </p>
                </div>
            </div>

            {/* Membership Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                    { label: "VIP Members",     count: customers.filter((c) => c.bookingCount >= 20).length, cls: "bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300" },
                    { label: "Regular Members", count: customers.filter((c) => c.bookingCount >= 5 && c.bookingCount < 20).length, cls: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300" },
                    { label: "Guests",          count: customers.filter((c) => c.bookingCount < 5).length,  cls: "bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-300"   },
                ].map(({ label, count, cls }) => (
                    <Card key={label} className="shadow-sm">
                        <CardContent className="py-4">
                            <p className="text-xs text-muted-foreground">{label}</p>
                            <p className={`text-2xl font-bold mt-0.5 ${cls}`}>{count}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Search bar */}
            <form method="GET" className="flex items-center gap-2 max-w-sm">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                        name="q"
                        defaultValue={query}
                        placeholder="Search by name or email..."
                        className="pl-9"
                    />
                </div>
                <Button type="submit" variant="outline" size="sm">Search</Button>
                {query && (
                    <Link href="/admin/customers">
                        <Button type="button" variant="ghost" size="sm">
                            Clear
                        </Button>
                    </Link>
                )}
            </form>

            {/* Customer Table */}
            <Card className="shadow-sm">
                <CardHeader className="pb-2">
                    <p className="text-sm font-medium">
                        {query ? `Search results for "${query}" (${filteredCustomers.length})` : "All Customers"}
                    </p>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Customer</TableHead>
                                <TableHead>Membership</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead className="text-right">Bookings</TableHead>
                                <TableHead className="text-right">Lifetime Spend</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredCustomers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-32 text-center text-sm text-muted-foreground">
                                        {query ? `No customers match "${query}".` : "No registered customers found."}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredCustomers.map((customer) => {
                                    const tier  = getMembershipTier(customer.bookingCount);
                                    const spend = customer.totalSpend ?? 0;
                                    return (
                                        <TableRow key={customer.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                                                        {getInitials(customer.fullName)}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium leading-none">{customer.fullName ?? "—"}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className={tier.cls}>
                                                    {tier.label}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">{customer.email ?? "—"}</TableCell>
                                            <TableCell className="text-right font-medium">{customer.bookingCount}</TableCell>
                                            <TableCell className="text-right font-medium">₱{spend.toFixed(2)}</TableCell>
                                            <TableCell className="text-right">
                                                <Link
                                                    href={`/admin/customers/${customer.id}`}
                                                    className="text-sm font-medium text-primary underline underline-offset-4 hover:opacity-80"
                                                >
                                                    View
                                                </Link>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}