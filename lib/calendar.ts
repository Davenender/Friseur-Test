import { google, type calendar_v3 } from "googleapis";
import type { ServiceId } from "./booking";

export interface CalendarSlot {
  start: Date;
  end: Date;
}

const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || "primary";
const TIMEZONE = process.env.GOOGLE_CALENDAR_TIMEZONE || "Europe/Berlin";

function getClient(): calendar_v3.Calendar | null {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) return null;
  let credentials: { client_email: string; private_key: string };
  try {
    credentials = JSON.parse(raw);
  } catch {
    console.error("GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON");
    return null;
  }
  const auth = new google.auth.JWT({
    email: credentials.client_email,
    key: credentials.private_key.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/calendar"],
  });
  return google.calendar({ version: "v3", auth });
}

export async function getBusySlots(
  from: Date,
  to: Date,
): Promise<CalendarSlot[]> {
  const calendar = getClient();
  if (!calendar) return [];
  try {
    const res = await calendar.freebusy.query({
      requestBody: {
        timeMin: from.toISOString(),
        timeMax: to.toISOString(),
        timeZone: TIMEZONE,
        items: [{ id: CALENDAR_ID }],
      },
    });
    const busy = res.data.calendars?.[CALENDAR_ID]?.busy || [];
    return busy
      .filter((b) => b.start && b.end)
      .map((b) => ({ start: new Date(b.start!), end: new Date(b.end!) }));
  } catch (err) {
    console.error("Google Calendar freebusy error", err);
    return [];
  }
}

export async function createCalendarEvent(args: {
  summary: string;
  description: string;
  start: Date;
  end: Date;
  attendeeEmail: string;
  service: ServiceId;
}): Promise<{ ok: boolean; eventId?: string }> {
  const calendar = getClient();
  if (!calendar) return { ok: false };
  try {
    const res = await calendar.events.insert({
      calendarId: CALENDAR_ID,
      requestBody: {
        summary: args.summary,
        description: args.description,
        start: { dateTime: args.start.toISOString(), timeZone: TIMEZONE },
        end: { dateTime: args.end.toISOString(), timeZone: TIMEZONE },
        extendedProperties: { private: { service: args.service } },
      },
    });
    return { ok: true, eventId: res.data.id || undefined };
  } catch (err) {
    console.error("Google Calendar insert error", err);
    return { ok: false };
  }
}
