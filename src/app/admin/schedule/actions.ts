"use server";

import { revalidatePath } from "next/cache";
import { updateOperatingHoursForDay } from "@/lib/services/schedule.service";

/**
 * The schedule form submits all 7 days in ONE request, with fields
 * named like "open-0", "close-0", "closed-0" for Sunday, "open-1"
 * for Monday, and so on. This action loops 0 through 6 and pulls
 * each day's values out of that single FormData.
 */
export async function updateScheduleAction(formData: FormData) {
    // Build one update "job" per day first, without running any of
    // them yet — just describing what needs to happen.
    const updates = Array.from({ length: 7 }, (_, dayOfWeek) => {
        const isClosed = formData.get(`closed-${dayOfWeek}`) === "on";
        const openTime = formData.get(`open-${dayOfWeek}`) as string;
        const closeTime = formData.get(`close-${dayOfWeek}`) as string;

        return updateOperatingHoursForDay(dayOfWeek, openTime, closeTime, isClosed);
    });

    // Promise.all runs all 7 updates CONCURRENTLY rather than one after
    // another. Since each day's row update doesn't depend on any other
    // day's result, there's no reason to make them wait in line — this
    // is faster than awaiting each update sequentially in a loop.
    await Promise.all(updates);

    revalidatePath("/admin/schedule");
}