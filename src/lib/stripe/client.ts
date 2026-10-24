import Stripe from "stripe";

let stripeInstance: Stripe | null = null;

export function getStripeClient(): Stripe {
  const apiKey = process.env.STRIPE_SECRET_KEY;
  if (!apiKey) {
    throw new Error(
      "Missing STRIPE_SECRET_KEY in environment variables. Please configure it in .env.local or your deployment settings."
    );
  }

  if (!stripeInstance) {
    stripeInstance = new Stripe(apiKey, {
      apiVersion: "2026-08-26.dahlia" as unknown as Stripe.LatestApiVersion,
      appInfo: {
        name: "Pickle WB",
        version: "0.1.0",
      },
    });
  }

  return stripeInstance;
}

// Exported as a lazy proxy so importing `stripe` during Next.js build-time
// page collection does not crash before runtime checkout sessions are created.
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    const client = getStripeClient();
    const val = Reflect.get(client, prop);
    return typeof val === "function" ? val.bind(client) : val;
  },
});