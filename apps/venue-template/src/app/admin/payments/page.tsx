import { getAllPayments } from "@/lib/services/payment.service";
import { PaymentsLedger } from "./PaymentsLedger";

export const dynamic = "force-dynamic";

export default async function AdminPaymentsPage() {
    const payments = await getAllPayments();

    return (
        <div className="max-w-7xl mx-auto">
            <PaymentsLedger initialPayments={payments} />
        </div>
    );
}
