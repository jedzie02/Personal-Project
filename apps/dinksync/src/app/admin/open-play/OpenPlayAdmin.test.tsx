import { describe, it, expect, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import OpenPlayAdmin from "./OpenPlayAdmin";

describe("OpenPlayAdmin", () => {
    const mockCourts = [
        { id: "c1", name: "Court 1" },
        { id: "c2", name: "Court 2" },
    ];

    it("renders page header and Create Session button without inline 6-column form", () => {
        const html = renderToStaticMarkup(
            <OpenPlayAdmin
                sessions={[]}
                courts={mockCourts}
                todayISO="2026-11-16"
            />
        );

        // Header and action
        expect(html).toContain("Open Play Sessions");
        expect(html).toContain("Create Session");

        // Empty state with action
        expect(html).toContain("No Open Play Sessions Scheduled");
        expect(html).toContain("Schedule First Session");

        // The old inline 6-column form should NOT exist
        expect(html).not.toContain("lg:grid-cols-6");
    });
});
