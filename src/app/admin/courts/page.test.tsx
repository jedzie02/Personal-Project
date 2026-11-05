import { describe, it, expect, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import AdminCourtsPage from "./page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: () => ({
      select: () => ({
        order: () => Promise.resolve({ data: [], error: null }),
      }),
      insert: () => Promise.resolve({ error: null }),
      update: () => ({
        eq: () => Promise.resolve({ error: null }),
      }),
    }),
  },
}));

describe("AdminCourtsPage Add Court UI", () => {
  it("renders Add Court button in header and does not render the inline 5-column form by default", () => {
    const html = renderToStaticMarkup(<AdminCourtsPage />);

    // Header has the Add Court button
    expect(html).toContain("Add Court");
    // The previous inline form grid class sm:grid-cols-5 is removed
    expect(html).not.toContain("sm:grid-cols-5");
  });
});

