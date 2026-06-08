import Link from "next/link";
import { getStripe } from "@/lib/stripe";
import {
  bookingDataFromStripeSession,
  fulfillBooking,
} from "@/lib/booking-fulfill";
import { rolloverGiftCardBalance } from "@/lib/giftcard-refund";
import { combineDateAndTime, SERVICES } from "@/lib/booking";

export const dynamic = "force-dynamic";

export default async function BookingSuccess({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;

  let displayDate = "";
  let displayTime = "";
  let serviceLabel = "";
  let depositCents = 0;
  let email = "";

  if (session_id) {
    try {
      const stripe = getStripe();
      const session = await stripe.checkout.sessions.retrieve(session_id);
      const data = bookingDataFromStripeSession(session);
      if (data && session.payment_status === "paid") {
        // Idempotent: only fulfills once per (email,date,time)
        try {
          await fulfillBooking(data, {
            idempotencyKey: session.id,
            depositPaidCents: session.amount_total || 0,
          });
        } catch (err) {
          console.error("[booking-success] fulfillBooking failed", err);
        }
        try {
          await rolloverGiftCardBalance(session.id);
        } catch (err) {
          console.error("[booking-success] rolloverGiftCardBalance failed", err);
        }
        const service = SERVICES.find((s) => s.id === data.service);
        const dt = combineDateAndTime(data.date, data.time);
        displayDate = dt.toLocaleDateString("de-DE", {
          weekday: "long",
          day: "2-digit",
          month: "long",
          year: "numeric",
        });
        displayTime = dt.toLocaleTimeString("de-DE", {
          hour: "2-digit",
          minute: "2-digit",
        });
        serviceLabel = service?.label || "";
        depositCents = session.amount_total || 0;
        email = data.email;
      }
    } catch (err) {
      console.error("Booking success page error", err);
    }
  }

  return (
    <main className="flex-1 bg-cream py-24">
      <div className="mx-auto max-w-xl rounded-3xl bg-white px-8 py-14 text-center shadow-sm ring-1 ring-cream-dark">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-rose">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-8 w-8 text-accent-dark"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent-dark">
          Buchung bestätigt
        </p>
        <h1 className="mt-3 font-display text-3xl text-ink">
          Wir freuen uns auf Sie!
        </h1>
        {displayDate && (
          <div className="mt-6 rounded-2xl bg-cream px-6 py-5">
            <div className="text-sm text-ink-soft">{serviceLabel}</div>
            <div className="mt-1 font-display text-xl text-ink">
              {displayDate}
            </div>
            <div className="font-display text-3xl text-accent-dark">
              {displayTime} Uhr
            </div>
          </div>
        )}
        {depositCents > 0 && (
          <p className="mt-5 text-sm text-ink-soft">
            Anzahlung von{" "}
            <strong>{(depositCents / 100).toFixed(2)} €</strong> erfolgreich
            gezahlt – wird im Salon auf die Rechnung angerechnet.
          </p>
        )}
        {email && (
          <p className="mt-2 text-sm text-ink-soft">
            Bestätigung an <strong>{email}</strong> verschickt.
          </p>
        )}
        <Link
          href="/"
          className="mt-8 inline-flex items-center justify-center rounded-full bg-ink px-7 py-3 text-sm font-semibold uppercase tracking-wider text-cream transition hover:bg-accent-dark"
        >
          Zurück zur Startseite
        </Link>
      </div>
    </main>
  );
}
