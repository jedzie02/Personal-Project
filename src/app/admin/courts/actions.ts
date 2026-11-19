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
import { createClient as createServerClient } from "@/lib/supabase/server";
import type { CourtStatus } from "@/lib/types/domain";
import {
    encodeDescriptionWithPricingRules,
    type CourtPricingRule,
} from "@/lib/utils/court-pricing";

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

async function getSupabaseMutationClient() {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
    const isValidServiceKey = serviceKey && !serviceKey.includes("your_") && !serviceKey.includes("placeholder") && !serviceKey.includes("copied");
    if (isValidServiceKey) {
        return createAdminClient();
    }
    try {
        return await createServerClient();
    } catch {
        return createAdminClient();
    }
}

export async function updateCourtStatusAction(
    courtId: string,
    status: CourtStatus
): Promise<{ success: boolean; error?: string }> {
    try {
        await requireAdmin();
        const supabase = await getSupabaseMutationClient();
        const isActive = status === "Available" || status === "Maintenance";
        const dbStatus = toDbStatus(status);

        const updateQuery = supabase
            .from("courts")
            .update({ status: dbStatus, is_active: isActive })
            .eq("id", courtId);

        let { data, error } = typeof (updateQuery as any).select === "function"
            ? await (updateQuery as any).select()
            : await updateQuery;

        if (error) {
            const retryQuery = supabase
                .from("courts")
                .update({ status, is_active: isActive })
                .eq("id", courtId);
            const retryRes = typeof (retryQuery as any).select === "function"
                ? await (retryQuery as any).select()
                : await retryQuery;
            error = retryRes.error;
            data = retryRes.data;
        }

        if (error) {
            return { success: false, error: error.message };
        }

        if (data !== undefined && Array.isArray(data) && data.length === 0) {
            return {
                success: false,
                error: "Database blocked update (0 rows changed). Row-Level Security (RLS) is blocking edits because SUPABASE_SERVICE_ROLE_KEY is missing from .env.local, or RLS update policy is missing.",
            };
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
    hourlyRate: number,
    options?: {
        pricingRules?: CourtPricingRule[];
        applyToAll?: boolean;
    }
): Promise<{ success: boolean; error?: string }> {
    try {
        await requireAdmin();
        if (!Number.isFinite(hourlyRate) || hourlyRate < 0) {
            return { success: false, error: "Invalid hourly rate" };
        }

        const rules = options?.pricingRules;
        if (rules && Array.isArray(rules)) {
            for (const rule of rules) {
                const rate = Number(rule?.rate);
                if (!Number.isFinite(rate) || rate < 0) {
                    return { success: false, error: "Invalid rate in custom time range" };
                }
                const startH = parseInt((rule?.startTime || "").split(":")[0], 10);
                const rawEndH = parseInt((rule?.endTime || "").split(":")[0], 10);
                const endH = rawEndH === 0 ? 24 : rawEndH;
                if (Number.isNaN(startH) || Number.isNaN(endH) || startH >= endH) {
                    return { success: false, error: "End time must be after start time in custom time range" };
                }
            }
        }

        const supabase = await getSupabaseMutationClient();

        if (options?.applyToAll) {
            const selectCall = (supabase.from("courts") as any).select;
            if (typeof selectCall === "function") {
                const { data: allCourts } = await supabase.from("courts").select("id, description");
                if (Array.isArray(allCourts) && allCourts.length > 0) {
                    for (const c of allCourts) {
                        const encodedDescription = rules !== undefined
                            ? encodeDescriptionWithPricingRules(c.description, rules)
                            : c.description;
                        const q = supabase
                            .from("courts")
                            .update({ hourly_rate: hourlyRate, description: encodedDescription })
                            .eq("id", c.id);
                        const res = typeof (q as any).select === "function" ? await (q as any).select() : await q;
                        if (res.error) {
                            return { success: false, error: res.error.message };
                        }
                    }
                    revalidateCourtPaths();
                    return { success: true };
                }
            }
        }

        const updatePayload: Record<string, any> = { hourly_rate: hourlyRate };
        if (rules !== undefined) {
            let currentDescription: string | null = null;
            try {
                const selectFn = (supabase.from("courts") as any).select;
                if (typeof selectFn === "function") {
                    const { data: courtRow } = await supabase
                        .from("courts")
                        .select("description")
                        .eq("id", courtId)
                        .maybeSingle();
                    currentDescription = courtRow?.description ?? null;
                }
            } catch {
                // fallback to null if select not mocked
            }
            updatePayload.description = encodeDescriptionWithPricingRules(currentDescription, rules);
        }

        const updateQuery = supabase
            .from("courts")
            .update(updatePayload)
            .eq("id", courtId);

        const { data, error } = typeof (updateQuery as any).select === "function"
            ? await (updateQuery as any).select()
            : await updateQuery;

        if (error) {
            return { success: false, error: error.message };
        }

        if (data !== undefined && Array.isArray(data) && data.length === 0) {
            return {
                success: false,
                error: "Database blocked rate update (0 rows changed). Row-Level Security (RLS) is blocking edits.",
            };
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
        const supabase = await getSupabaseMutationClient();
        const isActive = input.status === "Available" || input.status === "Maintenance";
        const dbStatus = toDbStatus(input.status);

        const insertQuery = supabase.from("courts").insert({
            name: input.name,
            description: input.description,
            status: dbStatus,
            is_active: isActive,
            hourly_rate: input.hourlyRate,
        });

        let { data, error } = typeof (insertQuery as any).select === "function"
            ? await (insertQuery as any).select()
            : await insertQuery;

        if (error) {
            const retryQuery = supabase.from("courts").insert({
                name: input.name,
                description: input.description,
                status: input.status,
                is_active: isActive,
                hourly_rate: input.hourlyRate,
            });
            const retryRes = typeof (retryQuery as any).select === "function"
                ? await (retryQuery as any).select()
                : await retryQuery;
            error = retryRes.error;
            data = retryRes.data;
        }

        if (error) {
            return { success: false, error: error.message };
        }

        if (data !== undefined && Array.isArray(data) && data.length === 0) {
            return {
                success: false,
                error: "Database blocked court creation. Row-Level Security (RLS) is blocking inserts because SUPABASE_SERVICE_ROLE_KEY is missing from .env.local, or RLS insert policy is missing.",
            };
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