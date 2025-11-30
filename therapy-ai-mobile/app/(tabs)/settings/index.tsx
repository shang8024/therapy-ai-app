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
} from "@/lib/legal";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getNotifPrefKey,
  getNotifScheduledKey,
} from "@/constants/notifications";
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
import { commonStyles } from "@/styles/common";

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
        style={[
          styles.sectionTitleSettings,
          { color: theme.colors.textSecondary },
        ]}
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
  const [loadingNotif, setLoadingNotif] = React.useState(false);
  const [syncing, setSyncing] = React.useState(false);
  const [clearingLocal, setClearingLocal] = React.useState(false);
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();

  React.useEffect(() => {
    (async () => {
      try {
        const [pref, scheduled] = await AsyncStorage.multiGet([
          getNotifPrefKey(),
          getNotifScheduledKey(),
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
      await AsyncStorage.setItem(getNotifPrefKey(), "false");
      try {
        await cancelDailyReminders();
      } catch {}
      return;
    }

    setLoadingNotif(true);
    try {
      const res = await getOrRequestNotifPermission();

      if (res === "granted") {
        await AsyncStorage.setItem(getNotifPrefKey(), "true");
        await ensureDailyReminderSetup();
        setNotificationsEnabled(true);
        return;
      }

      setNotificationsEnabled(false);
      await AsyncStorage.setItem(getNotifPrefKey(), "false");

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
                "We could not clear local data. Please try again."
              );
            } finally {
              setClearingLocal(false);
            }
          },
        },
      ]
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
          style={[
            styles.headerSettings,
            { borderBottomColor: theme.colors.border },
          ]}
        >
          <View style={styles.headerTopRow}>
            <View style={[styles.headerIconContainer, { backgroundColor: theme.colors.primary + '15' }]}>
              <Text style={styles.headerIcon}>⚙️</Text>
            </View>
            <View style={styles.headerTextContainer}>
              <Text
                style={[styles.headerTitleSettings, { color: theme.colors.text }]}
              >
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
          </View>
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
              title="Cloud Sync"
              description="Automatically syncing to cloud"
              rightComponent={
                <Text
                  style={{
                    color: theme.colors.success || "#10b981",
                    fontWeight: "600",
                  }}
                >
                  ✓ Enabled
                </Text>
              }
            />
          )}
          <SettingItem
            title="Sign Out"
            description="Sign out of your account"
            onPress={async () => {
              Alert.alert("Sign Out", "Are you sure you want to sign out?", [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Sign Out",
                  style: "destructive",
                  onPress: async () => {
                    await signOut();
                  },
                },
              ]);
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
  ...commonStyles,
  scrollView: {
    flex: 1,
  },
  headerSettings: {
    padding: 20,
    paddingBottom: 24,
    borderBottomWidth: 1,
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  headerIcon: {
    fontSize: 28,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitleSettings: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  sectionTitleSettings: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 20,
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
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
