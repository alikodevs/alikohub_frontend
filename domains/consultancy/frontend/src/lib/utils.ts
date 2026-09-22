import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a scheduled ISO date string into East Africa Time (EAT / Africa/Nairobi).
 * Output example: "Sep 13, 2026 · 5:00 PM – 8:00 PM EAT"
 */
export function formatWebinarDateTime(
  scheduledAt: string | null | undefined,
  durationMinutes: number | null | undefined = 180,
) {
  if (!scheduledAt) return { dateStr: "", timeRangeStr: "", fullStr: "" };

  let dateString = scheduledAt;
  if (
    typeof dateString === "string" &&
    !dateString.endsWith("Z") &&
    !dateString.includes("+") &&
    !dateString.includes("-", 10)
  ) {
    dateString = dateString.replace(" ", "T") + "Z";
  }

  const startDate = new Date(dateString);
  if (isNaN(startDate.getTime())) {
    return { dateStr: "", timeRangeStr: "", fullStr: "" };
  }

  const duration = durationMinutes || 180;
  const endDate = new Date(startDate.getTime() + duration * 60 * 1000);

  const dateStr = new Intl.DateTimeFormat("en-US", {
    timeZone: "Africa/Nairobi",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(startDate);

  const fullDateStr = new Intl.DateTimeFormat("en-US", {
    timeZone: "Africa/Nairobi",
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(startDate);

  const startTimeStr = new Intl.DateTimeFormat("en-US", {
    timeZone: "Africa/Nairobi",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(startDate);

  const endTimeStr = new Intl.DateTimeFormat("en-US", {
    timeZone: "Africa/Nairobi",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(endDate);

  const timeRangeStr = `${startTimeStr} – ${endTimeStr} EAT`;
  const fullStr = `${dateStr} · ${timeRangeStr}`;

  return {
    dateStr,
    fullDateStr,
    startTimeStr,
    endTimeStr,
    timeRangeStr,
    fullStr,
  };
}

/**
 * Converts a UTC ISO string (e.g. "2026-09-13T14:00:00.000Z") to an EAT wall-clock string
 * formatted for <Input type="datetime-local" /> ("2026-09-13T17:00").
 */
export function utcToEatDatetimeLocal(utcIsoString: string | null | undefined): string {
  if (!utcIsoString || !utcIsoString.trim()) return "";
  let s = utcIsoString.trim();
  if (!s.endsWith("Z") && !s.includes("+") && !s.includes("-", 10)) {
    s = s.replace(" ", "T") + "Z";
  }
  const date = new Date(s);
  if (isNaN(date.getTime())) return "";

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Africa/Nairobi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const getPart = (type: string) => parts.find((p) => p.type === type)?.value || "";
  const year = getPart("year");
  const month = getPart("month");
  const day = getPart("day");
  let hour = getPart("hour");
  if (hour === "24") hour = "00";
  const minute = getPart("minute");

  return `${year}-${month}-${day}T${hour}:${minute}`;
}

/**
 * Converts an EAT wall-clock string from <Input type="datetime-local" /> ("2026-09-13T17:00")
 * into a UTC ISO string ("2026-09-13T14:00:00.000Z").
 */
export function eatDatetimeLocalToUtcIso(eatLocalString: string | null | undefined): string | null {
  if (!eatLocalString || !eatLocalString.trim()) return null;
  const cleanStr = eatLocalString.trim().replace(" ", "T");
  if (cleanStr.endsWith("Z") || /[+-]\d{2}:\d{2}$/.test(cleanStr)) {
    const d = new Date(cleanStr);
    return isNaN(d.getTime()) ? null : d.toISOString();
  }
  const isoWithOffset =
    cleanStr.length === 16 ? `${cleanStr}:00+03:00` : `${cleanStr}+03:00`;
  const date = new Date(isoWithOffset);
  if (isNaN(date.getTime())) return null;
  return date.toISOString();
}
