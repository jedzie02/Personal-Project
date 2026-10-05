import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe/client";
import { markPaymentFailed, markPaymentSucceeded } from "@/lib/services/payment.service";

/**
 * This is a real Next.js Route Handler — the "one true API route"
 * from Phase 1's architecture notes. Stripe's servers send a POST
 * request here directly; there's no browser and no logged-in user
 * involved at all.
 */
export async function POST(request: Request) {
    // Signature verification needs the RAW, byte-for-byte request body
    // — not a JSON-parsed version of it. request.text() gives us that
    // raw text exactly as Stripe sent it, which constructEvent() below
    // needs in order to check the signature correctly.
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
        return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
        // This is the actual security check: it recomputes the expected
        // signature using our shared secret and compares it to the one
        // Stripe sent. If they don't match — because the request wasn't
        // really from Stripe, or the body was tampered with — this
        // throws, and we reject the request.
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
    } catch (err) {
        console.error("Stripe webhook signature verification failed:", err);
        return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    switch (event.type) {
        case "checkout.session.completed": {
            const session = event.data.object as Stripe.Checkout.Session;

            // payment_intent can come back as either a string id or an
            // expanded object, depending on the request — this handles both.
            const paymentIntentId =
                typeof session.payment_intent === "string"
                    ? session.payment_intent
                    : (session.payment_intent?.id ?? null);

            await markPaymentSucceeded(session.id, paymentIntentId);
            break;
        }

        case "checkout.session.expired": {
            const session = event.data.object as Stripe.Checkout.Session;
            await markPaymentFailed(session.id);
            break;
        }

        default:
            // We don't act on every event type Stripe can send — only the
            // two above matter to this app right now. We still return 200
            // for anything else, though: returning an error would make
            // Stripe think delivery failed and keep retrying an event we
            // were never going to handle anyway.
            break;
    }

    // 200 tells Stripe "received and handled — don't retry this one."
    return NextResponse.json({ received: true });
}