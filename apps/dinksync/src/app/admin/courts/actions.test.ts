import { describe, it, expect, vi, beforeEach } from "vitest";
import { updateCourtStatusAction, updateCourtRateAction, createCourtModalAction } from "./actions";

vi.mock("@/lib/services/auth.server", () => ({
    requireAdmin: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
    createAdminClient: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
            update: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ error: null }),
            }),
            insert: vi.fn().mockResolvedValue({ error: null }),
        }),
    }),
}));

vi.mock("next/cache", () => ({
    revalidatePath: vi.fn(),
}));

describe("admin/courts/actions security & validation", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("requires admin privileges for updateCourtStatusAction", async () => {
        const { requireAdmin } = await import("@/lib/services/auth.server");
        vi.mocked(requireAdmin).mockRejectedValueOnce(new Error("Unauthorized: Admin privileges required."));

        const result = await updateCourtStatusAction("court-1", "Not Available");
        expect(result.success).toBe(false);
        expect(result.error).toContain("Admin privileges required");
    });

    it("requires admin privileges for updateCourtRateAction", async () => {
        const { requireAdmin } = await import("@/lib/services/auth.server");
        vi.mocked(requireAdmin).mockRejectedValueOnce(new Error("Unauthorized: Admin privileges required."));

        const result = await updateCourtRateAction("court-1", 400);
        expect(result.success).toBe(false);
        expect(result.error).toContain("Admin privileges required");
    });

    it("rejects invalid or negative hourly rates in updateCourtRateAction", async () => {
        const resultNegative = await updateCourtRateAction("court-1", -50);
        expect(resultNegative.success).toBe(false);
        expect(resultNegative.error).toContain("Invalid hourly rate");

        const resultNaN = await updateCourtRateAction("court-1", NaN);
        expect(resultNaN.success).toBe(false);
        expect(resultNaN.error).toContain("Invalid hourly rate");
    });

    it("rejects invalid time-range pricing rules in updateCourtRateAction", async () => {
        const resultBadRange = await updateCourtRateAction("court-1", 300, {
            pricingRules: [{ startTime: "18:00", endTime: "16:00", rate: 350 }],
        });
        expect(resultBadRange.success).toBe(false);
        expect(resultBadRange.error).toContain("End time must be after start time");

        const resultNegativeRuleRate = await updateCourtRateAction("court-1", 300, {
            pricingRules: [{ startTime: "09:00", endTime: "16:00", rate: -100 }],
        });
        expect(resultNegativeRuleRate.success).toBe(false);
        expect(resultNegativeRuleRate.error).toContain("Invalid rate in custom time range");
    });

    it("requires admin privileges for createCourtModalAction", async () => {
        const { requireAdmin } = await import("@/lib/services/auth.server");
        vi.mocked(requireAdmin).mockRejectedValueOnce(new Error("Unauthorized: Admin privileges required."));

        const result = await createCourtModalAction({
            name: "New Court",
            description: null,
            status: "Available",
            hourlyRate: 300,
        });
        expect(result.success).toBe(false);
        expect(result.error).toContain("Admin privileges required");
    });
});
