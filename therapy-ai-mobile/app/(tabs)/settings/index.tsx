import Disclaimer from "@/components/legal/Disclaimer";
import React, { useState } from "react";
import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Switch,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  showCrisisResources,
  showPrivacy,
  showAbout,
  showDataManagement,
} from "@/lib/legal";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NOTIF_PREF_KEY, NOTIF_SCHEDULED_KEY } from "@/constants/notifications";
import {
  cancelDailyReminders,
  ensureDailyReminderSetup,
  getOrRequestNotifPermission,
} from "@/lib/notifications";
import { Platform, Alert } from "react-native";

interface SettingItemProps {
  title: string;
  description?: string;
  onPress?: () => void;
  rightComponent?: React.ReactNode;
  showArrow?: boolean;
}

const SettingItem: React.FC<SettingItemProps> = ({
  title,
  description,
  onPress,
  rightComponent,
  showArrow = false,
}) => {
  const Container: any = onPress ? TouchableOpacity : View;
  return (
    <Container style={styles.settingItem} onPress={onPress} disabled={!onPress}>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        {description && (
          <Text style={styles.settingDescription}>{description}</Text>
        )}
      </View>
      {rightComponent && (
        <View style={styles.rightComponent}>{rightComponent}</View>
      )}
      {showArrow && <Text style={styles.arrow}>›</Text>}
    </Container>
  );
};

const SettingSection: React.FC<{
  title: string;
  children: React.ReactNode;
}> = ({ title, children }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.sectionContent}>{children}</View>
  </View>
);

export default function SettingsScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(false);
  const [darkModeEnabled, setDarkModeEnabled] = React.useState(false);
  const [biometricsEnabled, setBiometricsEnabled] = React.useState(false);
  const [loadingNotif, setLoadingNotif] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      try {
        const [pref, scheduled] = await AsyncStorage.multiGet([
          NOTIF_PREF_KEY,
          NOTIF_SCHEDULED_KEY,
        ]).then((es) => es.map(([, v]) => v));
        if (pref === "true") return setNotificationsEnabled(true);
        if (pref === "false") return setNotificationsEnabled(false);
        setNotificationsEnabled(scheduled === "true");
      } catch {}
    })();
  }, []);

  const onToggleNotifications = async (value: boolean) => {
    if (!value) {
      setNotificationsEnabled(false);
      await AsyncStorage.setItem(NOTIF_PREF_KEY, "false");
      try {
        await cancelDailyReminders();
      } catch {}
      return;
    }

    setLoadingNotif(true);
    try {
      const res = await getOrRequestNotifPermission();

      if (res === "granted") {
        await AsyncStorage.setItem(NOTIF_PREF_KEY, "true");
        await ensureDailyReminderSetup();
        setNotificationsEnabled(true);
        return;
      }

      setNotificationsEnabled(false);
      await AsyncStorage.setItem(NOTIF_PREF_KEY, "false");

      if (res === "blocked" && Platform.OS === "ios") {
        Alert.alert(
          "Notifications Disabled",
          "Notifications are turned off for this app in iOS Settings.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Open Settings",
              onPress: () => require("react-native").Linking.openSettings?.(),
            },
          ]
        );
      } else {
        Alert.alert("Notifications", "Permission was not granted.");
      }
    } finally {
      setLoadingNotif(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Settings</Text>
          <Text style={styles.headerSubtitle}>
            Customize your therapy experience
          </Text>
        </View>

        <SettingSection title="Notifications">
          <SettingItem
            title="Push Notifications"
            description="Receive reminders and check-in prompts"
            rightComponent={
              <Switch
                value={notificationsEnabled}
                onValueChange={onToggleNotifications}
                disabled={loadingNotif}
                trackColor={{ false: "#767577", true: "#007AFF" }}
                thumbColor={notificationsEnabled ? "#ffffff" : "#f4f3f4"}
              />
            }
          />
        </SettingSection>

        <SettingSection title="Appearance">
          <SettingItem
            title="Dark Mode"
            description="Use dark theme for better night viewing"
            rightComponent={
              <Switch
                value={darkModeEnabled}
                onValueChange={setDarkModeEnabled}
                trackColor={{ false: "#767577", true: "#007AFF" }}
                thumbColor={darkModeEnabled ? "#ffffff" : "#f4f3f4"}
              />
            }
          />
        </SettingSection>

        <SettingSection title="Security">
          <SettingItem
            title="Biometric Lock"
            description="Use Face ID or Touch ID to secure the app"
            rightComponent={
              <Switch
                value={biometricsEnabled}
                onValueChange={setBiometricsEnabled}
                trackColor={{ false: "#767577", true: "#007AFF" }}
                thumbColor={biometricsEnabled ? "#ffffff" : "#f4f3f4"}
              />
            }
          />
          <SettingItem
            title="Data Management"
            description="Export or delete your chat history"
            onPress={showDataManagement}
            showArrow
          />
        </SettingSection>

        <SettingSection title="Crisis Support">
          <SettingItem
            title="Crisis Resources"
            description="Access immediate help and support hotlines"
            onPress={showCrisisResources}
            showArrow
          />
        </SettingSection>

        <SettingSection title="Legal & Support">
          <SettingItem
            title="Privacy Policy"
            description="How we protect your data"
            onPress={showPrivacy}
            showArrow
          />
          <SettingItem
            title="About"
            description="Version info and disclaimers"
            onPress={showAbout}
            showArrow
          />
        </SettingSection>

        <Disclaimer />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 30,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#333333",
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#666666",
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333333",
    marginLeft: 20,
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sectionContent: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    marginHorizontal: 15,
    overflow: "hidden",
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333333",
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
    color: "#666666",
    lineHeight: 18,
  },
  rightComponent: {
    marginLeft: 12,
  },
  arrow: {
    fontSize: 20,
    color: "#c0c0c0",
    marginLeft: 8,
  },
});
