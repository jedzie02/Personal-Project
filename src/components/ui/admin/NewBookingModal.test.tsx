import { describe, it, expect, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NewBookingModal } from "./NewBookingModal";

// Mock server actions called on mount / interactions
vi.mock("@/app/admin/bookings/actions", () => ({
  createAdminBookingAction: vi.fn(),
  getRegisteredProfilesAction: vi.fn().mockResolvedValue([]),
  getExistingBookingsForCourtDateAction: vi.fn().mockResolvedValue([]),
  getActiveCourtsAction: vi.fn().mockResolvedValue([]),
}));

describe("NewBookingModal", () => {
  const mockCourts = [
    { id: "court-1", name: "Court 1", hourlyRate: 300, status: "Available" },
    { id: "court-2", name: "Court 2", hourlyRate: 350, status: "Available" },
  ];

  it("renders nothing when isOpen is false", () => {
    const html = renderToStaticMarkup(
      <NewBookingModal
        isOpen={false}
        onClose={vi.fn()}
        courts={mockCourts}
      />
    );
    expect(html).toBe("");
  });

  it("renders modal dialog with court selection, times, customer mode, and payment options when isOpen is true", () => {
    const html = renderToStaticMarkup(
      <NewBookingModal
        isOpen={true}
        onClose={vi.fn()}
        courts={mockCourts}
        initialDate="2026-11-16"
        initialStartTime="14:00"
      />
    );

    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain("New Court Reservation");
    expect(html).toContain("Court 1");
    expect(html).toContain("Court 2");
    expect(html).toContain("₱300/hr");
    expect(html).toContain("Walk-in Guest");
    expect(html).toContain("Registered Member");
    expect(html).toContain("Cash Paid Now");
    expect(html).toContain("GCash QR Paid");
    expect(html).toContain("Pay at Desk");
    expect(html).toContain("Total Due:");
  });
});
