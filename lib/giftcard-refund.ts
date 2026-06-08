import type Stripe from "stripe";
import { getStripe } from "./stripe";
import { formatEUR } from "./voucher";
import { escapeHtml, getMailEnv, sendMail, shell } from "./mail";

/**
 * Stripe-Coupons sind „one-shot": ein 50 €-Code auf eine 25 €-Bestellung
 * wird komplett verbraucht (auch wenn nur 25 € rabattiert wurden).
 *
 * Diese Funktion prüft nach jeder Buchung, ob ein Gutschein-Code verwendet
 * wurde. Wenn ja UND noch Restguthaben übrig ist, wird der alte Coupon
 * deaktiviert und ein neuer Coupon + Promotion-Code mit dem gleichen Code
 * + dem Restbetrag erzeugt.
 *
 * Idempotent pro Session ID.
 */
const REFUNDED = new Set<string>();

export async function rolloverGiftCardBalance(sessionId: string) {
  console.log(`[giftcard-refund] called for session ${sessionId}`);
  if (REFUNDED.has(sessionId)) {
    console.log(`[giftcard-refund] already processed — skip`);
    return;
  }
  REFUNDED.add(sessionId);

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["total_details.breakdown.discounts.discount"],
  });

  const discounts = session.total_details?.breakdown?.discounts || [];
  console.log(
    `[giftcard-refund] payment_status=${session.payment_status} amount_total=${session.amount_total} amount_discount=${session.total_details?.amount_discount} discounts=${discounts.length}`,
  );
  if (discounts.length === 0) return;

  const customerEmail =
    session.customer_email || session.customer_details?.email || "";

  for (const d of discounts) {
    // Stripe SDK types are buggy here; the runtime shape is the standard
    // Discount object with `source: { coupon, type }`.
    const discountObj = d.discount as unknown as {
      source?: { coupon?: string | { id: string } };
    } | null;
    const couponRef = discountObj?.source?.coupon;
    if (!couponRef) {
      console.log(`[giftcard-refund] discount has no source.coupon — skip`);
      continue;
    }
    const couponId =
      typeof couponRef === "string" ? couponRef : couponRef.id;
    await processCouponRollover(stripe, couponId, d.amount, customerEmail);
  }
}

async function processCouponRollover(
  stripe: Stripe,
  couponId: string,
  amountUsed: number,
  customerEmail: string,
) {
  let coupon;
  try {
    coupon = await stripe.coupons.retrieve(couponId);
  } catch (err) {
    console.warn(
      `[giftcard-refund] could not retrieve coupon ${couponId}:`,
      err,
    );
    return;
  }
  const md = coupon.metadata || {};
  if (md.kind !== "gift_card") {
    console.log(
      `[giftcard-refund] coupon ${couponId} is not a gift card (kind=${md.kind || "n/a"}) — skip`,
    );
    return;
  }

  const code = md.gift_card_code;
  if (!code) {
    console.warn(`[giftcard-refund] gift card coupon has no code metadata`);
    return;
  }

  const currentBalance = parseInt(md.current_balance_cents || "0", 10);
  const newBalance = Math.max(0, currentBalance - amountUsed);
  console.log(
    `[giftcard-refund] code=${code} balance=${currentBalance} used=${amountUsed} → newBalance=${newBalance}`,
  );

  // Deactivate any remaining active promo codes for this code
  const list = await stripe.promotionCodes.list({
    code,
    active: true,
    limit: 10,
  });
  for (const pc of list.data) {
    try {
      await stripe.promotionCodes.update(pc.id, { active: false });
      console.log(`[giftcard-refund] deactivated promo ${pc.id}`);
    } catch (err) {
      console.warn(
        `[giftcard-refund] failed to deactivate promo ${pc.id}:`,
        err,
      );
    }
  }

  if (newBalance <= 0) {
    console.log(`[giftcard-refund] code ${code} fully used`);
    if (customerEmail) {
      await sendMail({
        to: customerEmail,
        subject: `Gutschein vollständig eingelöst`,
        html: shell(
          "Gutschein eingelöst",
          `<p>Ihr Gutscheincode <strong>${escapeHtml(code)}</strong> wurde vollständig eingelöst. Vielen Dank!</p>`,
        ),
      });
    }
    return;
  }

  // Create rollover coupon + promo code with same user-facing code
  try {
    const newCoupon = await stripe.coupons.create({
      amount_off: newBalance,
      currency: "eur",
      duration: "once",
      name: `Gutschein-Restguthaben ${formatEUR(newBalance)}`,
      max_redemptions: 1,
      metadata: {
        kind: "gift_card",
        gift_card_code: code,
        current_balance_cents: String(newBalance),
        original_amount_cents:
          md.original_amount_cents || String(currentBalance),
      },
    });
    await stripe.promotionCodes.create({
      promotion: { type: "coupon", coupon: newCoupon.id },
      code,
      max_redemptions: 1,
    });
    console.log(
      `[giftcard-refund] ✓ rolled over ${code}: ${formatEUR(currentBalance)} → ${formatEUR(newBalance)}`,
    );

    if (customerEmail) {
      await sendMail({
        to: customerEmail,
        subject: `Ihr Gutschein-Restguthaben: ${formatEUR(newBalance)}`,
        html: shell(
          "Restguthaben Ihres Gutscheins",
          `
          <p style="margin:0 0 16px;">Vielen Dank für Ihre Buchung! Ihr Gutscheincode hat noch ein Restguthaben:</p>
          <div style="background:linear-gradient(135deg,#faf7f2,#e8d3c5);border-radius:16px;padding:24px;text-align:center;margin:0 0 20px;">
            <div style="font-family:Georgia,serif;font-size:13px;letter-spacing:0.25em;text-transform:uppercase;color:#936a40;">Restguthaben</div>
            <div style="font-family:Georgia,serif;font-size:40px;color:#1a1714;margin:6px 0 14px;">${escapeHtml(formatEUR(newBalance))}</div>
            <div style="font-size:12px;color:#7a6f64;margin-bottom:8px;">Code</div>
            <div style="font-family:'Courier New',monospace;font-size:20px;letter-spacing:0.15em;color:#1a1714;background:#fff;padding:12px 18px;border-radius:10px;display:inline-block;border:1px dashed #b8895a;">${escapeHtml(code)}</div>
          </div>
          <p style="margin:0;color:#7a6f64;font-size:14px;">Lösen Sie den Code beim nächsten Online-Termin einfach wieder ein.</p>
          `,
        ),
      });
    }

    const { to } = getMailEnv();
    await sendMail({
      to,
      subject: `Gutschein-Restguthaben: ${formatEUR(newBalance)} (Code ${code})`,
      html: shell(
        "Gutschein-Restguthaben",
        `<p>Code <strong>${escapeHtml(code)}</strong>: Nach dieser Buchung verbleibt ein Restguthaben von <strong>${escapeHtml(formatEUR(newBalance))}</strong> (vorher ${escapeHtml(formatEUR(currentBalance))}, eingelöst ${escapeHtml(formatEUR(amountUsed))}).</p>`,
      ),
    });
  } catch (err) {
    console.error(
      `[giftcard-refund] ✗ failed to create rollover coupon for ${code}:`,
      err,
    );
  }
}
