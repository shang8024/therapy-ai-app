import React from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface MoodLevel {
  value: number;
  label: string;
  emoji: string;
  color: string;
}

const moodLevels: MoodLevel[] = [
  { value: 1, label: "Very Bad", emoji: "😭", color: "#e74c3c" },
  { value: 2, label: "Bad", emoji: "😢", color: "#f39c12" },
  { value: 3, label: "Okay", emoji: "😐", color: "#f1c40f" },
  { value: 4, label: "Good", emoji: "😊", color: "#2ecc71" },
  { value: 5, label: "Excellent", emoji: "😄", color: "#27ae60" },
];

export default function CheckinScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Daily Check-in</Text>
          <Text style={styles.subtitle}>
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#7f8c8d",
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 16,
  },
  moodContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 8,
  },
  moodButton: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    minWidth: 60,
    borderWidth: 2,
    borderColor: "#e1e8ed",
  },
  moodEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  moodLabel: {
    fontSize: 12,
    color: "#7f8c8d",
    textAlign: "center",
  },
  moodLabelSelected: {
    color: "#ffffff",
    fontWeight: "600",
  },
  sleepInput: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e1e8ed",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  stressContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 8,
  },
  stressButton: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e1e8ed",
    borderRadius: 8,
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  stressButtonSelected: {
    backgroundColor: "#3498db",
    borderColor: "#3498db",
  },
  stressText: {
    fontSize: 14,
    color: "#7f8c8d",
  },
  stressTextSelected: {
    color: "#ffffff",
    fontWeight: "600",
  },
  activitiesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  activityButton: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e1e8ed",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  activityButtonSelected: {
    backgroundColor: "#27ae60",
    borderColor: "#27ae60",
  },
  activityText: {
    fontSize: 14,
    color: "#7f8c8d",
  },
  activityTextSelected: {
    color: "#ffffff",
    fontWeight: "600",
  },
  notesInput: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e1e8ed",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
  },
  submitButton: {
    backgroundColor: "#3498db",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 16,
  },
  submitButtonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "600",
  },
});
