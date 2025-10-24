import React from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { prettyDate } from "@/constants/checkin";
import { useCheckin } from "@/contexts/CheckinContext";

import CheckinRecord from "@/components/checkin/CheckInRecord";
import CheckinForm from "@/components/checkin/CheckInForm";

export default function CheckinScreen() {
  const { date, loading, isEditing, record } = useCheckin();

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Daily Check-in</Text>
          <Text style={styles.subtitle}>{prettyDate(date)}</Text>
        </View>

        {!isEditing && record ? <CheckinRecord /> : <CheckinForm />}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  scrollContent: { padding: 20, paddingBottom: 40 },
  header: { alignItems: "center", marginBottom: 24 },
  title: { fontSize: 28, fontWeight: "bold", color: "#2c3e50", marginBottom: 8 },
  subtitle: { fontSize: 16, color: "#7f8c8d" },
});
