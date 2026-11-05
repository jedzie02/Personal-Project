import { describe, it, expect, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import AdminCustomersPage, { getMembershipTier } from "./page";

vi.mock("@/lib/services/customer.service", () => ({
  getAllCustomersWithBookingCounts: vi.fn().mockResolvedValue([
    { id: "c-1", fullName: "Alice Smith", email: "alice@example.com", bookingCount: 22, totalSpend: 5500 },
    { id: "c-2", fullName: "Bob Jones", email: "bob@example.com", bookingCount: 8, totalSpend: 2000 },
    { id: "c-3", fullName: "Charlie Day", email: "charlie@example.com", bookingCount: 1, totalSpend: 250 },
  ]),
}));

describe("Customer Tier Labels", () => {
  it("returns correct tier labels and descriptions based on booking counts", () => {
    expect(getMembershipTier(25)).toEqual({
      label: "VIP Player",
      cls: expect.stringContaining("purple"),
      description: "Top frequent player",
    });

    expect(getMembershipTier(5)).toEqual({
      label: "Regular Player",
      cls: expect.stringContaining("blue"),
      description: "Active returning player",
    });

    expect(getMembershipTier(2)).toEqual({
      label: "New Player",
      cls: expect.stringContaining("slate"),
      description: "First-time or occasional player",
    });
  });

  it("renders updated tier cards and table badges in AdminCustomersPage", async () => {
    const pageJsx = await AdminCustomersPage({});
    const html = renderToStaticMarkup(pageJsx);

    // Summary cards
    expect(html).toContain("VIP Players");
    expect(html).toContain("Regular Players");
    expect(html).toContain("New Players");

    // Table badges
    expect(html).toContain("VIP Player");
    expect(html).toContain("Regular Player");
    expect(html).toContain("New Player");

    // No legacy Guest or Member text in tiers
    expect(html).not.toContain("VIP Members");
    expect(html).not.toContain("Regular Members");
    expect(html).not.toContain("Guests");
  });
});
