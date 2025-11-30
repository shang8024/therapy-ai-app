import { Alert, Linking } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { TOS_URL, PRIVACY_URL } from "@/constants/legal";

async function openUrl(url: string): Promise<void> {
  try {
    await WebBrowser.openBrowserAsync(url, {
      readerMode: false,
      enableBarCollapsing: true,
      showTitle: true,
    });
  } catch {
    try {
      const ok = await Linking.canOpenURL(url);
      if (ok) {
        await Linking.openURL(url);
        return;
      }
    } catch {}
    Alert.alert("Unable to open link", url);
  }
}

async function openMailto(email: string, subject?: string) {
  const s = subject ? `?subject=${encodeURIComponent(subject)}` : "";
  return openUrl(`mailto:${email}${s}`);
}

async function openTel(phone: string) {
  return openUrl(`tel:${phone}`);
}

const showCrisisResources = () => {
  Alert.alert(
    "Crisis Resources",
    "• Crisis Text Line: Text HOME to 741741\n" +
      "• National Suicide Prevention Lifeline: 988\n" +
      "• SAMHSA National Helpline: 1-800-662-4357\n" +
      "• Crisis Chat: suicidepreventionlifeline.org\n\n" +
      "If you're in immediate danger, please call 911 or go to your nearest emergency room.",
    [{ text: "OK", style: "default" }]
  );
};

const showAbout = () => {
  Alert.alert(
    "About Therapy AI",
    "Version 1.0.0\n\n" +
      "This app provides supportive conversations and mental health resources. " +
      "It is not a replacement for professional mental health care.\n\n" +
      "Always consult with a qualified mental health professional for serious concerns.",
    [
      { text: "OK", style: "default" },
      { text: "Terms of Service", onPress: () => openUrl(TOS_URL) },
      { text: "Privacy Policy", onPress: () => openUrl(PRIVACY_URL) },
    ]
  );
};

const showPrivacy = () => {
  Alert.alert(
    "Privacy Policy",
    "Your conversations are stored locally on your device and are not shared with third parties. " +
      "We are committed to protecting your privacy and maintaining the confidentiality of your data.\n\n" +
      "For more information, visit our full privacy policy.",
    [
      { text: "OK", style: "default" },
      { text: "Terms of Service", onPress: () => openUrl(TOS_URL) },
      { text: "Privacy Policy", onPress: () => openUrl(PRIVACY_URL) },
    ]
  );
};

export {
  openUrl,
  openMailto,
  openTel,
  showCrisisResources,
  showAbout,
  showPrivacy,
};
