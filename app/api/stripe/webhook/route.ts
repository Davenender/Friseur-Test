import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { fulfillGiftCard } from "@/lib/giftcard-mail";
import { rolloverGiftCardBalance } from "@/lib/giftcard-refund";
import {
  bookingDataFromStripeSession,
  fulfillBooking,
} from "@/lib/booking-fulfill";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const stripe = getStripe();
  const sig = request.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const body = await request.text();

  let event: Stripe.Event;
  try {
    if (sig && secret) {
      event = stripe.webhooks.constructEvent(body, sig, secret);
    } else {
      console.warn("Stripe webhook running WITHOUT signature verification");
      event = JSON.parse(body) as Stripe.Event;
    }
  } catch (err) {
    return NextResponse.json(
      { error: `Webhook Error: ${(err as Error).message}` },
      { status: 400 },
    );
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    try {
      const kind = session.metadata?.kind;
      if (kind === "gift_card") {
        await fulfillGiftCard(session);
      } else if (kind === "booking") {
        const data = bookingDataFromStripeSession(session);
        if (data) {
          await fulfillBooking(data, {
            idempotencyKey: session.id,
            depositPaidCents: session.amount_total || 0,
          });
        }
        await rolloverGiftCardBalance(session.id);
      }
    } catch (err) {
      console.error("Fulfillment error", err);
      return NextResponse.json({ error: "Fulfillment failed" }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
