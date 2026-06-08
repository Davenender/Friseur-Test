export const SLOT_MINUTES = 45;

export const OPENING = {
  // 0 = Sunday, 1 = Monday, ... 6 = Saturday
  1: { start: "09:00", end: "18:30" },
  2: { start: "09:00", end: "18:30" },
  3: { start: "09:00", end: "18:30" },
  4: { start: "09:00", end: "18:30" },
  5: { start: "09:00", end: "18:30" },
  6: { start: "08:30", end: "14:00" },
} as const;

export const MIN_LEAD_HOURS = 2;
export const MAX_ADVANCE_DAYS = 60;

// Mitarbeiter:innen — Foto-URLs später durch echte Salon-Fotos ersetzen.
export const EMPLOYEES = [
  {
    id: "graziella",
    name: "Graziella",
    role: "Inhaberin · Master-Stylistin",
    photo:
      "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "sandra",
    name: "Sandra",
    role: "Stylistin · Colorations-Expertin",
    photo:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80",
  },
] as const;

export type EmployeeId = (typeof EMPLOYEES)[number]["id"] | "any";

// Preise in Cent. depositCents = Anzahlung, die online via Stripe gezahlt wird.
// Der Rest wird im Salon bezahlt. depositCents=0 = kostenlos / keine Anzahlung nötig.
export const SERVICES = [
  { id: "schnitt", label: "Schnitt", minutes: 45, priceLabel: "ab 35 €", depositCents: 1000 },
  { id: "farbe", label: "Coloration", minutes: 90, priceLabel: "ab 65 €", depositCents: 2000 },
  { id: "straehnen", label: "Strähnen", minutes: 120, priceLabel: "ab 85 €", depositCents: 2500 },
  { id: "keratin", label: "Keratinglättung", minutes: 180, priceLabel: "ab 180 €", depositCents: 5000 },
  { id: "beratung", label: "Kostenlose Beratung", minutes: 30, priceLabel: "kostenlos", depositCents: 0 },
] as const;

export type ServiceId = (typeof SERVICES)[number]["id"];

export function getEmployeeLabel(id: EmployeeId): string {
  if (id === "any") return "Egal welche:r";
  return EMPLOYEES.find((e) => e.id === id)?.name || id;
}

function parseHM(hm: string): [number, number] {
  const [h, m] = hm.split(":").map(Number);
  return [h, m];
}

export function isOpen(date: Date): boolean {
  const dow = date.getDay() as keyof typeof OPENING;
  return Boolean(OPENING[dow]);
}

export function generateSlots(date: Date, now: Date = new Date()): string[] {
  const dow = date.getDay() as keyof typeof OPENING;
  const hours = OPENING[dow];
  if (!hours) return [];

  const [sh, sm] = parseHM(hours.start);
  const [eh, em] = parseHM(hours.end);

  const slots: string[] = [];
  const cursor = new Date(date);
  cursor.setHours(sh, sm, 0, 0);

  const end = new Date(date);
  end.setHours(eh, em, 0, 0);

  const lastStart = new Date(end.getTime() - SLOT_MINUTES * 60_000);
  const minLead = new Date(now.getTime() + MIN_LEAD_HOURS * 60 * 60_000);

  while (cursor <= lastStart) {
    if (cursor >= minLead) {
      slots.push(
        `${String(cursor.getHours()).padStart(2, "0")}:${String(cursor.getMinutes()).padStart(2, "0")}`,
      );
    }
    cursor.setMinutes(cursor.getMinutes() + SLOT_MINUTES);
  }
  return slots;
}

export function isWithinBookingWindow(date: Date, now: Date = new Date()): boolean {
  const maxDate = new Date(now);
  maxDate.setDate(maxDate.getDate() + MAX_ADVANCE_DAYS);
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  return date >= today && date <= maxDate;
}

export function combineDateAndTime(dateISO: string, time: string): Date {
  const [y, m, d] = dateISO.split("-").map(Number);
  const [h, min] = time.split(":").map(Number);
  return new Date(y, m - 1, d, h, min, 0, 0);
}
