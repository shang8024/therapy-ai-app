import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  Linking,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { LEGAL_ACCEPT_KEY, TOS_URL, PRIVACY_URL } from "@/constants/legal";
import Disclaimer from "@/components/legal/Disclaimer";
import { NOTIF_PREF_KEY, NOTIF_SCHEDULED_KEY } from "@/constants/notifications";
import {
  cancelDailyReminders,
  migrateNotificationsIfNeeded,
  getOrRequestNotifPermission,
} from "@/lib/notifications";
import { openUrl } from "@/lib/legal";

export default function LegalScreen() {
  const router = useRouter();

  const [tos, setTos] = React.useState(false);
  const [privacy, setPrivacy] = React.useState(false);
  const [wantsNotif, setWantsNotif] = React.useState(false);
  const [loadingNotif, setLoadingNotif] = React.useState(false);

  const canAgree = tos && privacy;

  React.useEffect(() => {
    (async () => {
      try {
        const [pref, scheduled] = await AsyncStorage.multiGet([
          NOTIF_PREF_KEY,
          NOTIF_SCHEDULED_KEY,
        ]).then((entries) => entries.map(([, v]) => v));
        if (pref === "true") return setWantsNotif(true);
        if (pref === "false") return setWantsNotif(false);
        setWantsNotif(scheduled === "true");
      } catch {}
    })();
  }, []);

  const onToggleNotif = async (value: boolean) => {
    if (!value) {
      setWantsNotif(false);
      await AsyncStorage.setItem(NOTIF_PREF_KEY, "false");
      return;
    }

    setLoadingNotif(true);
    try {
      const res = await getOrRequestNotifPermission();
      if (res === "granted") {
        setWantsNotif(true);
        await AsyncStorage.setItem(NOTIF_PREF_KEY, "true");
      } else {
        setWantsNotif(false);
        await AsyncStorage.setItem(NOTIF_PREF_KEY, "false");
        if (res === "blocked" && Platform.OS === "ios") {
          Alert.alert(
            "Notifications Disabled",
            "Notifications are turned off for this app. You can enable them in Settings.",
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Open Settings",
                onPress: () => Linking.openSettings?.(),
              },
            ],
          );
        } else {
          Alert.alert(
            "Notifications",
            "Permission was not granted. You can enable notifications later in Settings.",
          );
        }
      }
    } finally {
      setLoadingNotif(false);
    }
  };

  const onAgree = async () => {
    if (!canAgree) {
      Alert.alert("Please agree to both policies to continue.");
      return;
    }

    await AsyncStorage.setItem(LEGAL_ACCEPT_KEY, "true");

    try {
      if (wantsNotif) {
        await migrateNotificationsIfNeeded();
      } else {
        await cancelDailyReminders();
      }
    } catch {}

    router.replace("/(tabs)/dashboard");
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Terms of Service & Privacy Policy</Text>

      <Text style={styles.hint}>
        To use our service, you must agree to our policies.
      </Text>

      {/* TOS */}
      <View style={styles.toggleRow}>
        <Switch value={tos} onValueChange={setTos} />
        <Text style={styles.toggleLabel}>
          I agree to{" "}
          <Text
            style={styles.link}
            accessibilityRole="link"
            onPress={() => openUrl(TOS_URL)}
          >
            Terms of Service
          </Text>
        </Text>
      </View>

      {/* Privacy */}
      <View style={styles.toggleRow}>
        <Switch value={privacy} onValueChange={setPrivacy} />
        <Text style={styles.toggleLabel}>
          I agree to{" "}
          <Text
            style={styles.link}
            accessibilityRole="link"
            onPress={() => openUrl(PRIVACY_URL)}
          >
            Privacy Policy
          </Text>
        </Text>
      </View>

      {/* Optional notifications */}
      <View style={[styles.toggleRow, { marginTop: 24 }]}>
        <Switch
          value={wantsNotif}
          onValueChange={onToggleNotif}
          disabled={loadingNotif}
        />
        <Text style={styles.toggleLabel}>
          I want to receive daily reminders for journals & checkins{" "}
          <Text style={styles.muted}>(optional)</Text>
        </Text>
      </View>

      <Disclaimer />

      <TouchableOpacity
        disabled={!canAgree}
        onPress={onAgree}
        style={[styles.agreeBtn, !canAgree && { opacity: 0.5 }]}
      >
        <Text style={styles.agreeText}>Agree & Continue</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1f2d3d",
    marginBottom: 12,
    textAlign: "center",
  },
  hint: { marginTop: 4, fontSize: 12, color: "#6b7b8c" },

  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    gap: 8,
  },
  toggleLabel: { flex: 1, fontSize: 14, color: "#2c3e50" },

  link: {
    color: "#1d72e8",
    textDecorationLine: "underline",
    fontWeight: "600",
  },
  muted: { color: "#6b7b8c", fontWeight: "400" },

  agreeBtn: {
    marginTop: 24,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#1d72e8",
    alignItems: "center",
  },
  agreeText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
