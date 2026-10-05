import { getOperatingHours } from "@/lib/services/schedule.service";
import { updateScheduleAction } from "@/app/admin/schedule/actions";
import { DAY_LABELS } from "@/lib/utils/date";
import { Button } from "@/components/ui/button";

export default async function AdminSchedulePage() {
    const hours = await getOperatingHours();

    return (
        <div className="max-w-2xl">
            <h1 className="text-2xl font-semibold">Operating Hours</h1>
            <p className="text-muted-foreground">
                Set when the venue is open. These hours control what time slots
                customers can ever book, once booking is wired up.
            </p>

            <form action={updateScheduleAction} className="mt-6 flex flex-col gap-4">
                {hours.map((day) => (
                    <div
                        key={day.dayOfWeek}
                        className="flex items-center gap-4 rounded-lg border p-3"
                    >
                        <span className="w-24 shrink-0 font-medium">
                            {DAY_LABELS[day.dayOfWeek]}
                        </span>

                        <label className="flex items-center gap-2 text-sm text-muted-foreground">
                            <input
                                type="checkbox"
                                name={`closed-${day.dayOfWeek}`}
                                defaultChecked={day.isClosed}
                            />
                            Closed
                        </label>

                        <input
                            type="time"
                            name={`open-${day.dayOfWeek}`}
                            defaultValue={day.openTime ?? "09:00"}
                            className="rounded-md border px-2 py-1 text-sm"
                        />
                        <span className="text-muted-foreground">to</span>
                        <input
                            type="time"
                            name={`close-${day.dayOfWeek}`}
                            defaultValue={day.closeTime ?? "21:00"}
                            className="rounded-md border px-2 py-1 text-sm"
                        />
                    </div>
                ))}

                <Button type="submit" className="mt-2 self-start">
                    Save schedule
                </Button>
            </form>
        </div>
    );
}