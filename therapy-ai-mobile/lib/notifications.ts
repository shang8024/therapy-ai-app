import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  DEFAULT_REMINDER_SLOTS,
  NOTIF_PREF_KEY,
  NOTIF_SCHEDULED_KEY,
  NOTIF_IDS_KEY,
  NOTIF_VERSION,
  NOTIF_VERSION_KEY,
  ANDROID_CHANNEL_ID,
  REMINDER_TEXT,
} from "@/constants/notifications";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function ensureAndroidChannel() {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
    name: "Check-in Reminders",
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 250, 250, 250],
    enableVibrate: true,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  });
}

export async function sendImmediateMessage(message: string): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "TherapyAI",
      body: message,
    },
    trigger: null,
  });
}

export async function requestNotificationPermissions(): Promise<boolean> {
  let { status } = await Notifications.getPermissionsAsync();
  if (status !== "granted") {
    const ask = await Notifications.requestPermissionsAsync();
    status = ask.status;
  }
  // fire first notification to get around iOS quirkiness
  await sendImmediateMessage("Welcome to TherapyAI!");
  return status === "granted";
}

export async function getOrRequestNotifPermission(): Promise<
  "granted" | "denied" | "blocked"
> {
  let { status, canAskAgain } = await Notifications.getPermissionsAsync();
  if (status === "granted") return "granted";
  if (canAskAgain) {
    const req = await Notifications.requestPermissionsAsync();
    return req.status === "granted" ? "granted" : "denied";
  }
  return "blocked";
}

export async function scheduleDailyReminders(): Promise<void> {
  await ensureAndroidChannel();

  const ids: string[] = [];
  for (const [i, slot] of DEFAULT_REMINDER_SLOTS.entries()) {
    const isMorning = i === 0;
    const { title, body, data } = isMorning
      ? REMINDER_TEXT.morning
      : REMINDER_TEXT.evening;

    const id = await Notifications.scheduleNotificationAsync({
      content: { title, body, data },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: slot.hour,
        minute: slot.minute,
        channelId: Platform.OS === "android" ? ANDROID_CHANNEL_ID : undefined,
      } as Notifications.DailyTriggerInput,
    });
    ids.push(id);
  }

  await AsyncStorage.multiSet([
    [NOTIF_IDS_KEY, JSON.stringify(ids)],
    [NOTIF_SCHEDULED_KEY, "true"],
    [NOTIF_VERSION_KEY, String(NOTIF_VERSION)],
  ]);
}

export async function cancelDailyReminders(): Promise<void> {
  const raw = await AsyncStorage.getItem(NOTIF_IDS_KEY);
  if (raw) {
    try {
      const ids: string[] = JSON.parse(raw);
      await Promise.all(
        ids.map((id) => Notifications.cancelScheduledNotificationAsync(id)),
      );
    } catch {}
  }
  await AsyncStorage.multiRemove([NOTIF_IDS_KEY, NOTIF_SCHEDULED_KEY]);
}

export async function migrateNotificationsIfNeeded(): Promise<void> {
  const [pref, scheduled, savedVersion] = await AsyncStorage.multiGet([
    NOTIF_PREF_KEY,
    NOTIF_SCHEDULED_KEY,
    NOTIF_VERSION_KEY,
  ]).then((entries) => entries.map(([, v]) => v));

  const wants = pref === "true";
  const isScheduled = scheduled === "true";
  const currentVersion = Number(savedVersion ?? "0");

  if (!wants) {
    if (isScheduled) await cancelDailyReminders();
    return;
  }

  if (wants && !isScheduled) {
    const ok = await requestNotificationPermissions();
    if (ok) await scheduleDailyReminders();
    return;
  }

  if (wants && isScheduled && currentVersion !== NOTIF_VERSION) {
    await cancelDailyReminders();
    const ok = await requestNotificationPermissions();
    if (ok) await scheduleDailyReminders();
  }
}

export async function ensureDailyReminderSetup(): Promise<void> {
  const ok = await requestNotificationPermissions();
  if (!ok) return;
  await scheduleDailyReminders();
}
