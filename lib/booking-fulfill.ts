import { randomUUID } from "crypto";
import type Stripe from "stripe";
import {
  combineDateAndTime,
  getEmployeeLabel,
  SERVICES,
  type EmployeeId,
  type ServiceId,
} from "./booking";
import { buildICS } from "./ics";
import { escapeHtml, getMailEnv, sendMail, shell } from "./mail";

const SALON_ADDRESS = "Friedrich-Ebert-Str. 8, 63165 Mühlheim am Main";

export interface BookingData {
  service: ServiceId;
  employee: EmployeeId;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  notes?: string;
}

const FULFILLED = new Set<string>();

export async function fulfillBooking(
  data: BookingData,
  opts: { idempotencyKey?: string; depositPaidCents?: number } = {},
) {
  const key = opts.idempotencyKey || `${data.email}-${data.date}-${data.time}`;
  if (FULFILLED.has(key)) return { skipped: true as const };
  FULFILLED.add(key);

  const service = SERVICES.find((s) => s.id === data.service);
  if (!service) throw new Error(`Unknown service: ${data.service}`);

  const start = combineDateAndTime(data.date, data.time);
  const fullName = `${data.firstName} ${data.lastName}`.trim();
  const employeeLabel = getEmployeeLabel(data.employee);

  const dateStr = start.toLocaleDateString("de-DE", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const timeStr = start.toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const ics = buildICS({
    uid: `${randomUUID()}@haarstudio-graziella.de`,
    start,
    durationMinutes: service.minutes,
    summary: `${service.label} – ${fullName}`,
    description: `Mitarbeiter:in: ${employeeLabel}\nTelefon: ${data.phone}\nE-Mail: ${data.email}${data.notes ? `\n\n${data.notes}` : ""}`,
    location: SALON_ADDRESS,
    organizerEmail: process.env.MAIL_FROM?.match(/<(.+)>/)?.[1],
    attendeeEmail: data.email,
  });
  const icsAttachment = {
    filename: "termin.ics",
    content: Buffer.from(ics).toString("base64"),
  };

  // 1) Notification to salon
  const { to } = getMailEnv();
  await sendMail({
    to,
    subject: `Neue Buchung – ${dateStr} ${timeStr} – ${fullName}`,
    replyTo: data.email,
    html: shell(
      "Neue Terminbuchung",
      `
      <table style="width:100%;border-collapse:collapse;margin-bottom:8px;">
        <tr><td style="padding:8px 0;color:#7a6f64;width:160px;">Leistung</td><td style="padding:8px 0;font-weight:600;">${escapeHtml(service.label)}</td></tr>
        <tr><td style="padding:8px 0;color:#7a6f64;">Mitarbeiter:in</td><td style="padding:8px 0;font-weight:600;">${escapeHtml(employeeLabel)}</td></tr>
        <tr><td style="padding:8px 0;color:#7a6f64;">Termin</td><td style="padding:8px 0;font-weight:600;">${escapeHtml(dateStr)} um ${escapeHtml(timeStr)} Uhr</td></tr>
        <tr><td style="padding:8px 0;color:#7a6f64;">Dauer</td><td style="padding:8px 0;">${service.minutes} Minuten</td></tr>
        <tr><td style="padding:8px 0;color:#7a6f64;">Name</td><td style="padding:8px 0;">${escapeHtml(fullName)}</td></tr>
        <tr><td style="padding:8px 0;color:#7a6f64;">Telefon</td><td style="padding:8px 0;"><a href="tel:${escapeHtml(data.phone)}">${escapeHtml(data.phone)}</a></td></tr>
        <tr><td style="padding:8px 0;color:#7a6f64;">E-Mail</td><td style="padding:8px 0;"><a href="mailto:${escapeHtml(data.email)}">${escapeHtml(data.email)}</a></td></tr>
        ${opts.depositPaidCents ? `<tr><td style="padding:8px 0;color:#7a6f64;">Anzahlung</td><td style="padding:8px 0;font-weight:600;color:#936a40;">${(opts.depositPaidCents / 100).toFixed(2)} € (online bezahlt)</td></tr>` : ""}
      </table>
      ${data.notes ? `<p style="margin:20px 0 6px;font-weight:600;">Notizen:</p><p style="background:#faf7f2;padding:14px 16px;border-radius:10px;white-space:pre-wrap;margin:0;">${escapeHtml(data.notes)}</p>` : ""}
      <p style="margin:24px 0 0;color:#7a6f64;font-size:13px;">Im Anhang findest du eine .ics-Datei – ein Klick fügt den Termin direkt in deinen Kalender ein.</p>
      `,
    ),
    attachments: [icsAttachment],
  });

  // 2) Confirmation to customer
  await sendMail({
    to: data.email,
    subject: `Ihre Terminbuchung bei Haarstudio Graziella – ${dateStr}`,
    html: shell(
      "Vielen Dank für Ihre Buchung!",
      `
      <p style="margin:0 0 16px;">Liebe/r ${escapeHtml(data.firstName)},</p>
      <p style="margin:0 0 20px;">wir freuen uns auf Ihren Besuch. Hier die Details Ihres Termins:</p>
      <div style="background:#faf7f2;border-radius:12px;padding:20px;margin-bottom:20px;">
        <div style="font-size:13px;color:#936a40;text-transform:uppercase;letter-spacing:0.15em;margin-bottom:8px;">Termin</div>
        <div style="font-family:Georgia,serif;font-size:22px;color:#1a1714;">${escapeHtml(dateStr)}</div>
        <div style="font-family:Georgia,serif;font-size:32px;color:#936a40;margin-top:4px;">${escapeHtml(timeStr)} Uhr</div>
        <div style="margin-top:12px;color:#4a423b;">${escapeHtml(service.label)} · ca. ${service.minutes} Minuten</div>
        <div style="margin-top:4px;color:#4a423b;">bei ${escapeHtml(employeeLabel)}</div>
      </div>
      ${opts.depositPaidCents ? `<p style="margin:0 0 16px;color:#4a423b;">Ihre Anzahlung von <strong>${(opts.depositPaidCents / 100).toFixed(2)} €</strong> wurde verbucht und wird auf die Rechnung im Salon angerechnet.</p>` : ""}
      <p style="margin:0 0 6px;color:#7a6f64;font-size:14px;">Wo</p>
      <p style="margin:0 0 20px;">${escapeHtml(SALON_ADDRESS)}</p>
      <p style="margin:0;color:#7a6f64;font-size:14px;">Müssen Sie umplanen? Rufen Sie uns einfach unter <a href="tel:+4961087998 65" style="color:#936a40;">06108 / 79 98 65</a> an.</p>
      <p style="margin:24px 0 0;color:#7a6f64;font-size:13px;">Eine Kalender-Datei (.ics) finden Sie im Anhang.</p>
      `,
    ),
    attachments: [icsAttachment],
  });

  return { skipped: false as const };
}

export function bookingDataFromStripeSession(
  session: Stripe.Checkout.Session,
): BookingData | null {
  const md = session.metadata || {};
  if (md.kind !== "booking") return null;
  return {
    service: md.service as ServiceId,
    employee: (md.employee as EmployeeId) || "any",
    date: md.date as string,
    time: md.time as string,
    firstName: md.firstName as string,
    lastName: md.lastName as string,
    phone: md.phone as string,
    email: md.email as string,
    notes: md.notes || "",
  };
}
