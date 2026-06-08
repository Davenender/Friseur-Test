import { Resend } from "resend";

let cachedResend: Resend | null = null;
function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  if (!cachedResend) cachedResend = new Resend(key);
  return cachedResend;
}

export function getMailEnv() {
  const from = process.env.MAIL_FROM || "noreply@example.com";
  const to = process.env.MAIL_TO || "noreply@example.com";
  return { from, to };
}

export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export interface MailAttachment {
  filename: string;
  content: string;
}

export async function sendMail(opts: {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  attachments?: MailAttachment[];
}) {
  const resend = getResend();
  if (!resend) {
    console.warn(
      `[mail] RESEND_API_KEY missing — skipping mail "${opts.subject}" to ${opts.to}`,
    );
    return { id: null, skipped: true };
  }
  const { from } = getMailEnv();
  const res = await resend.emails.send({
    from,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    text: opts.text,
    replyTo: opts.replyTo,
    attachments: opts.attachments?.map((a) => ({
      filename: a.filename,
      content: a.content,
    })),
  });
  if (res.error) {
    console.error(
      `[mail] Resend error for "${opts.subject}" → ${opts.to}: ${JSON.stringify(res.error, Object.getOwnPropertyNames(res.error))}`,
    );
  } else {
    console.log(
      `[mail] sent "${opts.subject}" → ${opts.to} (id=${res.data?.id})`,
    );
  }
  return res;
}

export function shell(title: string, body: string): string {
  return `<!doctype html><html><body style="margin:0;background:#faf7f2;padding:24px;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#1a1714;">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;padding:32px;border:1px solid #f1ebe0;">
      <div style="font-family:Georgia,serif;font-size:13px;letter-spacing:0.2em;text-transform:uppercase;color:#936a40;margin-bottom:6px;">Haarstudio Graziella</div>
      <h1 style="font-family:Georgia,serif;font-size:24px;margin:0 0 20px;color:#1a1714;">${escapeHtml(title)}</h1>
      ${body}
      <hr style="border:none;border-top:1px solid #f1ebe0;margin:28px 0 16px;" />
      <p style="font-size:12px;color:#7a6f64;margin:0;">Haarstudio Graziella · Friedrich-Ebert-Str. 8 · 63165 Mühlheim am Main · 06108 / 79 98 65</p>
    </div></body></html>`;
}
