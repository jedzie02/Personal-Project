import { describe, it, expect, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AddCourtModal } from "./AddCourtModal";

describe("AddCourtModal", () => {
  it("renders nothing when isOpen is false", () => {
    const html = renderToStaticMarkup(
      <AddCourtModal isOpen={false} onClose={vi.fn()} onSubmit={vi.fn()} />
    );
    expect(html).toBe("");
  });

  it("renders modal dialog with default rate 200 and required fields when isOpen is true", () => {
    const html = renderToStaticMarkup(
      <AddCourtModal isOpen={true} onClose={vi.fn()} onSubmit={vi.fn()} />
    );

    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain('Add Court');
    expect(html).toContain('value="200"');
    expect(html).toContain('Available (Open for player reservations)');
    expect(html).toContain('Hourly Rate (₱)');
  });
});
