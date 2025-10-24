import React from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Link } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Welcome to Therapy AI</Text>
          <Text style={styles.subtitle}>
            Your personal mental health companion
          </Text>
        </View>

        <View style={styles.cardContainer}>
          <Link href="/chat" asChild>
            <TouchableOpacity style={styles.card}>
              <Text style={styles.cardIcon}>💬</Text>
              <Text style={styles.cardTitle}>Start Chat</Text>
            </TouchableOpacity>
          </Link>

          <Link href="/checkin" asChild>
            <TouchableOpacity style={styles.card}>
              <Text style={styles.cardIcon}>📝</Text>
              <Text style={styles.cardTitle}>Daily Check-in</Text>
            </TouchableOpacity>
          </Link>

          <Link href="/settings" asChild>
            <TouchableOpacity style={styles.card}>
              <Text style={styles.cardIcon}>⚙️</Text>
              <Text style={styles.cardTitle}>Settings</Text>
            </TouchableOpacity>
          </Link>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Take care of your mental health today
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
    flexGrow: 1,
    padding: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
    paddingTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#7f8c8d",
    textAlign: "center",
    lineHeight: 22,
  },
  cardContainer: {
    gap: 16,
    marginBottom: 40,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#e1e8ed",
  },
  cardIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: "#7f8c8d",
    lineHeight: 20,
  },
  footer: {
    alignItems: "center",
    marginTop: "auto",
    paddingTop: 20,
  },
  footerText: {
    fontSize: 14,
    color: "#95a5a6",
    fontStyle: "italic",
  },
});
