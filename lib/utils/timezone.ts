import { formatInTimeZone, toZonedTime } from "date-fns-tz";
import { TIMEZONE } from "@/lib/constants";

/**
 * Checks if two timestamps are on the same day in America/Sao_Paulo timezone
 */
export function isSameDay(
  timestamp1: number | Date | null | undefined,
  timestamp2: number | Date
): boolean {
  if (!timestamp1) {
    return false;
  }

  const date1 = toZonedTime(timestamp1, TIMEZONE);
  const date2 = toZonedTime(timestamp2, TIMEZONE);

  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Gets the start of the day (midnight) for a given date in America/Sao_Paulo timezone
 * If no date is provided, uses current date
 */
export function getStartOfDay(date?: Date | number): Date {
  const targetDate = date ? new Date(date) : new Date();
  const zonedDate = toZonedTime(targetDate, TIMEZONE);

  zonedDate.setHours(0, 0, 0, 0);

  return zonedDate;
}

/**
 * Formats a date to YYYY-MM-DD in America/Sao_Paulo timezone
 */
export function formatDateSP(date: Date | number): string {
  return formatInTimeZone(date, TIMEZONE, "yyyy-MM-dd");
}

/**
 * Gets the current timestamp in America/Sao_Paulo timezone
 */
export function nowInSP(): Date {
  return toZonedTime(new Date(), TIMEZONE);
}
