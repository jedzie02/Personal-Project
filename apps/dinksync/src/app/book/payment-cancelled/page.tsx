import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function PaymentCancelledPage() {
    return (
        <div className="mx-auto max-w-md px-4 py-10 text-center">
            <h1 className="text-2xl font-semibold">Payment cancelled</h1>
            <p className="mt-2 text-muted-foreground">
                No charge was made. Your booking is still on file as pending — we
                don&apos;t yet have a &quot;retry payment&quot; button for it (that&apos;s
                planned for a later phase), so for now the simplest option is to start
                a new booking.
            </p>
            <div className="mt-6 flex justify-center gap-3">
                <Link href="/bookings">
                    <Button variant="outline">My bookings</Button>
                </Link>
                <Link href="/book">
                    <Button>Back to booking</Button>
                </Link>
            </div>
        </div>
    );
}