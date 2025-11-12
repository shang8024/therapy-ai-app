import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  useContext,
} from "react";
import { database } from "../utils/database";
import { useDatabase } from "./DatabaseContext";

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

type DashboardContextValue = {
  statistics: DashboardStatistics | null;
  moodTrend7Days: MoodTrendData | null;
  moodTrend30Days: MoodTrendData | null;
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  selectedTimeRange: "7days" | "30days";
  setSelectedTimeRange: (range: "7days" | "30days") => void;
};

export const DashboardContext = createContext<DashboardContextValue | null>(
  null
);

type Props = { children: React.ReactNode };

export const DashboardProvider: React.FC<Props> = ({ children }) => {
  const { isInitialized, isLoading: dbLoading } = useDatabase();

  const [statistics, setStatistics] = useState<DashboardStatistics | null>(
    null
  );
  const [moodTrend7Days, setMoodTrend7Days] = useState<MoodTrendData | null>(
    null
  );
  const [moodTrend30Days, setMoodTrend30Days] = useState<MoodTrendData | null>(
    null
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState<
    "7days" | "30days"
  >("7days");

  const refreshData = useCallback(async () => {
    if (!isInitialized) return;

    setLoading(true);
    setError(null);

    try {
      // Fetch statistics
      const stats = await database.getCheckinStatistics();
      setStatistics(stats);

      // Fetch mood trend data for both time ranges
      const [trend7Days, trend30Days] = await Promise.all([
        database.getMoodTrendData(7),
        database.getMoodTrendData(30),
      ]);

      setMoodTrend7Days(trend7Days);
      setMoodTrend30Days(trend30Days);
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load dashboard data"
      );
    } finally {
      setLoading(false);
    }
  }, [isInitialized]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const value = useMemo<DashboardContextValue>(
    () => ({
      statistics,
      moodTrend7Days,
      moodTrend30Days,
      loading: loading || dbLoading,
      error,
      refreshData,
      selectedTimeRange,
      setSelectedTimeRange,
    }),
    [
      statistics,
      moodTrend7Days,
      moodTrend30Days,
      loading,
      dbLoading,
      error,
      refreshData,
      selectedTimeRange,
      setSelectedTimeRange,
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
