"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
    createCourt,
    getFutureActiveBookingsCountForCourt,
    setCourtActiveStatus,
    updateCourt,
} from "@/lib/services/court.service";

/**
 * revalidatePath() tells Next.js "the cached data behind this URL
 * is now stale, throw it away." Server Components can be cached for
 * performance — without calling this after a create/update/deactivate,
 * the admin could submit the form and still see the OLD list of
 * courts, because Next.js would serve a cached version of the page.
 */

export async function createCourtAction(formData: FormData) {
    const name = formData.get("name") as string;
    const description = (formData.get("description") as string) || null;

    const result = await createCourt(name, description);

    if (!result.success) {
        redirect(`/admin/courts?error=${encodeURIComponent(result.error ?? "Could not create court")}`);
    }

    revalidatePath("/admin/courts");
    redirect("/admin/courts");
}

export async function updateCourtAction(courtId: string, formData: FormData) {
    const name = formData.get("name") as string;
    const description = (formData.get("description") as string) || null;

    const result = await updateCourt(courtId, name, description);

    if (!result.success) {
        redirect(
            `/admin/courts/${courtId}/edit?error=${encodeURIComponent(result.error ?? "Could not update court")}`
        );
    }

    revalidatePath("/admin/courts");
    redirect("/admin/courts");
}

export async function setCourtActiveStatusAction(
    courtId: string,
    isActive: boolean,
    formData: FormData
) {
    // "confirmed" only shows up in formData when it came from the
    // SECOND button ("Confirm deactivate anyway") — the normal button
    // doesn't include this hidden field at all, so it reads as false.
    const confirmed = formData.get("confirmed") === "true";

    if (!isActive && !confirmed) {
        const futureBookingsCount = await getFutureActiveBookingsCountForCourt(courtId);

        if (futureBookingsCount > 0) {
            // Stop here — don't deactivate yet. Redirecting with these two
            // query params is how we hand the warning off to the page,
            // which will show a banner and a "confirm anyway" button for
            // this specific court.
            redirect(
                `/admin/courts?warnCourtId=${courtId}&warnCount=${futureBookingsCount}`
            );
        }
    }

    await setCourtActiveStatus(courtId, isActive);
    revalidatePath("/admin/courts");
}