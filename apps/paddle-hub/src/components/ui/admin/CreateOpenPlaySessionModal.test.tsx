import { describe, it, expect, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { CreateOpenPlaySessionModal } from "./CreateOpenPlaySessionModal";

describe("CreateOpenPlaySessionModal", () => {
  const mockCourts = [
    { id: "c1", name: "Court 1" },
    { id: "c2", name: "Court 2" },
  ];

  it("renders nothing when isOpen is false", () => {
    const html = renderToStaticMarkup(
      <CreateOpenPlaySessionModal
        isOpen={false}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        courts={mockCourts}
        todayISO="2026-11-16"
      />
    );
    expect(html).toBe("");
  });

  it("renders modal dialog with court selection, times, rate, and cap when isOpen is true", () => {
    const html = renderToStaticMarkup(
      <CreateOpenPlaySessionModal
        isOpen={true}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        courts={mockCourts}
        todayISO="2026-11-16"
      />
    );

    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain("Create Open Play Session");
    expect(html).toContain("Court 1");
    expect(html).toContain("Court 2");
    expect(html).toContain("Price per Player (₱)");
    expect(html).toContain("Player Cap");
    expect(html).toContain("Create Session");
  });
});
