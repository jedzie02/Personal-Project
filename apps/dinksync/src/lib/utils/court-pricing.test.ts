import { describe, it, expect } from "vitest";
import {
    resolveCourtHourRate,
    encodeDescriptionWithPricingRules,
    decodeDescriptionAndPricingRules,
    type CourtPricingRule,
} from "./court-pricing";

describe("court-pricing utilities", () => {
    const sampleRules: CourtPricingRule[] = [
        { startTime: "09:00", endTime: "16:00", rate: 200 },
        { startTime: "17:00", endTime: "00:00", rate: 350 },
    ];

    it("resolves matching time-range rule rate or falls back to baseRate", () => {
        expect(resolveCourtHourRate(250, sampleRules, "09:00")).toBe(200);
        expect(resolveCourtHourRate(250, sampleRules, "15:00")).toBe(200);
        // 16:00 is outside both ranges -> baseRate 250
        expect(resolveCourtHourRate(250, sampleRules, "16:00")).toBe(250);
        // 17:00 to 00:00 (midnight) -> 350
        expect(resolveCourtHourRate(250, sampleRules, "17:00")).toBe(350);
        expect(resolveCourtHourRate(250, sampleRules, "23:00")).toBe(350);
    });

    it("uses the last matching rule when rules overlap", () => {
        const overlapping: CourtPricingRule[] = [
            { startTime: "09:00", endTime: "22:00", rate: 250 },
            { startTime: "18:00", endTime: "21:00", rate: 400 },
        ];
        expect(resolveCourtHourRate(300, overlapping, "12:00")).toBe(250);
        expect(resolveCourtHourRate(300, overlapping, "18:00")).toBe(400);
        expect(resolveCourtHourRate(300, overlapping, "21:00")).toBe(250);
    });

    it("encodes and decodes pricing rules inside description without leaking metadata", () => {
        const encoded = encodeDescriptionWithPricingRules("Indoor pro surface", sampleRules);
        expect(encoded).toContain("Indoor pro surface");
        expect(encoded).toContain("<!--pricing_rules:");

        const decoded = decodeDescriptionAndPricingRules(encoded);
        expect(decoded.description).toBe("Indoor pro surface");
        expect(decoded.pricingRules).toEqual(sampleRules);
    });

    it("handles null description and malformed metadata gracefully", () => {
        const encodedNull = encodeDescriptionWithPricingRules(null, sampleRules);
        const decodedNull = decodeDescriptionAndPricingRules(encodedNull);
        expect(decodedNull.description).toBeNull();
        expect(decodedNull.pricingRules).toEqual(sampleRules);

        const decodedBroken = decodeDescriptionAndPricingRules("Court notes <!--pricing_rules:broken-->");
        expect(decodedBroken.description).toBe("Court notes");
        expect(decodedBroken.pricingRules).toEqual([]);
    });
});
