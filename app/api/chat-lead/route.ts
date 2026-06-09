import { NextResponse } from "next/server";
import { z } from "zod";
import { escapeHtml, getMailEnv, sendMail, shell } from "@/lib/mail";

export const runtime = "nodejs";

const leadSchema = z.object({
  name: z.string().trim().min(1, "Name erforderlich").max(120),
  email: z.string().trim().email("Ungültige E-Mail").max(160),
  question: z.string().trim().max(2000).optional().or(z.literal("")),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(2000),
      }),
    )
    .max(30)
    .optional()
    .default([]),
});

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage" }, { status: 400 });
  }

  const parsed = leadSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Ungültige Eingaben" },
      { status: 400 },
    );
  }

  const data = parsed.data;
  const { to } = getMailEnv();

  // Chat-Historie als lesbarer Text
  const historyText = data.history
    .map((m) => `${m.role === "user" ? "Kund:in" : "Lia"}: ${m.content}`)
    .join("\n\n");

  // 1) Notification an Salon (davidhes4a@gmail.com)
  await sendMail({
    to,
    replyTo: data.email,
    subject: `Chat-Lead von ${data.name} (Lia konnte nicht antworten)`,
    html: shell(
      "Neue Anfrage über den Chatbot",
      `
      <p style="margin:0 0 16px;">Lia konnte eine Frage nicht beantworten und hat um Kontaktdaten gebeten:</p>
      <table style="width:100%;border-collapse:collapse;margin-bottom:8px;">
        <tr><td style="padding:8px 0;color:#7a6f64;width:140px;">Name</td><td style="padding:8px 0;font-weight:600;">${escapeHtml(data.name)}</td></tr>
        <tr><td style="padding:8px 0;color:#7a6f64;">E-Mail</td><td style="padding:8px 0;"><a href="mailto:${escapeHtml(data.email)}">${escapeHtml(data.email)}</a></td></tr>
        ${data.question ? `<tr><td style="padding:8px 0;color:#7a6f64;vertical-align:top;">Frage</td><td style="padding:8px 0;">${escapeHtml(data.question)}</td></tr>` : ""}
      </table>
      ${historyText ? `<p style="margin:20px 0 6px;font-weight:600;">Chat-Verlauf:</p><pre style="background:#faf7f2;padding:14px 16px;border-radius:10px;white-space:pre-wrap;margin:0;font-family:inherit;font-size:13px;">${escapeHtml(historyText)}</pre>` : ""}
      <p style="margin:24px 0 0;color:#7a6f64;font-size:13px;">Antworten geht direkt auf diese Mail — landet bei der Kund:in.</p>
      `,
    ),
  });

  // 2) Bestätigung an Kund:in
  await sendMail({
    to: data.email,
    subject: `Danke ${data.name}! Wir melden uns bei dir.`,
    html: shell(
      "Vielen Dank für deine Nachricht!",
      `
      <p style="margin:0 0 16px;">Liebe/r ${escapeHtml(data.name)},</p>
      <p style="margin:0 0 16px;">danke für deine Frage über unseren Chat. Lia konnte dir nicht direkt antworten, aber Graziella oder Aurelia meldet sich persönlich bei dir — meist innerhalb eines Werktages.</p>
      <p style="margin:0 0 6px;color:#7a6f64;font-size:14px;">Brauchst du es eiliger? Ruf uns gerne an:</p>
      <p style="margin:0 0 20px;"><a href="tel:+4961087998 65" style="color:#936a40;font-weight:600;">06108 / 79 98 65</a></p>
      <p style="margin:0;color:#7a6f64;font-size:13px;">Liebe Grüße,<br/>dein Team von Haarstudio Graziella</p>
      `,
    ),
  });

  return NextResponse.json({ ok: true });
}
