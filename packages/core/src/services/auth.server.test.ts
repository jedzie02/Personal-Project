import { describe, it, expect, vi, beforeEach } from "vitest";
import { getCurrentProfile, requireAdmin } from "./auth.server";

vi.mock("../supabase/server", () => ({
  createClient: vi.fn(),
}));

describe("auth.server security", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not grant admin role based solely on email containing 'admin'", async () => {
    const { createClient } = await import("../supabase/server");
    (createClient as any).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: "fake-user-id",
              email: "admin-hacker@example.com",
              user_metadata: {},
            },
          },
        }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: null }),
          }),
        }),
        upsert: vi.fn().mockResolvedValue({ error: null }),
      }),
    });

    const profile = await getCurrentProfile();
    expect(profile?.role).toBe("customer");
    await expect(requireAdmin()).rejects.toThrow("Unauthorized: Admin privileges required.");
  });

  it("grants admin role when user_metadata explicitly defines role as admin", async () => {
    const { createClient } = await import("../supabase/server");
    (createClient as any).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: "legit-admin-id",
              email: "boss@example.com",
              user_metadata: { role: "admin" },
            },
          },
        }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: null }),
          }),
        }),
        upsert: vi.fn().mockResolvedValue({ error: null }),
      }),
    });

    const profile = await getCurrentProfile();
    expect(profile?.role).toBe("admin");
    const verified = await requireAdmin();
    expect(verified.role).toBe("admin");
  });
});
