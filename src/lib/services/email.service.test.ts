import { describe, it, expect } from "vitest";
import {
  isOnlineReceiptEligible,
  extractMethodAndReference,
  wrapBase64Mime,
  resolveRecipientEmail,
  buildReceiptEmailContent,
  sendPaymentReceiptEmail,
} from "./email.service";

describe("email.service", () => {
  it("wraps base64 MIME payloads at 76 characters per line for RFC 5321 Gmail SMTP compliance", () => {
    const raw = "A".repeat(300);
    const wrapped = wrapBase64Mime(raw);
    const lines = wrapped.split("\r\n");
    expect(lines.every((line) => line.length <= 76)).toBe(true);
  });

  it("falls back to sender Gmail when booking profile email is missing or a seed @example.com address", () => {
    expect(resolveRecipientEmail("customer@gmail.com", "venue@gmail.com")).toBe("customer@gmail.com");
    expect(resolveRecipientEmail(null, "venue@gmail.com")).toBe("venue@gmail.com");
    expect(resolveRecipientEmail("maria@example.com", "venue@gmail.com")).toBe("venue@gmail.com");
  });

  it("extracts encoded GCash reference from payment_method when payment_reference column is absent", () => {
    expect(extractMethodAndReference("GCash QR (Ref: 1029384756102)")).toEqual({
      method: "GCash QR",
      reference: "1029384756102",
    });
    expect(extractMethodAndReference("Credit Card", null)).toEqual({
      method: "Credit Card",
      reference: null,
    });
  });

  it("gates eligibility to Card and GCash QR only, rejecting Cash walk-in", () => {
    expect(isOnlineReceiptEligible("Credit Card")).toBe(true);
    expect(isOnlineReceiptEligible("Card")).toBe(true);
    expect(isOnlineReceiptEligible("GCash QR")).toBe(true);
    expect(isOnlineReceiptEligible("GCash QR (Ref: 1234567890)")).toBe(true);
    expect(isOnlineReceiptEligible("Cash walk in")).toBe(false);
    expect(isOnlineReceiptEligible("Cash (Paid at Counter)")).toBe(false);
    expect(isOnlineReceiptEligible(null)).toBe(false);
  });

  it("skips gracefully when GMAIL_USER or GMAIL_APP_PASSWORD is not configured or left as placeholder", async () => {
    const prevUser = process.env.GMAIL_USER;
    const prevPass = process.env.GMAIL_APP_PASSWORD;
    delete process.env.GMAIL_USER;
    delete process.env.GMAIL_APP_PASSWORD;

    const res = await sendPaymentReceiptEmail("booking-123");
    expect(res).toEqual({ sent: false, skippedReason: "missing-smtp-config" });

    process.env.GMAIL_USER = "your-venue-email@gmail.com";
    process.env.GMAIL_APP_PASSWORD = "xxxx xxxx xxxx xxxx";
    const placeholderRes = await sendPaymentReceiptEmail("booking-123");
    expect(placeholderRes).toEqual({ sent: false, skippedReason: "missing-smtp-config" });

    if (prevUser !== undefined) process.env.GMAIL_USER = prevUser;
    if (prevPass !== undefined) process.env.GMAIL_APP_PASSWORD = prevPass;
  });

  it("builds receipt email subject, text, and HTML with PHP amount and itinerary", () => {
    const out = buildReceiptEmailContent({
      bookingId: "abcd1234-5678-90ef",
      customerName: "Juan Dela Cruz",
      bookingDate: "2026-11-03",
      paymentMethod: "GCash QR",
      paymentReference: "1029384756102",
      totalPrice: 600,
      segments: [
        { courtName: "Court 1", startTime: "09:00", endTime: "10:00", price: 300 },
        { courtName: "Court 2", startTime: "10:00", endTime: "11:00", price: 300 },
      ],
    });

    expect(out.subject).toContain("#ABCD1234");
    expect(out.text).toContain("₱600.00");
    expect(out.text).toContain("9:00 AM – 10:00 AM");
    expect(out.html).toContain("Juan Dela Cruz");
    expect(out.html).toContain("1029384756102");
    expect(out.html).toContain("Court 1");
    expect(out.html).toContain("Court 2");
  });
});
