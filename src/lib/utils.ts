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
