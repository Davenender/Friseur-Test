import { NextResponse } from "next/server";
import {
  generateSlots,
  isOpen,
  isWithinBookingWindow,
} from "@/lib/booking";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dateParam = searchParams.get("date");
  if (!dateParam || !/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
    return NextResponse.json({ error: "Ungültiges Datum" }, { status: 400 });
  }

  const [y, m, d] = dateParam.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const now = new Date();

  if (!isWithinBookingWindow(date, now)) {
    return NextResponse.json({ slots: [], closed: true });
  }
  if (!isOpen(date)) {
    return NextResponse.json({ slots: [], closed: true });
  }

  const slots = generateSlots(date, now);
  return NextResponse.json({ slots, closed: false });
}
