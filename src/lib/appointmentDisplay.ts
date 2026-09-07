import { APPOINTMENT_TIME_SLOTS, type AppointmentTimeSlot } from "@/domain/entities/Appointment";

export { APPOINTMENT_TIME_SLOTS };
export type { AppointmentTimeSlot };

/**
 * The wire vocabulary for a time slot is lowercase ('morning' | 'afternoon' | 'evening');
 * these are its display labels. Declared exactly once so the two portal surfaces cannot drift.
 */
export const TIME_SLOT_LABELS: Record<AppointmentTimeSlot, string> = {
  morning: "Morning (8AM - 12PM)",
  afternoon: "Afternoon (12PM - 4PM)",
  evening: "Evening (4PM - 7PM)",
};

/** Short label for compact surfaces (dashboard cards). */
export const TIME_SLOT_SHORT_LABELS: Record<AppointmentTimeSlot, string> = {
  morning: "Morning",
  afternoon: "Afternoon",
  evening: "Evening",
};

/**
 * `preferredDate` is a bare 'YYYY-MM-DD' calendar day, not an instant. It is parsed and
 * formatted as UTC so the rendered day never shifts by one in a negative-offset timezone.
 */
export function formatPreferredDate(
  isoDate: string,
  options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" }
): string {
  const parsed = new Date(`${isoDate}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return isoDate;
  return parsed.toLocaleDateString(undefined, { ...options, timeZone: "UTC" });
}

/** "Mon, Dec 1 · Morning" — the compact date + slot rendering used on the dashboard. */
export function formatAppointmentSlot(isoDate: string, slot: AppointmentTimeSlot): string {
  const date = formatPreferredDate(isoDate, { weekday: "short", month: "short", day: "numeric" });
  return `${date} · ${TIME_SLOT_SHORT_LABELS[slot] ?? slot}`;
}
