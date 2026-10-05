import Link from "next/link";
import { getAllCustomersWithBookingCounts } from "@/lib/services/customer.service";

export default async function AdminCustomersPage() {
    const customers = await getAllCustomersWithBookingCounts();

    return (
        <div>
            <h1 className="text-2xl font-semibold">Customers</h1>
            <p className="text-muted-foreground">{customers.length} registered customers.</p>

            <table className="mt-6 w-full max-w-2xl text-sm">
                <thead>
                    <tr className="border-b text-left text-muted-foreground">
                        <th className="py-2">Name</th>
                        <th className="py-2">Email</th>
                        <th className="py-2">Bookings</th>
                    </tr>
                </thead>
                <tbody>
                    {customers.map((customer) => (
                        <tr key={customer.id} className="border-b">
                            <td className="py-2">
                                <Link href={`/admin/customers/${customer.id}`} className="underline">
                                    {customer.fullName ?? "—"}
                                </Link>
                            </td>
                            <td className="py-2 text-muted-foreground">{customer.email}</td>
                            <td className="py-2">{customer.bookingCount}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}