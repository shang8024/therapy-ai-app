import React, { useState } from "react";
import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Switch,
  StyleSheet,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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
}) => (
  <TouchableOpacity
    style={styles.settingItem}
    onPress={onPress}
    disabled={!onPress}
  >
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
  </TouchableOpacity>
);

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
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);

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
      [{ text: "OK", style: "default" }]
    );
  };

  const showPrivacy = () => {
    Alert.alert(
      "Privacy Policy",
      "Your conversations are stored locally on your device and are not shared with third parties. " +
        "We are committed to protecting your privacy and maintaining the confidentiality of your data.\n\n" +
        "For more information, visit our full privacy policy.",
      [{ text: "OK", style: "default" }]
    );
  };

  const showDataManagement = () => {
    Alert.alert(
      "Data Management",
      "Your chat history is stored locally on this device. You can export or delete your data at any time.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All Data",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "Confirm",
              "Are you sure you want to delete all chat history? This cannot be undone.",
              [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", style: "destructive" },
              ]
            );
          },
        },
      ]
    );
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
                onValueChange={setNotificationsEnabled}
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

        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            ⚠️ Important: This app is not a substitute for professional mental
            health care. If you're experiencing a mental health emergency,
            please contact emergency services or a crisis hotline immediately.
          </Text>
        </View>
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
  disclaimer: {
    margin: 20,
    padding: 16,
    backgroundColor: "#fff3cd",
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#ffc107",
  },
  disclaimerText: {
    fontSize: 14,
    color: "#856404",
    lineHeight: 20,
  },
});
