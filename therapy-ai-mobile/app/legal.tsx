import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as WebBrowser from "expo-web-browser";
import { Linking } from "react-native";
import { useRouter } from "expo-router";
import { LEGAL_ACCEPT_KEY, TOS_URL, PRIVACY_URL } from "@/constants/legal";
import Disclaimer from "@/components/legal/Disclaimer";

export default function LegalScreen() {
  const router = useRouter();
  const [tos, setTos] = React.useState(false);
  const [privacy, setPrivacy] = React.useState(false);
  const canAgree = tos && privacy;

  const openUrl = async (url: string) => {
    try {
      await WebBrowser.openBrowserAsync(url, {
        readerMode: false,
        enableBarCollapsing: true,
        showTitle: true,
      });
    } catch {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert("Unable to open link", url);
      }
    }
  };

  const onAgree = async () => {
    if (!canAgree) {
      Alert.alert("Please agree to both policies to continue.");
      return;
    }
    await AsyncStorage.setItem(LEGAL_ACCEPT_KEY, "true");
    router.replace("/(tabs)/dashboard");
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Terms of Service & Privacy Policy</Text>

      <Text style={styles.hint}>
        To use our service, you must agree to our policies.
      </Text>

      {/* Row 1: TOS */}
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

      {/* Row 2: Privacy */}
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

  agreeBtn: {
    marginTop: 24,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#1d72e8",
    alignItems: "center",
  },
  agreeText: { color: "#fff", fontSize: 16, fontWeight: "700" },

  secondaryBtn: { marginTop: 10, paddingVertical: 12, alignItems: "center" },
  secondaryText: { color: "#5f6e77", fontSize: 14, fontWeight: "600" },
});
