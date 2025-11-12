import React from "react";
import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Switch,
  StyleSheet,
  Linking,
  ActivityIndicator,
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
import Disclaimer from "@/components/legal/Disclaimer";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { database } from "@/utils/database";

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
  const { theme } = useTheme();
  return (
    <TouchableOpacity
      style={[styles.settingItem, { borderBottomColor: theme.colors.border }]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, { color: theme.colors.text }]}>
          {title}
        </Text>
        {description && (
          <Text
            style={[
              styles.settingDescription,
              { color: theme.colors.textSecondary },
            ]}
          >
            {description}
          </Text>
        )}
      </View>
      {rightComponent && (
        <View style={styles.rightComponent}>{rightComponent}</View>
      )}
      {showArrow && (
        <Text style={[styles.arrow, { color: theme.colors.textSecondary }]}>
          ›
        </Text>
      )}
    </TouchableOpacity>
  );
};

const SettingSection: React.FC<{
  title: string;
  children: React.ReactNode;
}> = ({ title, children }) => {
  const { theme } = useTheme();
  return (
    <View style={styles.section}>
      <Text
        style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}
      >
        {title}
      </Text>
      <View
        style={[
          styles.sectionContent,
          { backgroundColor: theme.colors.surface },
        ]}
      >
        {children}
      </View>
    </View>
  );
};

export default function SettingsScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(false);
  const [biometricsEnabled, setBiometricsEnabled] = React.useState(false);
  const [loadingNotif, setLoadingNotif] = React.useState(false);
  const [syncing, setSyncing] = React.useState(false);
  const [clearingLocal, setClearingLocal] = React.useState(false);
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const { user, signOut, syncData } = useAuth();

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
              onPress: () => Linking.openSettings?.(),
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

  const handleClearLocalData = React.useCallback(() => {
    Alert.alert(
      "Clear Local Data",
      "This will remove all cached journal entries, check-ins, and chat history stored on this device for the current account.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            try {
              setClearingLocal(true);
              if (user) {
                await database.clearCurrentUserData();
              } else {
                await database.clearAllData();
              }
              Alert.alert("Success", "Local data cleared successfully.");
            } catch (error) {
              console.error("Failed to clear local data:", error);
              Alert.alert(
                "Error",
                "We could not clear local data. Please try again.",
              );
            } finally {
              setClearingLocal(false);
            }
          },
        },
      ],
    );
  }, [user]);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[styles.header, { borderBottomColor: theme.colors.border }]}
        >
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            Settings
          </Text>
          <Text
            style={[
              styles.headerSubtitle,
              { color: theme.colors.textSecondary },
            ]}
          >
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
                trackColor={{
                  false: theme.colors.border,
                  true: theme.colors.primary,
                }}
                thumbColor={
                  notificationsEnabled ? "#ffffff" : theme.colors.surface
                }
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
                value={isDarkMode}
                onValueChange={toggleTheme}
                trackColor={{
                  false: theme.colors.border,
                  true: theme.colors.primary,
                }}
                thumbColor={isDarkMode ? "#ffffff" : theme.colors.surface}
              />
            }
          />
        </SettingSection>

        <SettingSection title="Account">
          <SettingItem
            title="Email"
            description={user?.email || "Not signed in"}
          />
          {user && (
            <SettingItem
              title="Sync to Cloud"
              description="Backup your data to the cloud"
              onPress={async () => {
                setSyncing(true);
                try {
                  await syncData();
                  Alert.alert("Success", "Your data has been synced to the cloud!");
                } catch (error) {
                  Alert.alert("Error", "Failed to sync data. Please try again.");
                } finally {
                  setSyncing(false);
                }
              }}
              rightComponent={
                syncing ? <ActivityIndicator size="small" color={theme.colors.primary} /> : null
              }
              showArrow={!syncing}
            />
          )}
          <SettingItem
            title="Sign Out"
            description="Sign out of your account"
            onPress={async () => {
              Alert.alert(
                "Sign Out",
                "Are you sure you want to sign out?",
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Sign Out",
                    style: "destructive",
                    onPress: async () => {
                      await signOut();
                    },
                  },
                ]
              );
            }}
            showArrow
          />
        </SettingSection>

        <SettingSection title="Data Tools">
          <SettingItem
            title="Clear Local Data"
            description="Remove all cached entries stored on this device for this account"
            onPress={clearingLocal ? undefined : handleClearLocalData}
            rightComponent={
              clearingLocal ? (
                <ActivityIndicator size="small" color={theme.colors.primary} />
              ) : undefined
            }
            showArrow={!clearingLocal}
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
                trackColor={{
                  false: theme.colors.border,
                  true: theme.colors.primary,
                }}
                thumbColor={
                  biometricsEnabled ? "#ffffff" : theme.colors.surface
                }
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
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 30,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 20,
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sectionContent: {
    borderRadius: 12,
    marginHorizontal: 15,
    overflow: "hidden",
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
    lineHeight: 18,
  },
  rightComponent: {
    marginLeft: 12,
  },
  arrow: {
    fontSize: 20,
    marginLeft: 8,
  },
});
