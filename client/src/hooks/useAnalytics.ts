// hooks/useAnalytics.ts
import { useState, useEffect, useCallback } from "react";
import { message } from "antd";
import { api } from "../shared/api";

interface DashboardStats {
  totalUsers: number;
  activeArtists: number;
  platformPlaylists: number;
  monthlyStreams: number;
  lastUpdated: string;
}

interface StatsState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

interface UseAnalyticsOptions {
  autoRefresh?: boolean;
  refreshInterval?: number; // в миллисекундах
  showError?: boolean;
}

// Основной хук для статистики дашборда
export const useDashboardStats = (options: UseAnalyticsOptions = {}) => {
  const {
    autoRefresh = true,
    refreshInterval = 5 * 60 * 1000, // 5 минут по умолчанию
    showError = true,
  } = options;

  const [state, setState] = useState<StatsState<DashboardStats>>({
    data: null,
    loading: true,
    error: null,
    refetch: async () => {},
  });

  const fetchStats = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const response = await api.analytics.getDashboard();

      if (!response.ok) {
        throw new Error("Failed to fetch dashboard stats");
      }

      const result = await response.json();

      setState({
        data: result.data,
        loading: false,
        error: null,
        refetch: fetchStats,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      setState((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));

      if (showError) {
        message.error(`Failed to load statistics: ${errorMessage}`);
      }
    }
  }, [showError]);

  useEffect(() => {
    fetchStats();

    if (autoRefresh && refreshInterval > 0) {
      const interval = setInterval(fetchStats, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchStats, autoRefresh, refreshInterval]);

  return state;
};

// Хук для статистики пользователей с фильтрами
interface UserStatsParams {
  startDate?: string;
  endDate?: string;
}

interface UserStats {
  total: number;
  daily: Array<{ _id: string; count: number }>;
  growth: number;
}

export const useUserStats = (
  params: UserStatsParams = {},
  options: UseAnalyticsOptions = {}
) => {
  const [state, setState] = useState<StatsState<UserStats>>({
    data: null,
    loading: true,
    error: null,
    refetch: async () => {},
  });

  const fetchStats = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const queryParams = new URLSearchParams();
      if (params.startDate) queryParams.append("startDate", params.startDate);
      if (params.endDate) queryParams.append("endDate", params.endDate);

      const response = await api.analytics.getUsers(queryParams.toString());

      if (!response.ok) {
        throw new Error("Failed to fetch user stats");
      }

      const result = await response.json();

      setState({
        data: result.data,
        loading: false,
        error: null,
        refetch: fetchStats,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      setState((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));

      if (options.showError) {
        message.error(`Failed to load user statistics: ${errorMessage}`);
      }
    }
  }, [params.startDate, params.endDate, options.showError]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return state;
};

// Хук для статистики прослушиваний
type StreamsPeriod = "day" | "week" | "month" | "year";

interface StreamStats {
  period: StreamsPeriod;
  data: Array<{
    _id: string;
    streams: number;
    uniqueTracksCount: number;
  }>;
  total: number;
}

export const useStreamStats = (
  period: StreamsPeriod = "month",
  options: UseAnalyticsOptions = {}
) => {
  const [state, setState] = useState<StatsState<StreamStats>>({
    data: null,
    loading: true,
    error: null,
    refetch: async () => {},
  });

  const fetchStats = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const response = await api.analytics.getStreams(period);

      if (!response.ok) {
        throw new Error("Failed to fetch stream stats");
      }

      const result = await response.json();

      setState({
        data: result.data,
        loading: false,
        error: null,
        refetch: fetchStats,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      setState((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));

      if (options.showError) {
        message.error(`Failed to load stream statistics: ${errorMessage}`);
      }
    }
  }, [period, options.showError]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return state;
};

// Комбинированный хук для всей аналитики
export const useAnalyticsSummary = (options: UseAnalyticsOptions = {}) => {
  const dashboard = useDashboardStats(options);
  const users = useUserStats({}, { ...options, autoRefresh: false });
  const streams = useStreamStats("month", { ...options, autoRefresh: false });

  const isLoading = dashboard.loading || users.loading || streams.loading;
  const hasError = dashboard.error || users.error || streams.error;

  const refetchAll = useCallback(async () => {
    await Promise.all([
      dashboard.refetch(),
      users.refetch(),
      streams.refetch(),
    ]);
  }, [dashboard.refetch, users.refetch, streams.refetch]);

  return {
    dashboard: dashboard.data,
    users: users.data,
    streams: streams.data,
    loading: isLoading,
    error: hasError,
    refetch: refetchAll,
  };
};
