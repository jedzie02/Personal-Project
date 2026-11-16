import { describe, it, expect, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ScheduleTimeline } from "./ScheduleTimeline";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("@/app/admin/bookings/actions", () => ({
  createAdminBookingAction: vi.fn(),
  getRegisteredProfilesAction: vi.fn().mockResolvedValue([]),
  getExistingBookingsForCourtDateAction: vi.fn().mockResolvedValue([]),
  getActiveCourtsAction: vi.fn().mockResolvedValue([]),
}));

describe("ScheduleTimeline Multi-Hour Spanning", () => {
  const mockCourts = [
    { id: "court-1", name: "Court 1", status: "Available" as const, hourlyRate: 300, isActive: true },
    { id: "court-2", name: "Court 2", status: "Available" as const, hourlyRate: 300, isActive: true },
  ];

  const mockOperatingHours = [
    { id: "h1", dayOfWeek: 1, openTime: "09:00:00", closeTime: "23:00:00", isClosed: false },
  ];

  it("renders a multi-hour booking as a single card spanning multiple hours without duplicate cards", () => {
    // 3-hour booking on Court 1: 18:00 to 21:00
    const mockBookings = [
      {
        id: "b-1",
        courtId: "court-1",
        courtName: "Court 1",
        customerId: "cust-1",
        customerName: "Mark Ramos",
        customerEmail: "mark@example.com",
        bookingDate: "2026-11-16",
        startTime: "18:00:00",
        endTime: "21:00:00",
        status: "confirmed" as const,
        paymentStatus: "succeeded" as const,
        paymentMethod: "Cash walk in",
        paymentReference: null,
        totalPrice: 900,
        cancelledReason: null,
        createdAt: "2026-11-16T10:00:00Z",
      },
    ];

    const html = renderToStaticMarkup(
      <ScheduleTimeline
        selectedDate="2026-11-16"
        todayDate="2026-11-16"
        initialCourts={mockCourts}
        initialBookings={mockBookings}
        initialOperatingHours={mockOperatingHours}
      />
    );

    // Customer name should appear exactly once in the grid
    const customerMatches = html.match(/Mark Ramos/g) || [];
    expect(customerMatches.length).toBe(1);

    // Should indicate time span and total fee
    expect(html).toContain("18:00");
    expect(html).toContain("21:00");
    expect(html).toContain("₱900");

    // Grid row span attribute or inline style indicating span 3
    expect(html).toContain("span 3");
  });

  it("leaves adjacent courts available for booking during the same hours", () => {
    const mockBookings = [
      {
        id: "b-1",
        courtId: "court-1",
        courtName: "Court 1",
        customerId: "cust-1",
        customerName: "Mark Ramos",
        customerEmail: "mark@example.com",
        bookingDate: "2026-11-16",
        startTime: "18:00:00",
        endTime: "20:00:00",
        status: "confirmed" as const,
        paymentStatus: "succeeded" as const,
        paymentMethod: "Cash walk in",
        paymentReference: null,
        totalPrice: 600,
        cancelledReason: null,
        createdAt: "2026-11-16T10:00:00Z",
      },
    ];

    const html = renderToStaticMarkup(
      <ScheduleTimeline
        selectedDate="2026-11-16"
        todayDate="2026-11-16"
        initialCourts={mockCourts}
        initialBookings={mockBookings}
        initialOperatingHours={mockOperatingHours}
      />
    );

    // Court 2 must still show Available options at 18:00
    expect(html).toContain("Available");
  });
});
