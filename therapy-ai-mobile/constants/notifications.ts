// constants/notifications.ts
export const NOTIF_VERSION = 1;

const NOTIF_PREF_KEY = "NOTIF_PREF_V1";
const NOTIF_SCHEDULED_KEY = "NOTIF_SCHEDULED_V1";
const NOTIF_IDS_KEY = "NOTIF_IDS_V1";
const NOTIF_VERSION_KEY = "NOTIF_VERSION_KEY";

// Helper functions to get global notification keys
export const getNotifPrefKey = () => `appv1:${NOTIF_PREF_KEY}`;
export const getNotifScheduledKey = () => `appv1:${NOTIF_SCHEDULED_KEY}`;
export const getNotifIdsKey = () => `appv1:${NOTIF_IDS_KEY}`;
export const getNotifVersionKey = () => `appv1:${NOTIF_VERSION_KEY}`;

export const ANDROID_CHANNEL_ID = `checkin-reminders-v${NOTIF_VERSION}`;

export const DEFAULT_REMINDER_SLOTS = [
  { hour: 9, minute: 0 },
  { hour: 21, minute: 0 },
] as const;

export const REMINDER_TEXT = {
  morning: {
    title: "Daily Check-in",
    body: "Good morning — how are you feeling today?",
    data: { target: "/(tabs)/checkin" },
  },
  evening: {
    title: "Daily Check-in",
    body: "Good evening — take a moment to reflect.",
    data: { target: "/(tabs)/checkin" },
  },
} as const;
