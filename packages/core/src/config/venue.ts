export interface VenueConfig {
  venueId: string;
  venueName: string;
  tagline?: string;
  contactEmail: string;
  contactPhone: string;
  address?: string;
  timezone: string;
  currency: string;
  currencySymbol: string;
  slotDurationMinutes: number;
}

export const DEFAULT_VENUE_CONFIG: VenueConfig = {
  venueId: "default-venue",
  venueName: "Pickleball Venue",
  tagline: "Premier Pickleball Facility",
  contactEmail: "contact@pickleball.ph",
  contactPhone: "+63 900 000 0000",
  address: "Metro Manila, Philippines",
  timezone: "Asia/Manila",
  currency: "PHP",
  currencySymbol: "₱",
  slotDurationMinutes: 60,
};

export function resolveVenueConfig(overrides?: Partial<VenueConfig>): VenueConfig {
  return {
    ...DEFAULT_VENUE_CONFIG,
    ...overrides,
  };
}
