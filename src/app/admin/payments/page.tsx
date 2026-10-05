import { getAllPayments } from "@/lib/services/payment.service";
import type { Payment } from "@/lib/types/domain";

const STATUS_STYLES: Record<Payment["status"], string> = {
    pending: "bg-yellow-50 text-yellow-700",
    succeeded: "bg-green-50 text-green-700",
    failed: "bg-red-50 text-red-700",
    refunded: "bg-gray-100 text-gray-600",
};

export default async function AdminPaymentsPage() {
    const payments = await getAllPayments();

    return (
        <div>
            <h1 className="text-2xl font-semibold">Payments</h1>
            <p className="text-muted-foreground">
                Every payment attempt across all bookings. Refunds aren&apos;t handled
                in-app yet — per the SRS, those go through the Stripe dashboard
                directly for now.
            </p>

            <table className="mt-6 w-full text-sm">
                <thead>
                    <tr className="border-b text-left text-muted-foreground">
                        <th className="py-2">Date</th>
                        <th className="py-2">Court</th>
                        <th className="py-2">Customer</th>
                        <th className="py-2">Amount</th>
                        <th className="py-2">Status</th>
                    </tr>
                </thead>
                <tbody>
                    {payments.map((payment) => (
                        <tr key={payment.id} className="border-b">
                            <td className="py-2">{payment.bookingDate}</td>
                            <td className="py-2">{payment.courtName}</td>
                            <td className="py-2">
                                <div>{payment.customerName ?? "—"}</div>
                                <div className="text-xs text-muted-foreground">{payment.customerEmail}</div>
                            </td>
                            <td className="py-2">
                                ${payment.amount.toFixed(2)} {payment.currency.toUpperCase()}
                            </td>
                            <td className="py-2">
                                <span className={`rounded-full px-2 py-0.5 ${STATUS_STYLES[payment.status]}`}>
                                    {payment.status}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}