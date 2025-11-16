import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  useContext,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { database } from "../utils/database";
import { useDatabase } from "./DatabaseContext";
import { useAuth } from "./AuthContext";
import { Message } from "../types/chat";
import * as SupabaseService from "../lib/supabase-services";
import { getCheckins } from "../lib/supabase-services";

export interface DashboardStatistics {
  totalCheckins: number;
  currentStreak: number;
  longestStreak: number;
  averageMood: number;
}

export interface MoodTrendData {
  labels: string[];
  data: number[];
  dates: string[];
}

export interface ChatStatistics {
  totalMessages: number;
  totalSessions: number;
  averageMessagesPerSession: number;
  messagesLast7Days: number;
  messagesLast30Days: number;
}

export interface ChatTrendData {
  labels: string[];
  data: number[]; // User messages per day
  dates: string[];
  activeUsers: number[]; // Global active users per day
  avgMessagesPerUser: number[]; // Global average messages per person per day
}

export type DashboardType = "checkins" | "chat";

type DashboardContextValue = {
  statistics: DashboardStatistics | null;
  moodTrend7Days: MoodTrendData | null;
  moodTrend30Days: MoodTrendData | null;
  chatStatistics: ChatStatistics | null;
  chatTrend7Days: ChatTrendData | null;
  chatTrend30Days: ChatTrendData | null;
  loading: boolean;
  error: string | null;
  refreshData: (syncFirst?: boolean) => Promise<void>;
  syncFromCloud: () => Promise<void>;
  selectedTimeRange: "7days" | "30days";
  setSelectedTimeRange: (range: "7days" | "30days") => void;
  dashboardType: DashboardType;
  setDashboardType: (type: DashboardType) => void;
};

export const DashboardContext = createContext<DashboardContextValue | null>(
  null
);

type Props = { children: React.ReactNode };

// Helper function to get all messages across all chat sessions
async function getAllChatMessages(userId: string): Promise<Message[]> {
  try {
    const allMessages: Message[] = [];


    try {
      const cloudSessions = await SupabaseService.getChatSessions(userId);

      for (const session of cloudSessions) {
        try {
          const cloudMessages = await SupabaseService.getMessages(session.id);

          const mapped: Message[] = cloudMessages.map((msg) => ({
            id: msg.id,
            chatId: msg.chat_id,
            content: msg.content,
            role: msg.role,
            timestamp: new Date(msg.created_at),
            audioUri: msg.audio_uri ?? undefined,
            messageType: (msg.message_type as "text" | "audio") ?? "text",
          }));

          allMessages.push(...mapped);
        } catch (error) {
          console.warn(
            `DashboardContext: Failed to load messages from Supabase for chat ${session.id}:`,
            error
          );
        }
      }

      if (allMessages.length > 0) {
        return allMessages;
      }
    } catch (error) {
      console.warn(
        "DashboardContext: Failed to load chat sessions from Supabase, falling back to local storage:",
        error
      );
    }

    // -----------------------------------------------------------------------
    // 2) Fallback: load from AsyncStorage using same keys as ChatContext
    // -----------------------------------------------------------------------
    const sessionsData = await AsyncStorage.getItem(
      `appv1:${userId}:chatSessions`
    );
    if (!sessionsData) return [];

    const sessions: Array<{ id: string }> = JSON.parse(sessionsData);

    for (const session of sessions) {
      const messagesKey = `appv1:${userId}:messages:${session.id}`;
      const messagesData = await AsyncStorage.getItem(messagesKey);
      if (messagesData) {
        const messages: Message[] = JSON.parse(messagesData).map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }));
        allMessages.push(...messages);
      }
    }

    return allMessages;
  } catch (error) {
    console.error("Error fetching chat messages:", error);
    return [];
  }
}

// Helper function to calculate chat statistics
function calculateChatStatistics(messages: Message[]): ChatStatistics {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const messagesLast7Days = messages.filter(
    (msg) => msg.timestamp >= sevenDaysAgo
  ).length;
  const messagesLast30Days = messages.filter(
    (msg) => msg.timestamp >= thirtyDaysAgo
  ).length;

  const uniqueSessions = new Set(messages.map((msg) => msg.chatId));
  const totalSessions = uniqueSessions.size;
  const totalMessages = messages.length;
  const averageMessagesPerSession =
    totalSessions > 0 ? totalMessages / totalSessions : 0;

  return {
    totalMessages,
    totalSessions,
    averageMessagesPerSession: Math.round(averageMessagesPerSession * 10) / 10,
    messagesLast7Days,
    messagesLast30Days,
  };
}

// Helper function to get chat trend data (user + global metrics)
async function getChatTrendData(
  messages: Message[],
  days: number
): Promise<ChatTrendData> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - days + 1);
  startDate.setHours(0, 0, 0, 0);
  const endDateString = endDate.toISOString().split("T")[0] + "T23:59:59.999Z";
  const startDateString = startDate.toISOString().split("T")[0] + "T00:00:00.000Z";

  const messagesInRange = messages.filter((msg) => {
    const msgDate = new Date(msg.timestamp);
    return msgDate >= startDate && msgDate <= endDate;
  });

  // Group user messages by date
  const messagesByDate = new Map<string, number>();
  messagesInRange.forEach((msg) => {
    const dateKey = new Date(msg.timestamp).toISOString().split("T")[0];
    messagesByDate.set(dateKey, (messagesByDate.get(dateKey) || 0) + 1);
  });

  // Fetch global statistics
  let globalStats: SupabaseService.GlobalChatStats[] = [];
  try {
    globalStats = await SupabaseService.getGlobalChatStatistics(
      startDateString,
      endDateString
    );
  } catch (error) {
    console.warn("Failed to fetch global statistics:", error);
  }

  const globalStatsByDate = new Map<string, SupabaseService.GlobalChatStats>();
  globalStats.forEach((stat) => {
    globalStatsByDate.set(stat.date, stat);
  });

  const labels: string[] = [];
  const data: number[] = [];
  const dates: string[] = [];
  const activeUsers: number[] = [];
  const avgMessagesPerUser: number[] = [];

  for (let i = 0; i < days; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + i);
    const dateString = currentDate.toISOString().split("T")[0];
    const label = currentDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    labels.push(label);
    dates.push(dateString);
    
    // User messages
    data.push(messagesByDate.get(dateString) || 0);
    
    // Global metrics
    const globalStat = globalStatsByDate.get(dateString);
    activeUsers.push(globalStat?.active_users || 0);
    avgMessagesPerUser.push(globalStat?.avg_messages_per_user || 0);
  }

  return { labels, data, dates, activeUsers, avgMessagesPerUser };
}

