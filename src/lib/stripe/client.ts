import Stripe from "stripe";

/**
 * A single shared Stripe SDK instance, built from the SECRET key.
 * This file must never be imported into anything that ships to the
 * browser — STRIPE_SECRET_KEY has no NEXT_PUBLIC_ prefix specifically
 * so Next.js refuses to bundle it into client-side JavaScript. This
 * client is only ever used from Server Actions / server code (see
 * payment.service.ts), never from a "use client" component.
 *
 * apiVersion is deliberately left unset here — the Stripe SDK will
 * use the version tied to your installed `stripe` package. Once
 * you're closer to production, check Stripe's dashboard/docs for the
 * current API version and pin it explicitly for stability.
 */
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-08-26.dahlia", // specify the API version here
  appInfo: {
    name: "Pickle WB",
    version: "0.1.0",
  },
});