// constants/checkin.ts
import { MoodLevel } from "@/types/checkin";

/** Canonical mood options for the app */
export const MOOD_LEVELS: MoodLevel[] = [
  { value: 1, label: "Very Bad", emoji: "😭", color: "#e74c3c" },
  { value: 2, label: "Bad", emoji: "😢", color: "#f39c12" },
  { value: 3, label: "Okay", emoji: "😐", color: "#f1c40f" },
  { value: 4, label: "Good", emoji: "😊", color: "#2ecc71" },
  { value: 5, label: "Excellent", emoji: "😄", color: "#27ae60" },
];
export const DEFAULT_MOOD_VALUE =
  MOOD_LEVELS[Math.floor(MOOD_LEVELS.length / 2)].value;

/** Prefix for daily check-in storage keys */
export const CHECKIN_KEY_PREFIX = "CHECKIN:";

/** Build storage key for a given date (defaults to today), format: CHECKIN:YYYY-MM-DD */
export function makeCheckinKey(date: Date = new Date()): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${CHECKIN_KEY_PREFIX}${yyyy}-${mm}-${dd}`;
}

/** Pretty date string used in UI (kept here so UI is consistent everywhere) */
export function prettyDate(date: Date = new Date()): string {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone,
  });
}
