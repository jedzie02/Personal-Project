"use server";

import { revalidatePath } from "next/cache";
import { updateOperatingHoursForDay } from "@/lib/services/schedule.service";
import { requireAdmin } from "@/lib/services/auth.server";

/**
 * The schedule form submits all 7 days in ONE request, with fields
 * named like "open-0", "close-0", "closed-0" for Sunday, "open-1"
 * for Monday, and so on. This action loops 0 through 6 and pulls
 * each day's values out of that single FormData.
 */
export async function updateScheduleAction(
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();
    const updates = Array.from({ length: 7 }, (_, dayOfWeek) => {
      const isClosed =
        formData.get(`closed-${dayOfWeek}`) === "on" ||
        formData.get(`closed-${dayOfWeek}`) === "true";
      const openTime = formData.get(`open-${dayOfWeek}`) as string;
      const closeTime = formData.get(`close-${dayOfWeek}`) as string;

      return updateOperatingHoursForDay(dayOfWeek, openTime, closeTime, isClosed);
    });

    const results = await Promise.all(updates);
    const failure = results.find((r) => !r.success);

    revalidatePath("/admin/schedule");
    revalidatePath("/");
    revalidatePath("/book");
    revalidatePath("/admin/bookings/new");

    if (failure) {
      return { success: false, error: failure.error || "Failed to update operating hours" };
    }

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "An unexpected error occurred";
    return { success: false, error: message };
  }
}
