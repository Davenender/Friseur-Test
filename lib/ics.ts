function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function toICSDate(d: Date): string {
  return (
    d.getUTCFullYear().toString() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    "T" +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    "Z"
  );
}

function escapeICS(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

export interface ICSEvent {
  uid: string;
  start: Date;
  durationMinutes: number;
  summary: string;
  description: string;
  location: string;
  organizerEmail?: string;
  attendeeEmail?: string;
}

export function buildICS(e: ICSEvent): string {
  const end = new Date(e.start.getTime() + e.durationMinutes * 60_000);
  const now = new Date();
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Haarstudio Graziella//Booking//DE",
    "CALSCALE:GREGORIAN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:${e.uid}`,
    `DTSTAMP:${toICSDate(now)}`,
    `DTSTART:${toICSDate(e.start)}`,
    `DTEND:${toICSDate(end)}`,
    `SUMMARY:${escapeICS(e.summary)}`,
    `DESCRIPTION:${escapeICS(e.description)}`,
    `LOCATION:${escapeICS(e.location)}`,
    e.organizerEmail ? `ORGANIZER:mailto:${e.organizerEmail}` : null,
    e.attendeeEmail ? `ATTENDEE;RSVP=TRUE:mailto:${e.attendeeEmail}` : null,
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);
  return lines.join("\r\n");
}
