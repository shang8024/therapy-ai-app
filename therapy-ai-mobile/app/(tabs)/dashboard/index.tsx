import React from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from "react-native";
import { Link } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../../contexts/ThemeContext";
import { useDashboard } from "../../../contexts/DashboardContext";
import { MoodTrendChart } from "../../../components/dashboard/MoodTrendChart";
import { StatisticsCards } from "../../../components/dashboard/StatisticsCards";
import { ChatStatisticsCards } from "../../../components/dashboard/ChatStatisticsCards";
import { ChatMetricsChart } from "../../../components/dashboard/ChatMetricsChart";

export default function DashboardScreen() {
  const { theme } = useTheme();
  const {
    statistics,
    moodTrend7Days,
    moodTrend30Days,
    chatStatistics,
    chatTrend7Days,
    chatTrend30Days,
    loading,
    error,
    refreshData,
    selectedTimeRange,
    setSelectedTimeRange,
    dashboardType,
    setDashboardType,
  } = useDashboard();
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refreshData} />
        }
      >
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

        <View style={styles.analyticsSection}>
          <Text style={[styles.analyticsTitle, { color: theme.colors.text }]}>
            Your Progress
          </Text>
          
          {/* Dashboard Type Selector */}
          <View style={[styles.dashboardTypeSelector, { backgroundColor: theme.colors.surface, borderColor: theme.colors.text }]}>
            <TouchableOpacity
              style={[
                styles.dashboardTypeButton,
                dashboardType === "checkins" && styles.dashboardTypeButtonActive,
                dashboardType === "checkins" && { backgroundColor: theme.colors.primary || "#3498db" },
              ]}
              onPress={() => setDashboardType("checkins")}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.dashboardTypeButtonText,
                  { color: dashboardType === "checkins" ? "#ffffff" : theme.colors.text },
                ]}
              >
                📝 Check-ins
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.dashboardTypeButton,
                dashboardType === "chat" && styles.dashboardTypeButtonActive,
                dashboardType === "chat" && { backgroundColor: theme.colors.primary || "#9b59b6" },
              ]}
              onPress={() => setDashboardType("chat")}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.dashboardTypeButtonText,
                  { color: dashboardType === "chat" ? "#ffffff" : theme.colors.text },
                ]}
              >
                💬 Chat Metrics
              </Text>
            </TouchableOpacity>
          </View>
          
          {error && (
            <View style={[styles.errorContainer, { backgroundColor: theme.colors.surface }]}>
              <Text style={[styles.errorText, { color: theme.colors.error }]}>
                {error}
              </Text>
            </View>
          )}

          {dashboardType === "checkins" ? (
            <>
              <StatisticsCards statistics={statistics} loading={loading} />
              <MoodTrendChart
                moodTrend7Days={moodTrend7Days}
                moodTrend30Days={moodTrend30Days}
                selectedTimeRange={selectedTimeRange}
                onTimeRangeChange={setSelectedTimeRange}
                loading={loading}
              />
            </>
          ) : (
            <>
              <ChatStatisticsCards statistics={chatStatistics} loading={loading} />
              <ChatMetricsChart
                chatTrend7Days={chatTrend7Days}
                chatTrend30Days={chatTrend30Days}
                selectedTimeRange={selectedTimeRange}
                onTimeRangeChange={setSelectedTimeRange}
                loading={loading}
              />
            </>
          )}
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
  analyticsSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#e1e8ed",
  },
  analyticsTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 16,
    textAlign: "center",
  },
  dashboardTypeSelector: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dashboardTypeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  dashboardTypeButtonActive: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  dashboardTypeButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  errorContainer: {
    backgroundColor: "#fee",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#fcc",
  },
  errorText: {
    fontSize: 14,
    color: "#e74c3c",
    textAlign: "center",
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