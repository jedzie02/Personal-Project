import { redirect } from "next/navigation";
import { getCourtById } from "@/lib/services/court.service";
import { getCurrentProfile } from "@/lib/services/auth.server";
import { confirmBookingAction } from "@/app/book/actions";
import { formatTime } from "@/lib/utils/date";
import { PRICE_PER_HOUR } from "@/lib/config/booking-rules";
import { Button } from "@/components/ui/button";

function hoursBetween(start: string, end: string): number {
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    return (eh * 60 + em - (sh * 60 + sm)) / 60;
}

export default async function BookReviewPage({
    searchParams,
}: {
    searchParams: Promise<{ date?: string; start?: string; end?: string; courtId?: string }>;
}) {
    const { date, start, end, courtId } = await searchParams;

    if (!date || !start || !end || !courtId) {
        redirect("/book");
    }

    // AR-4: browsing is open to everyone, but this is the point where
    // we actually require login — right before committing to a slot.
    // redirectTo sends them straight back here after they log in,
    // instead of losing their selection.
    const profile = await getCurrentProfile();
    if (!profile) {
        const returnUrl = `/book/review?date=${date}&start=${start}&end=${end}&courtId=${courtId}`;
        redirect(
            `/auth/login?message=${encodeURIComponent("Log in to finish booking your court")}&redirectTo=${encodeURIComponent(returnUrl)}`
        );
    }

    const court = await getCourtById(courtId);
    if (!court) {
        redirect("/book");
    }

    const hours = hoursBetween(start, end);
    const hourlyRate = court.hourlyRate ?? PRICE_PER_HOUR;
    const totalPrice = hours * hourlyRate;

    return (
        <div className="mx-auto max-w-md px-4 py-10">
            <h1 className="text-2xl font-semibold">Review your booking</h1>

            <div className="mt-6 flex flex-col gap-2 rounded-lg border p-4 text-sm">
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Court</span>
                    <span>{court!.name}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Date</span>
                    <span>{date}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Time</span>
                    <span>
                        {formatTime(start)} – {formatTime(end)}
                    </span>
                </div>
                <div className="flex justify-between border-t pt-2 font-medium">
                    <span>Total</span>
                    <span>₱{totalPrice.toFixed(2)}</span>
                </div>
            </div>

            <form action={confirmBookingAction.bind(null, null)} className="mt-6">
                <input type="hidden" name="courtId" value={courtId} />
                <input type="hidden" name="date" value={date} />
                <input type="hidden" name="start" value={start} />
                <input type="hidden" name="end" value={end} />
                <input type="hidden" name="totalPrice" value={totalPrice} />
                <Button type="submit" className="w-full">
                    Confirm booking
                </Button>
            </form>
            <p className="mt-2 text-xs text-muted-foreground">
                Payment is collected at the venue. Confirming reserves your slot.
            </p>
        </div>
    );
}