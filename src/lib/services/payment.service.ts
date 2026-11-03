import { stripe } from "@/lib/stripe/client";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCustomerDisplayName } from "@/lib/services/customer.service";
import { sendPaymentReceiptEmail, sendBookingRefundEmail } from "@/lib/services/email.service";
import { OPEN_PLAY_HOLD_LABEL } from "@/lib/utils/open-play";
import {
    markOpenPlayEntryPaidByAdmin,
    markOpenPlayEntryRefundedByAdmin,
    parseEntryPaymentMeta,
} from "@/lib/services/open-play.service";
import type { CheckoutResult, Payment } from "@/lib/types/domain";

async function getDbClient() {
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
        try {
            return createAdminClient();
        } catch {
            // fallback
        }
    }
    return await createClient();
}

/**
 * payment.service.ts
 *
 * Everything about starting (and, in Phase 9, resolving) a Stripe
 * payment lives here — the booking flow calls this instead of
 * talking to the Stripe SDK directly.
 */

export interface CreateCheckoutSessionInput {
    bookingId: string;
    courtName: string;
    bookingDate: string;
    startTime: string;
    endTime: string;
    totalPrice: number;
    customerEmail: string | null;
}

export function getSiteUrl(): string {
    const customUrl = process.env.NEXT_PUBLIC_SITE_URL;
    if (customUrl) {
        let trimmed = customUrl.trim().replace(/\/+$/, "");
        if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
            trimmed = `https://${trimmed}`;
        }
        return trimmed;
    }

    const vercelUrl = process.env.NEXT_PUBLIC_VERCEL_URL || process.env.VERCEL_URL;
    if (vercelUrl) {
        return `https://${vercelUrl.trim().replace(/\/+$/, "")}`;
    }

    return "http://localhost:3000";
}

export async function createCheckoutSession(
    input: CreateCheckoutSessionInput
): Promise<CheckoutResult> {
    const siteUrl = getSiteUrl();

    try {
        const session = await stripe.checkout.sessions.create({
            mode: "payment",
            payment_method_types: ["card"],
            customer_email: input.customerEmail || undefined,
            line_items: [
                {
                    price_data: {
                        currency: "php",
                        product_data: {
                            // What the customer sees on Stripe's payment page —
                            // make it specific enough that they recognize the charge.
                            name: `${input.courtName} — ${input.bookingDate} ${input.startTime}-${input.endTime}`,
                        },
                        // Stripe always works in the smallest unit of the
                        // currency (centavos for PHP), so ₱300 becomes 30000.
                        unit_amount: Math.round(input.totalPrice * 100),
                    },
                    quantity: 1,
                },
            ],
            // We build these URLs ourselves — Stripe just redirects the
            // browser to whatever we specify. Since we already know our
            // own bookingId at this point, we don't need anything Stripe-
            // specific (like {CHECKOUT_SESSION_ID}) in the URL.
            success_url: `${siteUrl}/book/confirmation?bookingId=${input.bookingId}`,
            cancel_url: `${siteUrl}/book/payment-cancelled?bookingId=${input.bookingId}`,
            // THE most important line in this function: this is how the
            // Phase 9 webhook will know which of OUR bookings a given
            // Stripe event is about. Stripe just stores and echoes back
            // whatever key/value pairs we hand it here.
            metadata: {
                bookingId: input.bookingId,
            },
        });

        if (!session.url) {
            return { success: false, error: "Stripe did not return a checkout URL." };
        }

        const supabase = await createClient();
        const { error } = await supabase.from("payments").insert({
            booking_id: input.bookingId,
            stripe_checkout_session_id: session.id,
            amount: input.totalPrice,
            currency: "php",
            status: "pending",
        });

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true, url: session.url };
    } catch (err) {
        return {
            success: false,
            error: err instanceof Error ? err.message : "Could not start checkout.",
        };
    }
}

interface PaymentRow {
    id: string;
    booking_id: string;
    amount: number;
    currency: string;
    method?: string;
    status: string;
    created_at: string;
    bookings: {
        booking_date: string;
        payment_method?: string;
        payment_reference?: string | null;
        courts: { name: string } | null;
        profiles: { full_name: string | null; email: string | null } | null;
    } | null;
}

/**
 * Admin payments list (FR-10.1). Reads real payments and live bookings.
 */
