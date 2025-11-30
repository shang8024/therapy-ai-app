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
          <View style={styles.headerTop}>
            <View style={styles.headerIconContainer}>
              <Text style={styles.headerIcon}>✨</Text>
            </View>
            <View style={styles.headerTextContainer}>
              <Text style={[styles.greeting, { color: theme.colors.textSecondary }]}>
                Welcome back
              </Text>
              <Text style={[styles.title, { color: theme.colors.text }]}>
                Therapy AI
              </Text>
            </View>
          </View>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Your personal mental health companion
          </Text>
        </View>

        <View style={styles.quickActionsContainer}>
          <Text style={[styles.sectionLabel, { color: theme.colors.text }]}>
            Quick Actions
          </Text>
          <View style={styles.quickActionsGrid}>
            <Link href="/chat" asChild>
              <TouchableOpacity 
                style={[
                  styles.quickActionCard, 
                  { backgroundColor: theme.colors.surface }
                ]}
                activeOpacity={0.8}
              >
                <View style={[styles.quickActionIconContainer, { backgroundColor: theme.colors.primary + '15' }]}>
                  <Text style={styles.quickActionIcon}>💬</Text>
                </View>
                <Text style={[styles.quickActionTitle, { color: theme.colors.text }]}>
                  Start Chat
                </Text>
                <Text style={[styles.quickActionSubtitle, { color: theme.colors.textSecondary }]}>
                  Talk with AI
                </Text>
              </TouchableOpacity>
            </Link>

            <Link href="/checkin" asChild>
              <TouchableOpacity 
                style={[
                  styles.quickActionCard, 
                  { backgroundColor: theme.colors.surface }
                ]}
                activeOpacity={0.8}
              >
                <View style={[styles.quickActionIconContainer, { backgroundColor: theme.colors.primary + '15' }]}>
                  <Text style={styles.quickActionIcon}>📝</Text>
                </View>
                <Text style={[styles.quickActionTitle, { color: theme.colors.text }]}>
                  Check-in
                </Text>
                <Text style={[styles.quickActionSubtitle, { color: theme.colors.textSecondary }]}>
                  Log mood
                </Text>
              </TouchableOpacity>
            </Link>

            <Link href="/settings" asChild>
              <TouchableOpacity 
                style={[
                  styles.quickActionCard, 
                  { backgroundColor: theme.colors.surface }
                ]}
                activeOpacity={0.8}
              >
                <View style={[styles.quickActionIconContainer, { backgroundColor: theme.colors.primary + '15' }]}>
                  <Text style={styles.quickActionIcon}>⚙️</Text>
                </View>
                <Text style={[styles.quickActionTitle, { color: theme.colors.text }]}>
                  Settings
                </Text>
                <Text style={[styles.quickActionSubtitle, { color: theme.colors.textSecondary }]}>
                  Preferences
                </Text>
              </TouchableOpacity>
            </Link>
          </View>
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  header: {
    marginBottom: 32,
    paddingTop: 8,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  headerIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "rgba(139, 92, 246, 0.1)",
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
  greeting: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    marginLeft: 72,
  },
  quickActionsContainer: {
    marginBottom: 32,
  },
  sectionLabel: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  quickActionsGrid: {
    flexDirection: "row",
    gap: 12,
  },
  quickActionCard: {
    flex: 1,
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    shadowColor: "#8B5CF6",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  quickActionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  quickActionIcon: {
    fontSize: 28,
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
    textAlign: "center",
  },
  quickActionSubtitle: {
    fontSize: 12,
    textAlign: "center",
  },
  analyticsSection: {
    marginTop: 8,
  },
  analyticsTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 20,
    letterSpacing: -0.3,
  },
  dashboardTypeSelector: {
    flexDirection: "row",
    borderRadius: 16,
    padding: 6,
    marginBottom: 20,
    borderWidth: 2,
    shadowColor: "#8B5CF6",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  dashboardTypeButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
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
    marginTop: 32,
    paddingTop: 24,
    paddingBottom: 8,
  },
  footerText: {
    fontSize: 13,
    fontStyle: "italic",
    opacity: 0.7,
  },
});