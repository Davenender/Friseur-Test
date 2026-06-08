import Link from "next/link";
import { getStripe } from "@/lib/stripe";
import { fulfillGiftCard } from "@/lib/giftcard-mail";
import { formatEUR } from "@/lib/voucher";

export const dynamic = "force-dynamic";

export default async function GiftCardSuccess({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;

  let amount = 0;
  let buyerEmail = "";
  if (session_id) {
    try {
      const stripe = getStripe();
      const session = await stripe.checkout.sessions.retrieve(session_id);
      amount = session.amount_total || 0;
      buyerEmail = session.customer_email || "";
      // Fallback fulfillment in case webhook hasn't fired (idempotent).
      await fulfillGiftCard(session);
    } catch (err) {
      console.error("Success page fulfillment error", err);
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
          Gutschein gekauft
        </p>
        <h1 className="mt-3 font-display text-3xl text-ink">Vielen Dank!</h1>
        {amount > 0 && (
          <p className="mt-4 text-ink-soft">
            Ihr Gutschein über{" "}
            <strong className="text-ink">{formatEUR(amount)}</strong> wurde
            soeben per E-Mail
            {buyerEmail ? ` an ${buyerEmail}` : ""} verschickt.
          </p>
        )}
        <p className="mt-2 text-sm text-ink-soft">
          Falls Sie nichts erhalten, prüfen Sie bitte Ihren Spam-Ordner oder
          rufen Sie uns an.
        </p>
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
