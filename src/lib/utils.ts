import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Convert a name to Title Case — "most arafa alam" → "Most Arafa Alam" */
export function toTitleCase(name: string): string {
  return name
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/** Return a formatted full name with Title Case */
export function formatName(firstName?: string, lastName?: string): string {
  return toTitleCase(`${firstName || ""} ${lastName || ""}`.trim()) || "Unknown User";
}

/** Normalizes a Firestore Timestamp, a {_seconds} object, an ISO string, or a Date into a Date. */
export function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === "string") {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (typeof value === "object") {
    const v = value as { toDate?: () => Date; _seconds?: number };
    if (typeof v.toDate === "function") return v.toDate();
    if (typeof v._seconds === "number") return new Date(v._seconds * 1000);
  }
  return null;
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** Formats a date as dd/mm/yyyy — the app-wide date display convention. */
export function formatDate(value: unknown): string {
  const d = toDate(value);
  if (!d) return "—";
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
}

/** Formats a date + time as dd/mm/yyyy, HH:MM (24h). */
export function formatDateTime(value: unknown): string {
  const d = toDate(value);
  if (!d) return "—";
  return `${formatDate(d)}, ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}
