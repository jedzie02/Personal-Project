import { describe, it, expect, vi, beforeEach } from "vitest";
import { completeOpenPlayPaymentAction } from "@/app/open-play/actions";
import * as authServer from "@/lib/services/auth.server";
import * as openPlayService from "@/lib/services/open-play.service";

vi.mock("next/cache", () => ({
    revalidatePath: vi.fn(),
}));

vi.mock("@/lib/services/auth.server", () => ({
    getCurrentProfile: vi.fn(),
}));

vi.mock("@/lib/services/open-play.service", () => ({
    startOpenPlayJoin: vi.fn(),
    completeOpenPlayPayment: vi.fn(),
    submitOpenPlayGCashReference: vi.fn(),
}));

describe("completeOpenPlayPaymentAction", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("fails when entryId is empty", async () => {
        const res = await completeOpenPlayPaymentAction("");
        expect(res).toEqual({ success: false, error: "Missing entry identifier." });
    });

    it("fails when player is not logged in", async () => {
        vi.mocked(authServer.getCurrentProfile).mockResolvedValue(null);
        const res = await completeOpenPlayPaymentAction("entry-123");
        expect(res).toEqual({ success: false, error: "Please log in to complete your payment." });
    });

    it("calls completeOpenPlayPayment and succeeds", async () => {
        vi.mocked(authServer.getCurrentProfile).mockResolvedValue({ id: "cust-1", email: "test@example.com" } as any);
        vi.mocked(openPlayService.completeOpenPlayPayment).mockResolvedValue({ ok: true });

        const res = await completeOpenPlayPaymentAction("entry-123");
        expect(res).toEqual({ success: true });
        expect(openPlayService.completeOpenPlayPayment).toHaveBeenCalledWith("entry-123", "cust-1");
    });
});
