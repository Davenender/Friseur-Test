import { NextResponse } from "next/server";
import { giftCardSchema } from "@/lib/schema";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage" }, { status: 400 });
  }

  const parsed = giftCardSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Eingaben unvollständig", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const data = parsed.data;
  const amountCents = Math.round(data.amount * 100);

  const stripe = getStripe();
  const origin =
    request.headers.get("origin") ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    customer_email: data.buyerEmail,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: amountCents,
          product_data: {
            name: `Gutschein Haarstudio Graziella – ${data.amount} €`,
            description: data.recipientName
              ? `Für ${data.recipientName}`
              : "Digitaler Gutschein – einlösbar im Salon",
          },
        },
      },
    ],
    metadata: {
      kind: "gift_card",
      amount_eur: String(data.amount),
      buyer_name: data.buyerName,
      buyer_email: data.buyerEmail,
      recipient_name: data.recipientName || "",
      personal_message: data.personalMessage || "",
    },
    success_url: `${origin}/gutschein/erfolg?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/#gutschein`,
  });

  return NextResponse.json({ url: session.url });
}
