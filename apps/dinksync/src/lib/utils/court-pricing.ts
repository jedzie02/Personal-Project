export interface CourtPricingRule {
    startTime: string; // "HH:00", e.g. "09:00"
    endTime: string;   // "HH:00", e.g. "16:00" or "00:00" for midnight
    rate: number;      // e.g. 350
}

const PRICING_RULES_TAG_REGEX = /\s*<!--pricing_rules:([\s\S]*?)-->\s*$/;

function parseHourNum(timeStr: string, isEnd: boolean = false): number {
    if (!timeStr || typeof timeStr !== "string") return NaN;
    const h = parseInt(timeStr.split(":")[0], 10);
    if (Number.isNaN(h)) return NaN;
    if (isEnd && h === 0) return 24;
    return h;
}

/**
 * Resolves the effective hourly rate for a given court and hour slot ("HH:00").
 * If multiple rules overlap, the last matching rule in `rules` wins.
 */
export function resolveCourtHourRate(
    baseRate: number,
    rules: CourtPricingRule[] | undefined | null,
    hour: string
): number {
    const fallback = Number.isFinite(baseRate) && baseRate >= 0 ? baseRate : 300;
    if (!rules || !Array.isArray(rules) || rules.length === 0) {
        return fallback;
    }

    const hourNum = parseHourNum(hour, false);
    if (Number.isNaN(hourNum)) {
        return fallback;
    }

    let resolved = fallback;
    for (const rule of rules) {
        if (!rule) continue;
        const startH = parseHourNum(rule.startTime, false);
        const endH = parseHourNum(rule.endTime, true);
        const rate = Number(rule.rate);
        if (
            !Number.isNaN(startH) &&
            !Number.isNaN(endH) &&
            startH < endH &&
            Number.isFinite(rate) &&
            rate >= 0 &&
            hourNum >= startH &&
            hourNum < endH
        ) {
            resolved = rate;
        }
    }

    return resolved;
}

/**
 * Encodes clean description text and custom time-range pricing rules into a single
 * description string with a trailing invisible HTML comment tag.
 */
export function encodeDescriptionWithPricingRules(
    cleanDescription: string | null | undefined,
    rules: CourtPricingRule[] | undefined | null
): string | null {
    const stripped = decodeDescriptionAndPricingRules(cleanDescription).description;
    const validRules = (rules ?? []).filter((r) => {
        if (!r) return false;
        const startH = parseHourNum(r.startTime, false);
        const endH = parseHourNum(r.endTime, true);
        const rate = Number(r.rate);
        return !Number.isNaN(startH) && !Number.isNaN(endH) && startH < endH && Number.isFinite(rate) && rate >= 0;
    }).map((r) => ({
        startTime: r.startTime,
        endTime: r.endTime,
        rate: Number(r.rate),
    }));

    if (validRules.length === 0) {
        return stripped;
    }

    const tag = `<!--pricing_rules:${JSON.stringify(validRules)}-->`;
    return stripped ? `${stripped} ${tag}` : tag;
}

/**
 * Splits a raw description string from the database into clean user-visible description text
 * and validated CourtPricingRule[].
 */
export function decodeDescriptionAndPricingRules(
    rawDescription: string | null | undefined
): { description: string | null; pricingRules: CourtPricingRule[] } {
    if (!rawDescription || typeof rawDescription !== "string") {
        return { description: null, pricingRules: [] };
    }

    const match = rawDescription.match(PRICING_RULES_TAG_REGEX);
    if (!match) {
        const trimmed = rawDescription.trim();
        return { description: trimmed.length > 0 ? trimmed : null, pricingRules: [] };
    }

    const cleanText = rawDescription.replace(PRICING_RULES_TAG_REGEX, "").trim();
    const description = cleanText.length > 0 ? cleanText : null;

    try {
        const parsed = JSON.parse(match[1]);
        if (!Array.isArray(parsed)) {
            return { description, pricingRules: [] };
        }
        const pricingRules: CourtPricingRule[] = parsed
            .filter((r: any) => {
                if (!r || typeof r.startTime !== "string" || typeof r.endTime !== "string") return false;
                const startH = parseHourNum(r.startTime, false);
                const endH = parseHourNum(r.endTime, true);
                const rate = Number(r.rate);
                return !Number.isNaN(startH) && !Number.isNaN(endH) && startH < endH && Number.isFinite(rate) && rate >= 0;
            })
            .map((r: any) => ({
                startTime: r.startTime,
                endTime: r.endTime,
                rate: Number(r.rate),
            }));
        return { description, pricingRules };
    } catch {
        return { description, pricingRules: [] };
    }
}

export function formatHourAMPM(timeStr: string): string {
    const [hStr, mStr = "00"] = timeStr.split(":");
    let h = parseInt(hStr, 10);
    if (Number.isNaN(h)) return timeStr;
    h = h % 24;
    const ampm = h >= 12 && h < 24 ? "PM" : "AM";
    h = h % 12;
    h = h ? h : 12;
    return `${h.toString().padStart(2, "0")}:${mStr} ${ampm}`;
}

export function formatCourtCardRuleSummary(rule: CourtPricingRule): string {
    return `${formatHourAMPM(rule.startTime)} – ${formatHourAMPM(rule.endTime)}: ₱${rule.rate}/hr`;
}
