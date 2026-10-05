import { getActiveCourts } from "@/lib/services/court.service";
import { createBookingAction } from "@/app/admin/bookings/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default async function NewBookingPage({
    searchParams,
}: {
    searchParams: Promise<{ error?: string }>;
}) {
    const { error } = await searchParams;
    const courts = await getActiveCourts();

    return (
        <div className="max-w-md">
            <h1 className="text-2xl font-semibold">New manual booking</h1>
            <p className="text-muted-foreground">
                For walk-in or phone bookings. The customer must already have an
                account — enter the email they signed up with.
            </p>

            {error && (
                <p className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
                    {error}
                </p>
            )}

            <form action={createBookingAction} className="mt-6 flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                    <Label htmlFor="customerEmail">Customer email</Label>
                    <Input
                        id="customerEmail"
                        name="customerEmail"
                        type="email"
                        required
                    />
                </div>

                <div className="flex flex-col gap-1.5">
                    <Label htmlFor="courtId">Court</Label>
                    <select
                        id="courtId"
                        name="courtId"
                        required
                        className="rounded-md border px-3 py-2 text-sm"
                    >
                        {courts.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex flex-col gap-1.5">
                    <Label htmlFor="bookingDate">Date</Label>
                    <Input id="bookingDate" name="bookingDate" type="date" required />
                </div>

                <div className="flex gap-3">
                    <div className="flex flex-1 flex-col gap-1.5">
                        <Label htmlFor="startTime">Start</Label>
                        <Input id="startTime" name="startTime" type="time" required />
                    </div>
                    <div className="flex flex-1 flex-col gap-1.5">
                        <Label htmlFor="endTime">End</Label>
                        <Input id="endTime" name="endTime" type="time" required />
                    </div>
                </div>

                <div className="flex flex-col gap-1.5">
                    <Label htmlFor="totalPrice">Price</Label>
                    <Input
                        id="totalPrice"
                        name="totalPrice"
                        type="number"
                        step="0.01"
                        min="0"
                        required
                    />
                </div>

                <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="markAsConfirmed" />
                    Payment already handled (mark as confirmed instead of pending)
                </label>

                <Button type="submit" className="self-start">
                    Create booking
                </Button>
            </form>
        </div>
    );
}