import { NextResponse } from "next/server";
import { bookingSchema } from "@/lib/schema";
import { combineDateAndTime, SERVICES } from "@/lib/booking";
import { fulfillBooking } from "@/lib/booking-fulfill";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage" }, { status: 400 });
  }

  const parsed = bookingSchema.safeParse(payload);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]?.message || "Ungültige Eingaben";
    return NextResponse.json(
      { error: firstIssue, issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const data = parsed.data;
  if (data.website && data.website.length > 0) {
    return NextResponse.json({ ok: true });
  }

  const service = SERVICES.find((s) => s.id === data.service);
  if (!service) {
    return NextResponse.json({ error: "Unbekannte Leistung" }, { status: 400 });
  }

  const start = combineDateAndTime(data.date, data.time);
  if (start.getTime() < Date.now() + 60 * 60_000) {
    return NextResponse.json(
      { error: "Termin liegt zu kurzfristig in der Zukunft." },
      { status: 400 },
    );
  }

  // Free service → fulfill immediately
  if (service.depositCents === 0) {
    try {
      await fulfillBooking({
        service: data.service,
        employee: data.employee,
        date: data.date,
        time: data.time,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        email: data.email,
        notes: data.notes || undefined,
      });
      return NextResponse.json({ ok: true, free: true });
    } catch (err) {
      console.error("Booking fulfill error", err);
      return NextResponse.json(
        { error: "Buchung konnte nicht abgeschlossen werden." },
        { status: 500 },
      );
    }
  }

  // Paid: redirect to Stripe Checkout
  try {
    const stripe = getStripe();
    const origin =
      request.headers.get("origin") ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: data.email,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "eur",
            unit_amount: service.depositCents,
            product_data: {
              name: `Anzahlung – ${service.label}`,
              description: `Termin am ${data.date} um ${data.time} Uhr. Wird im Salon auf die Rechnung angerechnet.`,
            },
          },
        },
      ],
      metadata: {
        kind: "booking",
        service: data.service,
        employee: data.employee,
        date: data.date,
        time: data.time,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        email: data.email,
        notes: (data.notes || "").slice(0, 480),
      },
      allow_promotion_codes: true,
      success_url: `${origin}/buchung/erfolg?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/#termin`,
    });

    return NextResponse.json({ ok: true, checkoutUrl: session.url });
  } catch (err) {
    console.error("Stripe session error", err);
    return NextResponse.json(
      { error: "Bezahlseite konnte nicht geöffnet werden." },
      { status: 500 },
    );
  }
}
