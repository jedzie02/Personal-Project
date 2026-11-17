import { describe, it, expect, vi, beforeEach } from "vitest";
import { deleteCourt, deleteCourts } from "./court.service";

const mockDelete = vi.fn();
const mockEq = vi.fn();
const mockIn = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
    createClient: vi.fn(() => ({
        from: vi.fn((table: string) => {
            if (table === "courts") {
                return {
                    delete: mockDelete.mockReturnValue({
                        eq: mockEq,
                        in: mockIn,
                    }),
                };
            }
            return {};
        }),
    })),
}));

describe("court.service deletion", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockEq.mockResolvedValue({ error: null });
        mockIn.mockResolvedValue({ error: null });
    });

    it("deleteCourt calls delete and eq with court id", async () => {
        const res = await deleteCourt("c-1");
        expect(mockDelete).toHaveBeenCalled();
        expect(mockEq).toHaveBeenCalledWith("id", "c-1");
        expect(res.success).toBe(true);
    });

    it("deleteCourts calls delete and in with list of court ids", async () => {
        const res = await deleteCourts(["c-1", "c-2"]);
        expect(mockDelete).toHaveBeenCalled();
        expect(mockIn).toHaveBeenCalledWith("id", ["c-1", "c-2"]);
        expect(res.success).toBe(true);
    });

    it("deleteCourts with empty array returns success without calling database", async () => {
        const res = await deleteCourts([]);
        expect(mockDelete).not.toHaveBeenCalled();
        expect(res.success).toBe(true);
    });
});
