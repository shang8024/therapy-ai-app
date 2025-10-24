// types/checkin.ts

/** A single mood option in the picker */
export interface MoodLevel {
  value: number;     // 1..5 (or any scale you adopt)
  label: string;     // e.g., "Good"
  emoji: string;     // e.g., "😊"
  color: string;     // hex color used when selected
}

/** Persisted daily check-in record */
export interface CheckinRecord {
  mood: number;      // selected MoodLevel.value
  notes: string;     // free text note
  timestamp: string; // ISO string when saved
}
