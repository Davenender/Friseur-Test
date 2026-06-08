import { z } from "zod";
import { EMPLOYEES, SERVICES, type EmployeeId, type ServiceId } from "./booking";

const serviceIds = SERVICES.map((s) => s.id) as [ServiceId, ...ServiceId[]];
const employeeIds = ["any", ...EMPLOYEES.map((e) => e.id)] as unknown as [EmployeeId, ...EmployeeId[]];

export const contactSchema = z.object({
  firstName: z.string().trim().min(1, "Vorname ist erforderlich").max(80),
  lastName: z.string().trim().min(1, "Nachname ist erforderlich").max(80),
  phone: z.string().trim().min(5, "Bitte gültige Telefonnummer angeben").max(40),
  email: z
    .string()
    .trim()
    .email("Bitte gültige E-Mail-Adresse angeben")
    .max(120)
    .optional()
    .or(z.literal("")),
  message: z.string().trim().max(2000).optional().or(z.literal("")),
  consent: z.literal(true, {
    message: "Bitte der Datenschutzerklärung zustimmen",
  }),
  website: z.string().max(0).optional().or(z.literal("")),
});

export type ContactInput = z.infer<typeof contactSchema>;

export const bookingSchema = z.object({
  service: z.enum(serviceIds, { message: "Bitte eine Leistung auswählen" }),
  employee: z.enum(employeeIds).default("any"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Ungültiges Datum"),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Ungültige Uhrzeit"),
  firstName: z.string().trim().min(1, "Vorname ist erforderlich").max(80),
  lastName: z.string().trim().min(1, "Nachname ist erforderlich").max(80),
  phone: z.string().trim().min(5, "Bitte gültige Telefonnummer angeben").max(40),
  email: z
    .string()
    .trim()
    .email("Bitte gültige E-Mail-Adresse angeben")
    .max(120),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
  consent: z.literal(true, {
    message: "Bitte der Datenschutzerklärung zustimmen",
  }),
  website: z.string().max(0).optional().or(z.literal("")),
});

export type BookingInput = z.infer<typeof bookingSchema>;

export const giftCardSchema = z.object({
  amount: z
    .number()
    .int()
    .min(10, "Mindestbetrag 10 €")
    .max(500, "Maximal 500 €"),
  buyerName: z.string().trim().min(1, "Bitte Namen angeben").max(80),
  buyerEmail: z.string().trim().email("Bitte gültige E-Mail angeben").max(120),
  recipientName: z.string().trim().max(80).optional().or(z.literal("")),
  personalMessage: z.string().trim().max(500).optional().or(z.literal("")),
});

export type GiftCardInput = z.infer<typeof giftCardSchema>;