export async function getAllPayments(): Promise<Payment[]> {
    const supabase = await getDbClient();

    // 1. Fetch real recorded payment records from public.payments
    const { data: paymentsData } = await supabase
        .from("payments")
        .select(`
            id, booking_id, amount, currency, status, method, created_at, stripe_checkout_session_id
        `)
        .order("created_at", { ascending: false });

    // 2. Fetch live bookings to unify all ledger charges
    const { data: rawBookingRows } = await supabase
        .from("bookings")
        .select(`
            id, customer_id, court_id, booking_date, start_time, end_time, total_price, status, payment_status, payment_method, created_at,
            courts ( name )
        `)
        .order("created_at", { ascending: false });

    const bookingRows = (rawBookingRows || []).filter(
        (b: any) => b.payment_method !== OPEN_PLAY_HOLD_LABEL
    );

    // 2b. Fetch Open Play entries so Open Play registrations also appear in /admin/payments
    const { data: openPlayEntries } = await supabase
        .from("open_play_entries")
        .select(`
            id, customer_id, status, amount, stripe_checkout_session_id, created_at,
            open_play_sessions ( session_date, courts ( name ) )
        `)
        .order("created_at", { ascending: false });

    // 3. Resolve customer profiles for all bookings and Open Play entries
    const customerIds = Array.from(
        new Set([
            ...bookingRows.map((row: any) => row.customer_id).filter(Boolean),
            ...(openPlayEntries || []).map((row: any) => row.customer_id).filter(Boolean),
        ])
    );

    const profileMap = new Map<string, { full_name: string | null; email: string | null }>();
    if (customerIds.length > 0) {
        const { data: profileRows } = await supabase
            .from("profiles")
            .select("id, full_name, email")
            .in("id", customerIds);

        for (const p of profileRows || []) {
            profileMap.set(p.id, { full_name: p.full_name, email: p.email });
        }
    }

    const bookingMap = new Map<string, any>();
    for (const b of bookingRows || []) {
        bookingMap.set(b.id, b);
    }

    const resultPayments: Payment[] = [];
    const seenBookingIds = new Set<string>();

    // Add entries from public.payments
    for (const p of paymentsData || []) {
        const b = bookingMap.get(p.booking_id);
        if (!b) continue;
        seenBookingIds.add(p.booking_id);
        const courtObj = Array.isArray(b?.courts) ? b.courts[0] : b?.courts;
        const profile = b?.customer_id ? profileMap.get(b.customer_id) : null;
        const customerName = getCustomerDisplayName(profile?.full_name, b?.customer_id, profile?.email);

        let method = p.method || b?.payment_method || "Cash";
        let paymentReference: string | null = null;
        if (method.includes("Ref:")) {
            const parts = method.split("Ref:");
            paymentReference = parts[1]?.replace(/[()]/g, "").trim() || null;
            method = "GCash QR";
        }

        resultPayments.push({
            id: p.id,
            bookingId: p.booking_id,
            courtName: courtObj?.name ?? "Court",
            customerName,
            customerEmail: profile?.email ?? null,
            bookingDate: b?.booking_date ?? "",
            amount: Number(p.amount),
            currency: p.currency || "PHP",
            method,
            paymentReference,
            status: p.status as Payment["status"],
            createdAt: p.created_at,
        });
    }

    // Add bookings that don't have a record in public.payments yet (e.g. Cash walk-in, GCash QR, manual bookings)
    for (const b of bookingRows || []) {
        if (seenBookingIds.has(b.id)) continue;
        const courtObj = Array.isArray(b.courts) ? b.courts[0] : b.courts;
        const profile = b.customer_id ? profileMap.get(b.customer_id) : null;
        const customerName = getCustomerDisplayName(profile?.full_name, b.customer_id, profile?.email);
        const isPaid = b.payment_status === "succeeded" || (!b.payment_status && (b.status === "confirmed" || b.status === "completed"));
        const isRefunded = b.payment_status === "refunded";
        const isFailed = b.payment_status === "failed";
        const status: Payment["status"] = isRefunded
            ? "refunded"
            : isFailed
            ? "failed"
            : isPaid
            ? "succeeded"
            : "pending";

        let method = b.payment_method || "Cash walk in";
        let paymentReference: string | null = null;
        if (method.includes("Ref:")) {
            const parts = method.split("Ref:");
            paymentReference = parts[1]?.replace(/[()]/g, "").trim() || null;
            method = "GCash QR";
        }

        resultPayments.push({
            id: b.id,
            bookingId: b.id,
            courtName: courtObj?.name ?? "Court",
            customerName,
            customerEmail: profile?.email ?? null,
            bookingDate: b.booking_date,
            amount: Number(b.total_price),
            currency: "PHP",
            method,
            paymentReference,
            status,
            createdAt: b.created_at,
        });
    }

    // Add Open Play entries to the payments ledger
    for (const entry of openPlayEntries || []) {
        const { paymentMethod, paymentReference, isRefunded } = parseEntryPaymentMeta(
            entry.stripe_checkout_session_id
        );
        // Skip unpaid cancelled holds that were never paid or refunded
        if (entry.status === "cancelled" && !isRefunded) continue;

        const sessionObj: any = Array.isArray(entry.open_play_sessions)
            ? entry.open_play_sessions[0]
            : entry.open_play_sessions;
        const courtObj = Array.isArray(sessionObj?.courts)
            ? sessionObj.courts[0]
            : sessionObj?.courts;
        const profile = entry.customer_id ? profileMap.get(entry.customer_id) : null;
        const customerName = getCustomerDisplayName(
            profile?.full_name,
            entry.customer_id,
            profile?.email
        );

        const status: Payment["status"] = isRefunded
            ? "refunded"
            : entry.status === "paid" || entry.status === "needs_refund"
            ? "succeeded"
            : "pending";

        resultPayments.push({
            id: entry.id,
            bookingId: entry.id,
            courtName: `${courtObj?.name ?? "Court"} (Open Play)`,
            customerName,
            customerEmail: profile?.email ?? null,
            bookingDate: sessionObj?.session_date ?? "",
            amount: Number(entry.amount) || 0,
            currency: "PHP",
            method: paymentMethod,
            paymentReference,
            status,
            createdAt: entry.created_at,
        });
    }

    // Sort newest first
    return resultPayments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/**
 * Marks a payment as refunded in public.bookings, public.payments, or public.open_play_entries.
 */
export async function refundPayment(
    paymentId: string,
    bookingId?: string
): Promise<{ success: boolean; error?: string }> {
    const supabase = await getDbClient();
    const targetBookingId = bookingId || paymentId;

    // Check if this is an Open Play entry first
    const { data: openPlayEntry } = await supabase
        .from("open_play_entries")
        .select("id")
        .eq("id", targetBookingId)
        .maybeSingle();

    if (openPlayEntry) {
        const res = await markOpenPlayEntryRefundedByAdmin(openPlayEntry.id);
        return { success: res.ok, error: res.error };
    }

    // 1. Update booking
    const { data: updatedBooking } = await supabase
        .from("bookings")
        .update({
            payment_status: "refunded",
            status: "cancelled",
            cancelled_reason: "Refunded by administrator",
            updated_at: new Date().toISOString(),
        })
        .eq("id", targetBookingId)
        .select("id, customer_id")
        .maybeSingle();

    // Also clear any Open Play 'needs_refund' entry tied to this hold booking or customer
    if (updatedBooking?.customer_id) {
        const { data: pendingRefundEntries } = await supabase
            .from("open_play_entries")
            .select("id")
            .eq("customer_id", updatedBooking.customer_id)
            .eq("status", "needs_refund");

        for (const e of pendingRefundEntries || []) {
            await markOpenPlayEntryRefundedByAdmin(e.id);
        }
    }

    // 2. Update or insert in public.payments
    const { data: existingPayment } = await supabase
        .from("payments")
        .select("id")
        .or(`id.eq.${paymentId},booking_id.eq.${targetBookingId}`)
        .maybeSingle();

    if (existingPayment) {
        await supabase
            .from("payments")
            .update({ status: "refunded" })
            .eq("id", existingPayment.id);
    } else if (updatedBooking) {
        await supabase
            .from("payments")
            .insert({
                booking_id: targetBookingId,
                status: "refunded",
                currency: "PHP",
            });
    }

    if (updatedBooking) {
        await sendBookingRefundEmail(targetBookingId);
    }

    return { success: true };
}

/**
 * Marks a pending payment as paid. Preserves any existing payment method
 * (such as GCash QR with reference) instead of overwriting it to Cash.
 */
export async function markPaymentPaidInCash(
    paymentId: string,
    bookingId?: string
): Promise<{ success: boolean; error?: string }> {
    const supabase = await getDbClient();
    const targetBookingId = bookingId || paymentId;

    // Check if this is an Open Play entry first
    const { data: openPlayEntry } = await supabase
        .from("open_play_entries")
        .select("id")
        .eq("id", targetBookingId)
        .maybeSingle();

    if (openPlayEntry) {
        const res = await markOpenPlayEntryPaidByAdmin(openPlayEntry.id);
        return { success: res.ok, error: res.error };
    }

    // Retrieve existing booking to preserve its original payment_method (e.g. GCash with ref)
    const { data: booking } = await supabase
        .from("bookings")
        .select("id, payment_method, total_price")
        .eq("id", targetBookingId)
        .maybeSingle();

    const bookingMethod = booking?.payment_method || "Cash (Paid at Counter)";

    await supabase
        .from("bookings")
        .update({
            payment_status: "succeeded",
            status: "confirmed",
            payment_method: bookingMethod,
            updated_at: new Date().toISOString(),
        })
        .eq("id", targetBookingId);

    const { data: existingPayment } = await supabase
        .from("payments")
        .select("id, method")
        .or(`id.eq.${paymentId},booking_id.eq.${targetBookingId}`)
        .maybeSingle();

    const paymentMethodToRecord =
        existingPayment?.method ||
        (bookingMethod.toLowerCase().includes("gcash") ? "GCash" : bookingMethod);

    if (existingPayment) {
        await supabase
            .from("payments")
            .update({
                status: "succeeded",
                method: paymentMethodToRecord,
            })
            .eq("id", existingPayment.id);
    } else {
        await supabase
            .from("payments")
            .insert({
                booking_id: targetBookingId,
                status: "succeeded",
                amount: booking?.total_price || 0,
                method: paymentMethodToRecord,
                currency: "PHP",
            });
    }

    await sendPaymentReceiptEmail(targetBookingId);

    return { success: true };
}

/**
 * Called ONLY from the webhook (route.ts) or confirmation return sync.
 */
export async function markPaymentSucceeded(
    checkoutSessionId: string,
    paymentIntentId: string | null
): Promise<void> {
    const supabase = await getDbClient();

    const { data: payment } = await supabase
        .from("payments")
        .select("id, booking_id, status")
        .eq("stripe_checkout_session_id", checkoutSessionId)
        .single();

    // Not a session we recognize, or an event that raced ahead of our
    // own INSERT somehow — nothing sensible to do but stop quietly.
    if (!payment) return;

    // Idempotency guard (NFR-6): if this event has already been
    // processed — because Stripe delivered it twice — do nothing.
    // Re-running the update below would be harmless in itself, but
    // stopping early keeps the intent of "already handled" explicit.
    if (payment.status === "succeeded") return;

    await supabase
        .from("payments")
        .update({
            status: "succeeded",
            stripe_payment_intent_id: paymentIntentId,
            updated_at: new Date().toISOString(),
        })
        .eq("id", payment.id);

    await supabase
        .from("bookings")
        .update({
            status: "confirmed",
            payment_status: "succeeded",
            updated_at: new Date().toISOString(),
        })
        .eq("id", payment.booking_id)
        .neq("status", "cancelled");

    await sendPaymentReceiptEmail(payment.booking_id);
}

/**
 * Verifies a pending Stripe Checkout session when the customer returns to
 * /book/confirmation so Card payments mark as paid and trigger receipts even
 * when the Stripe CLI webhook listener is not running locally.
 */
export async function syncStripePaymentIfNeeded(bookingId: string): Promise<void> {
    try {
        const supabase = await getDbClient();
        const { data: payment } = await supabase
            .from("payments")
            .select("stripe_checkout_session_id, status")
            .eq("booking_id", bookingId)
            .maybeSingle();

        if (!payment || payment.status === "succeeded" || !payment.stripe_checkout_session_id) {
            return;
        }

        const session = await stripe.checkout.sessions.retrieve(payment.stripe_checkout_session_id);
        if (session.payment_status === "paid") {
            const paymentIntentId =
                typeof session.payment_intent === "string"
                    ? session.payment_intent
                    : (session.payment_intent?.id ?? null);
            await markPaymentSucceeded(session.id, paymentIntentId);
        }
    } catch {
        // Non-fatal fallback
    }
}

/**
 * Called when Stripe reports a checkout session expired without ever
 * being paid — this is what actually implements BR-6 (an unpaid
 * pending booking shouldn't block the slot forever), using Stripe's
 * own session-expiry event rather than a custom timer we'd have to
 * build and run ourselves.
 */
export async function markPaymentFailed(checkoutSessionId: string): Promise<void> {
    const supabase = createAdminClient();

    const { data: payment } = await supabase
        .from("payments")
        .select("id, booking_id, status")
        .eq("stripe_checkout_session_id", checkoutSessionId)
        .single();

    // Only act if we're still in 'pending' — if it already succeeded
    // (a completed event arrived first) or already failed (duplicate
    // delivery), there's nothing to do.
    if (!payment || payment.status !== "pending") return;

    await supabase
        .from("payments")
        .update({ status: "failed", updated_at: new Date().toISOString() })
        .eq("id", payment.id);

    await supabase
        .from("bookings")
        .update({
            status: "cancelled",
            payment_status: "failed",
            cancelled_reason: "Payment was not completed",
            updated_at: new Date().toISOString(),
        })
        .eq("id", payment.booking_id)
        .eq("status", "pending");
}