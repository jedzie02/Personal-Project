import { describe, it, expect } from "vitest";
import * as core from "./index";

describe("@pickle/core exports", () => {
  it("exports all required core modules", () => {
    expect(core.resolveVenueConfig).toBeDefined();
    expect(core.DEFAULT_VENUE_CONFIG).toBeDefined();
    expect(core.createAdminClient).toBeDefined();
    expect(core.createClient).toBeDefined();
    expect(core.createCheckoutSession).toBeDefined();
    expect(core.getBookingGridForDate).toBeDefined();
  });
});