export const DashboardProvider: React.FC<Props> = ({ children }) => {
  const { isInitialized, isLoading: dbLoading } = useDatabase();
  const { user } = useAuth();

  const [statistics, setStatistics] = useState<DashboardStatistics | null>(
    null
  );
  const [moodTrend7Days, setMoodTrend7Days] = useState<MoodTrendData | null>(
    null
  );
  const [moodTrend30Days, setMoodTrend30Days] = useState<MoodTrendData | null>(
    null
  );
  const [chatStatistics, setChatStatistics] = useState<ChatStatistics | null>(
    null
  );
  const [chatTrend7Days, setChatTrend7Days] = useState<ChatTrendData | null>(
    null
  );
  const [chatTrend30Days, setChatTrend30Days] = useState<ChatTrendData | null>(
    null
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState<
    "7days" | "30days"
  >("7days");
  const [dashboardType, setDashboardType] = useState<DashboardType>("checkins");

  const syncFromCloud = useCallback(async () => {
    if (!user?.id || !isInitialized) {
      // eslint-disable-next-line no-console
      console.log(
        "DashboardContext: Cannot sync - user not authenticated or database not initialized"
      );
      return;
    }
    try {
      const cloudCheckins = await getCheckins(user.id);

      if (cloudCheckins.length > 0) {
        for (const cloudCheckin of cloudCheckins) {
          try {
            const localExisting = await database.getCheckinEntryByDate(
              cloudCheckin.date
            );
            if (localExisting) {
              await database.updateCheckinEntry(
                localExisting.id,
                cloudCheckin.mood,
                cloudCheckin.notes ?? null
              );
            } else {
              await database.createCheckinEntry(
                cloudCheckin.mood,
                cloudCheckin.notes ?? null,
                cloudCheckin.date
              );
            }
          } catch (syncError) {
            // eslint-disable-next-line no-console
            console.warn(
              `Failed to sync check-in for date ${cloudCheckin.date}:`,
              syncError
            );
          }
        }

        // eslint-disable-next-line no-console
        console.log("DashboardContext: Cloud sync completed successfully");
      } else {
        // eslint-disable-next-line no-console
        console.log("DashboardContext: No check-ins found in cloud");
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("DashboardContext: Failed to sync from cloud:", err);
      throw err;
    }
  }, [user?.id, isInitialized]);

  const refreshData = useCallback(
    async (syncFirst?: boolean) => {
      if (!isInitialized || !user?.id) return;

      setLoading(true);
      setError(null);

      try {
        // Optionally sync from cloud first
        if (syncFirst) {
          try {
            await syncFromCloud();
          } catch (syncErr) {
            // eslint-disable-next-line no-console
            console.warn("Failed to sync before refresh:", syncErr);
          }
        }

        // Fetch check-in statistics and mood trends
        const [stats, trend7Days, trend30Days] = await Promise.all([
          database.getCheckinStatistics(),
          database.getMoodTrendData(7),
          database.getMoodTrendData(30),
        ]);

        setStatistics(stats);
        setMoodTrend7Days(trend7Days);
        setMoodTrend30Days(trend30Days);

        // Fetch chat messages and calculate chat statistics
        const allMessages = await getAllChatMessages(user.id);
        const chatStats = calculateChatStatistics(allMessages);
        const [chatTrend7, chatTrend30] = await Promise.all([
          getChatTrendData(allMessages, 7),
          getChatTrendData(allMessages, 30),
        ]);

        setChatStatistics(chatStats);
        setChatTrend7Days(chatTrend7);
        setChatTrend30Days(chatTrend30);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Failed to load dashboard data:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load dashboard data"
        );
      } finally {
        setLoading(false);
      }
    },
    [isInitialized, user?.id, syncFromCloud]
  );

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const value = useMemo<DashboardContextValue>(
    () => ({
      statistics,
      moodTrend7Days,
      moodTrend30Days,
      chatStatistics,
      chatTrend7Days,
      chatTrend30Days,
      loading: loading || dbLoading,
      error,
      refreshData,
      syncFromCloud,
      selectedTimeRange,
      setSelectedTimeRange,
      dashboardType,
      setDashboardType,
    }),
    [
      statistics,
      moodTrend7Days,
      moodTrend30Days,
      chatStatistics,
      chatTrend7Days,
      chatTrend30Days,
      loading,
      dbLoading,
      error,
      refreshData,
      syncFromCloud,
      selectedTimeRange,
      setSelectedTimeRange,
      dashboardType,
      setDashboardType,
    ]
  );

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
};

export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx) {
    throw new Error("useDashboard must be used within <DashboardProvider>");
  }
  return ctx;
}
