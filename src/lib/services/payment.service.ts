import { stripe } from "@/lib/stripe/client";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { CheckoutResult, Payment } from "@/lib/types/domain";

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

export async function createCheckoutSession(
    input: CreateCheckoutSessionInput
): Promise<CheckoutResult> {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

    try {
        const session = await stripe.checkout.sessions.create({
            mode: "payment",
            payment_method_types: ["card"],
            customer_email: input.customerEmail || undefined,
            line_items: [
                {
                    price_data: {
                        currency: "usd",
                        product_data: {
                            // What the customer sees on Stripe's payment page —
                            // make it specific enough that they recognize the charge.
                            name: `${input.courtName} — ${input.bookingDate} ${input.startTime}-${input.endTime}`,
                        },
                        // Stripe always works in the smallest unit of the
                        // currency (cents for USD), never dollars-and-cents as a
                        // decimal — so $37.50 has to become 3750 here.
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
            currency: "usd",
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

// Raw shape from the nested join below — payments joined to bookings,
// which is itself joined to courts and profiles. Two levels deep.
interface PaymentRow {
    id: string;
    booking_id: string;
    amount: number;
    currency: string;
    status: string;
    created_at: string;
    bookings: {
        booking_date: string;
        courts: { name: string } | null;
        profiles: { full_name: string | null; email: string | null } | null;
    } | null;
}

/**
 * Admin payments list (FR-10.1). Same "follow the foreign key"
 * join syntax as booking.service.ts, just nested one level deeper:
 * payments -> bookings -> courts / profiles. Reading it inside-out:
 * for each payment, also fetch its booking, and for that booking,
 * also fetch its court name and customer info.
 */
export async function getAllPayments(): Promise<Payment[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("payments")
        .select(
            `
      id, booking_id, amount, currency, status, created_at,
      bookings (
        booking_date,
        courts ( name ),
        profiles ( full_name, email )
      )
      `
        )
        .order("created_at", { ascending: false });

    if (error || !data) return [];

    return (data as unknown as PaymentRow[]).map((row) => ({
        id: row.id,
        bookingId: row.booking_id,
        courtName: row.bookings?.courts?.name ?? "Unknown court",
        customerName: row.bookings?.profiles?.full_name ?? null,
        customerEmail: row.bookings?.profiles?.email ?? null,
        bookingDate: row.bookings?.booking_date ?? "",
        amount: Number(row.amount),
        currency: row.currency,
        status: row.status as Payment["status"],
        createdAt: row.created_at,
    }));
}

/**
 * Called ONLY from the webhook (route.ts), never from anything the
 * browser can trigger. This is the one place in the whole app that's
 * allowed to move a booking from 'pending' to 'confirmed'.
 *
 * Note: this deliberately writes its own small Supabase queries
 * using the ADMIN client, rather than reusing cancelBooking() or
 * other functions from booking.service.ts. Those functions all use
 * lib/supabase/server.ts, which expects a logged-in user's cookies —
 * something a webhook call from Stripe's servers simply doesn't
 * have. Mixing the two clients would be a subtle, easy-to-miss bug,
 * so this stays self-contained instead.
 */
export async function markPaymentSucceeded(
    checkoutSessionId: string,
    paymentIntentId: string | null
): Promise<void> {
    const supabase = createAdminClient();

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
        .update({ status: "confirmed", updated_at: new Date().toISOString() })
        .eq("id", payment.booking_id)
        // Only flip it if it's still pending — guards against a very odd
        // edge case where a booking was already cancelled some other way
        // (e.g. an admin cancelled it) before this event arrived.
        .eq("status", "pending");
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
            cancelled_reason: "Payment was not completed",
            updated_at: new Date().toISOString(),
        })
        .eq("id", payment.booking_id)
        .eq("status", "pending");
}