"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
    createCourt,
    deleteCourt,
    getFutureActiveBookingsCountForCourt,
    setCourtActiveStatus,
    updateCourt,
} from "@/lib/services/court.service";
import { requireAdmin } from "@/lib/services/auth.server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { CourtStatus } from "@/lib/types/domain";

function toDbStatus(status: CourtStatus): "Active" | "Maintenance" | "Deactivated" {
    if (status === "Maintenance") return "Maintenance";
    if (status === "Not Available") return "Deactivated";
    return "Active";
}

function revalidateCourtPaths() {
    revalidatePath("/admin/courts");
    revalidatePath("/admin/schedule");
    revalidatePath("/book");
    revalidatePath("/");
}

export async function updateCourtStatusAction(
    courtId: string,
    status: CourtStatus
): Promise<{ success: boolean; error?: string }> {
    try {
        await requireAdmin();
        const supabase = createAdminClient();
        const isActive = status === "Available" || status === "Maintenance";
        const dbStatus = toDbStatus(status);

        let { error } = await supabase
            .from("courts")
            .update({ status: dbStatus, is_active: isActive })
            .eq("id", courtId);

        if (error) {
            const retry = await supabase
                .from("courts")
                .update({ status, is_active: isActive })
                .eq("id", courtId);
            error = retry.error;
        }

        if (error) {
            return { success: false, error: error.message };
        }

        revalidateCourtPaths();
        return { success: true };
    } catch (err: unknown) {
        return {
            success: false,
            error: err instanceof Error ? err.message : "Failed to update court status",
        };
    }
}

export async function updateCourtRateAction(
    courtId: string,
    hourlyRate: number
): Promise<{ success: boolean; error?: string }> {
    try {
        await requireAdmin();
        if (!Number.isFinite(hourlyRate) || hourlyRate < 0) {
            return { success: false, error: "Invalid hourly rate" };
        }
        const supabase = createAdminClient();
        const { error } = await supabase
            .from("courts")
            .update({ hourly_rate: hourlyRate })
            .eq("id", courtId);

        if (error) {
            return { success: false, error: error.message };
        }

        revalidateCourtPaths();
        return { success: true };
    } catch (err: unknown) {
        return {
            success: false,
            error: err instanceof Error ? err.message : "Failed to update court rate",
        };
    }
}

export async function createCourtModalAction(input: {
    name: string;
    description: string | null;
    hourlyRate: number;
    status: CourtStatus;
}): Promise<{ success: boolean; error?: string }> {
    try {
        await requireAdmin();
        if (!Number.isFinite(input.hourlyRate) || input.hourlyRate < 0) {
            return { success: false, error: "Invalid hourly rate" };
        }
        const supabase = createAdminClient();
        const isActive = input.status === "Available" || input.status === "Maintenance";
        const dbStatus = toDbStatus(input.status);

        let { error } = await supabase.from("courts").insert({
            name: input.name,
            description: input.description,
            status: dbStatus,
            is_active: isActive,
            hourly_rate: input.hourlyRate,
        });

        if (error) {
            const retry = await supabase.from("courts").insert({
                name: input.name,
                description: input.description,
                status: input.status,
                is_active: isActive,
                hourly_rate: input.hourlyRate,
            });
            error = retry.error;
        }

        if (error) {
            return { success: false, error: error.message };
        }

        revalidateCourtPaths();
        return { success: true };
    } catch (err: unknown) {
        return {
            success: false,
            error: err instanceof Error ? err.message : "Failed to create court",
        };
    }
}

/**
 * revalidatePath() tells Next.js "the cached data behind this URL
 * is now stale, throw it away." Server Components can be cached for
 * performance — without calling this after a create/update/deactivate,
 * the admin could submit the form and still see the OLD list of
 * courts, because Next.js would serve a cached version of the page.
 */

export async function createCourtAction(formData: FormData) {
    await requireAdmin();
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
    await requireAdmin();
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
    await requireAdmin();
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

export async function deleteCourtAction(courtId: string) {
    await requireAdmin();
    await deleteCourt(courtId);
    revalidatePath("/admin/courts");
    revalidatePath("/book");
}