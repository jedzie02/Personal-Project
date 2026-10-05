import { notFound } from "next/navigation";
import { getCustomerProfile } from "@/lib/services/customer.service";
import { getBookingsForCustomer } from "@/lib/services/booking.service";
import { BookingsTable } from "@/components/ui/admin/bookingstable";

export default async function AdminCustomerDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    const [customer, bookings] = await Promise.all([
        getCustomerProfile(id),
        // Same function the customer's own "My Bookings" page uses
        // (Phase 6) — an admin viewing someone's history and that
        // person viewing their own history are the same underlying
        // question, just asked from a different screen.
        getBookingsForCustomer(id),
    ]);

    if (!customer) {
        notFound();
    }

    return (
        <div>
            <h1 className="text-2xl font-semibold">{customer!.fullName ?? customer!.email}</h1>
            <p className="text-muted-foreground">
                {customer!.email} · {customer!.phone ?? "No phone on file"}
            </p>

            <h2 className="mt-8 text-lg font-medium">Booking history</h2>
            <div className="mt-3">
                <BookingsTable bookings={bookings} />
            </div>
        </div>
    );
}