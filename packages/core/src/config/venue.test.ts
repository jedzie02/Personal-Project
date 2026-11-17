import { describe, it, expect } from "vitest";
import { resolveVenueConfig, DEFAULT_VENUE_CONFIG } from "./venue";

describe("Venue Configuration Contract", () => {
  it("provides standard Philippine defaults when no overrides are given", () => {
    const config = resolveVenueConfig();
    expect(config.currency).toBe("PHP");
    expect(config.currencySymbol).toBe("₱");
    expect(config.timezone).toBe("Asia/Manila");
    expect(config.slotDurationMinutes).toBe(60);
    expect(config.venueName).toBe("Pickleball Venue");
  });

  it("applies venue overrides cleanly", () => {
    const config = resolveVenueConfig({
      venueName: "Metro Pickleball Club",
      contactPhone: "09181234567",
      contactEmail: "info@metropickle.ph",
    });
    expect(config.venueName).toBe("Metro Pickleball Club");
    expect(config.contactPhone).toBe("09181234567");
    expect(config.contactEmail).toBe("info@metropickle.ph");
    expect(config.currencySymbol).toBe("₱");
  });
});
