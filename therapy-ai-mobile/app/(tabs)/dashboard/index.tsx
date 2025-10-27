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
import { useTheme } from "../../../contexts/ThemeContext";

export default function HomeScreen() {
  const { theme } = useTheme();
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Welcome to Therapy AI</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Your personal mental health companion
          </Text>
        </View>

        <View style={styles.cardContainer}>
          <Link href="/chat" asChild>
            <TouchableOpacity 
              style={[
                styles.card, 
                { 
                  backgroundColor: theme.colors.surface, 
                  borderColor: theme.colors.text
                }
              ]}
              activeOpacity={0.7}
            >
              <View style={styles.cardContent}>
                <Text style={styles.cardIcon}>💬</Text>
                <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
                  Start Chat
                </Text>
              </View>
            </TouchableOpacity>
          </Link>

          <Link href="/checkin" asChild>
            <TouchableOpacity 
              style={[
                styles.card, 
                { 
                  backgroundColor: theme.colors.surface, 
                  borderColor: theme.colors.text
                }
              ]}
              activeOpacity={0.7}
            >
              <View style={styles.cardContent}>
                <Text style={styles.cardIcon}>📝</Text>
                <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
                  Daily Check-in
                </Text>
              </View>
            </TouchableOpacity>
          </Link>

          <Link href="/settings" asChild>
            <TouchableOpacity 
              style={[
                styles.card, 
                { 
                  backgroundColor: theme.colors.surface, 
                  borderColor: theme.colors.text
                }
              ]}
              activeOpacity={0.7}
            >
              <View style={styles.cardContent}>
                <Text style={styles.cardIcon}>⚙️</Text>
                <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
                  Settings
                </Text>
              </View>
            </TouchableOpacity>
          </Link>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
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
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 20,
    justifyContent: "space-evenly",
  },
  card: {
    backgroundColor: "white",
    marginHorizontal: 4,
    marginVertical: 8,
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    borderWidth: 3,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardIcon: {
    fontSize: 28,
    marginRight: 14,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "600",
    flex: 1,
  },
  cardDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  footer: {
    alignItems: "center",
    marginTop: "auto",
    paddingTop: 20,
  },
  footerText: {
    fontSize: 14,
    fontStyle: "italic",
  },
});
