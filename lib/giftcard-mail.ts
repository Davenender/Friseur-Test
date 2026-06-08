import type Stripe from "stripe";
import { escapeHtml, getMailEnv, sendMail, shell } from "./mail";
import { getStripe } from "./stripe";
import { formatEUR, generateVoucherCode } from "./voucher";

/**
 * Erstellt einen Stripe-Coupon + Promotion-Code, sodass der Gutschein-Code
 * beim Buchen einer Anzahlung als Rabatt eingelöst werden kann.
 * Bei Booking-Checkout-Sessions ist `allow_promotion_codes: true` gesetzt,
 * d.h. Kund:innen geben den Code direkt auf der Stripe-Seite ein.
 */
async function createStripePromotionCode(code: string, amountCents: number) {
  const stripe = getStripe();
  const coupon = await stripe.coupons.create({
    amount_off: amountCents,
    currency: "eur",
    duration: "once",
    name: `Gutschein ${formatEUR(amountCents)}`,
    max_redemptions: 1,
    metadata: {
      kind: "gift_card",
      gift_card_code: code,
      current_balance_cents: String(amountCents),
      original_amount_cents: String(amountCents),
    },
  });
  await stripe.promotionCodes.create({
    promotion: { type: "coupon", coupon: coupon.id },
    code,
    max_redemptions: 1,
  });
}

// Simple in-memory idempotency cache — prevents double-fulfillment within
// a single server lifetime (webhook + success page may fire close together).
const FULFILLED = new Set<string>();

export async function fulfillGiftCard(session: Stripe.Checkout.Session) {
  if (FULFILLED.has(session.id)) return;
  FULFILLED.add(session.id);

  const md = session.metadata || {};
  if (md.kind !== "gift_card") return;
  if (session.payment_status !== "paid") return;

  const buyerEmail = md.buyer_email || session.customer_email || "";
  const buyerName = md.buyer_name || "Kundin/Kunde";
  const recipientName = md.recipient_name || "";
  const personalMessage = md.personal_message || "";
  const amountCents = session.amount_total || 0;
  const code = generateVoucherCode();
  const { to } = getMailEnv();

  try {
    await createStripePromotionCode(code, amountCents);
  } catch (err) {
    console.error("[giftcard] failed to create Stripe promotion code", err);
  }

  // Voucher to buyer
  if (buyerEmail) {
    await sendMail({
      to: buyerEmail,
      subject: `Ihr Gutschein über ${formatEUR(amountCents)} – Haarstudio Graziella`,
      html: shell(
        "Ihr Gutschein ist bereit",
        `
        <p style="margin:0 0 16px;">Liebe/r ${escapeHtml(buyerName)},</p>
        <p style="margin:0 0 24px;">vielen Dank für Ihren Kauf! Ihr Gutschein ist im Salon einlösbar.</p>
        <div style="background:linear-gradient(135deg,#faf7f2,#e8d3c5);border-radius:16px;padding:28px;text-align:center;margin-bottom:24px;border:1px solid #f1ebe0;">
          <div style="font-family:Georgia,serif;font-size:13px;letter-spacing:0.25em;text-transform:uppercase;color:#936a40;">Gutschein</div>
          <div style="font-family:Georgia,serif;font-size:44px;color:#1a1714;margin:8px 0 14px;">${escapeHtml(formatEUR(amountCents))}</div>
          <div style="font-size:12px;color:#7a6f64;margin-bottom:8px;">Gutscheincode</div>
          <div style="font-family:'Courier New',monospace;font-size:22px;letter-spacing:0.15em;color:#1a1714;background:#fff;padding:14px 20px;border-radius:10px;display:inline-block;border:1px dashed #b8895a;">${escapeHtml(code)}</div>
          ${recipientName ? `<div style="margin-top:18px;color:#4a423b;">Für <strong>${escapeHtml(recipientName)}</strong></div>` : ""}
        </div>
        ${personalMessage ? `<p style="margin:0 0 6px;color:#7a6f64;font-size:13px;text-transform:uppercase;letter-spacing:0.15em;">Persönliche Nachricht</p><p style="background:#faf7f2;padding:14px 16px;border-radius:10px;white-space:pre-wrap;margin:0 0 20px;font-style:italic;">${escapeHtml(personalMessage)}</p>` : ""}
        <p style="margin:0 0 6px;color:#7a6f64;font-size:14px;">Einlösbar bei:</p>
        <p style="margin:0 0 20px;"><strong>Haarstudio Graziella</strong><br/>Friedrich-Ebert-Str. 8, 63165 Mühlheim am Main</p>
        <p style="margin:0 0 20px;color:#4a423b;font-size:14px;">💡 <strong>Tipp:</strong> Sie können den Code auch <strong>direkt beim Online-Buchen</strong> einer Anzahlung einlösen — einfach im Stripe-Checkout auf "Gutscheincode hinzufügen" klicken.</p>
        <p style="margin:0;color:#7a6f64;font-size:13px;">Bei Fragen erreichen Sie uns unter 06108 / 79 98 65.</p>
        `,
      ),
    });
  }

  // Notification to salon
  await sendMail({
    to,
    subject: `Neuer Gutschein verkauft – ${formatEUR(amountCents)}`,
    html: shell(
      "Neuer Gutschein-Verkauf",
      `
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:8px 0;color:#7a6f64;width:160px;">Betrag</td><td style="padding:8px 0;font-weight:600;">${escapeHtml(formatEUR(amountCents))}</td></tr>
        <tr><td style="padding:8px 0;color:#7a6f64;">Code</td><td style="padding:8px 0;font-family:monospace;">${escapeHtml(code)}</td></tr>
        <tr><td style="padding:8px 0;color:#7a6f64;">Käufer:in</td><td style="padding:8px 0;">${escapeHtml(buyerName)} (${escapeHtml(buyerEmail)})</td></tr>
        ${recipientName ? `<tr><td style="padding:8px 0;color:#7a6f64;">Empfänger:in</td><td style="padding:8px 0;">${escapeHtml(recipientName)}</td></tr>` : ""}
        <tr><td style="padding:8px 0;color:#7a6f64;">Stripe Session</td><td style="padding:8px 0;font-family:monospace;font-size:12px;">${escapeHtml(session.id)}</td></tr>
      </table>
      ${personalMessage ? `<p style="margin:20px 0 6px;font-weight:600;">Persönliche Nachricht:</p><p style="background:#faf7f2;padding:14px 16px;border-radius:10px;white-space:pre-wrap;margin:0;">${escapeHtml(personalMessage)}</p>` : ""}
      `,
    ),
  });

  return { code };
}
