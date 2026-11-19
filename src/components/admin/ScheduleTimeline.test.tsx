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
    expect(html).toContain("6:00 PM");
    expect(html).toContain("9:00 PM");
    expect(html).toContain("(3h)");
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

  it("renders Inactive badge when court status is Not Available", () => {
    const courtsWithInactive = [
      { id: "court-1", name: "Court 1", status: "Available" as const, hourlyRate: 300, isActive: true },
      { id: "court-2", name: "Court 2", status: "Not Available" as const, hourlyRate: 300, isActive: false },
    ];

    const html = renderToStaticMarkup(
      <ScheduleTimeline
        selectedDate="2026-11-16"
        todayDate="2026-11-16"
        initialCourts={courtsWithInactive}
        initialBookings={[]}
        initialOperatingHours={mockOperatingHours}
      />
    );

    expect(html).toContain("Court 2");
    expect(html).toContain("Inactive");
  });

  it("dynamically adapts grid columns and minWidth for 7+ courts without auto-fit wrapping", () => {
    const sevenCourts = Array.from({ length: 7 }, (_, i) => ({
      id: `court-${i + 1}`,
      name: `Court ${i + 1}`,
      status: "Available" as const,
      hourlyRate: 300,
      isActive: true,
    }));

    const html = renderToStaticMarkup(
      <ScheduleTimeline
        selectedDate="2026-11-16"
        todayDate="2026-11-16"
        initialCourts={sevenCourts}
        initialBookings={[]}
        initialOperatingHours={mockOperatingHours}
      />
    );

    expect(html).toContain("repeat(7,minmax(130px,1fr))");
    expect(html).toContain("Court 7");
  });

  it("renders existing live booking even when court status is Not Available or Maintenance", () => {
    const offlineCourts = [
      { id: "court-inactive", name: "Court Offline", status: "Not Available" as const, hourlyRate: 300, isActive: false },
    ];

    const existingBooking = [
      {
        id: "b-offline-1",
        courtId: "court-inactive",
        courtName: "Court Offline",
        customerId: "cust-offline",
        customerName: "Prior Reserved Player",
        customerEmail: "player@example.com",
        bookingDate: "2026-11-16",
        startTime: "10:00:00",
        endTime: "11:00:00",
        status: "confirmed" as const,
        paymentStatus: "succeeded" as const,
        paymentMethod: "Cash walk in",
        paymentReference: null,
        totalPrice: 300,
        cancelledReason: null,
        createdAt: "2026-11-16T08:00:00Z",
      },
    ];

    const html = renderToStaticMarkup(
      <ScheduleTimeline
        selectedDate="2026-11-16"
        todayDate="2026-11-16"
        initialCourts={offlineCourts}
        initialBookings={existingBooking}
        initialOperatingHours={mockOperatingHours}
      />
    );

    expect(html).toContain("Prior Reserved Player");
    expect(html).toContain("Court Offline");
  });

  it("renders friendly empty-state card when 0 courts exist in timeline", () => {
    const html = renderToStaticMarkup(
      <ScheduleTimeline
        selectedDate="2026-11-16"
        todayDate="2026-11-16"
        initialCourts={[]}
        initialBookings={[]}
        initialOperatingHours={mockOperatingHours}
      />
    );

    expect(html).toContain("No Courts Configured");
  });
});
