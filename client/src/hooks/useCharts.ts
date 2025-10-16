import { useState, useEffect, useCallback } from "react";
import {
  api,
  type ChartTrack,
  type ChartMetadata,
  type ChartResponse,
} from "../shared/api";

interface UseChartsOptions {
  limit?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

/**
 * Hook for fetching music charts data
 * Supports global, trending, and country-specific charts
 * Features auto-refresh and mock data fallback
 */
export const useCharts = (
  type: "global" | "trending" | "country",
  countryCode?: string,
  options: UseChartsOptions = {}
) => {
  const { limit = 50, autoRefresh = false, refreshInterval = 300000 } = options;

  const [data, setData] = useState<ChartTrack[]>([]);
  const [metadata, setMetadata] = useState<ChartMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);

  /**
   * Generates mock chart data for development
   */
  const getMockData = (): ChartTrack[] => {
    if (type === "trending") {
      return [
        {
          rank: 1,
          track: {
            _id: "mock-trending-1",
            name: "Rising Star",
            artist: { _id: "artist-1", name: "New Artist" },
            duration: 180,
            coverUrl: "https://via.placeholder.com/300",
          },
          chartScore: 100,
          trend: "new",
          rankChange: 0,
          daysInChart: 1,
          peakPosition: 1,
          lastUpdated: new Date().toISOString(),
        },
      ];
    }
    return [
      {
        rank: 1,
        track: {
          _id: "mock-1",
          name: "Global Hit",
          artist: { _id: "artist-1", name: "Popular Artist" },
          duration: 200,
          coverUrl: "https://via.placeholder.com/300",
        },
        chartScore: 500,
        trend: "stable",
        rankChange: 0,
        daysInChart: 7,
        peakPosition: 1,
        lastUpdated: new Date().toISOString(),
      },
    ];
  };

  const fetchCharts = useCallback(
    async (showLoading = true) => {
      if (showLoading) setIsLoading(true);
      setError(null);

      try {
        let response: Response;

        switch (type) {
          case "global":
            response = await api.charts.getGlobal(limit);
            break;
          case "trending":
            response = await api.charts.getTrending(limit);
            break;
          case "country":
            if (!countryCode) throw new Error("Country code is required");
            response = await api.charts.getCountry(countryCode, limit);
            break;
          default:
            throw new Error("Invalid chart type");
        }

        if (!response.ok) {
          if (response.status === 404) {
            setData(getMockData());
            setMetadata({
              type,
              country: countryCode || "GLOBAL",
              limit,
              totalTracks: 2,
              lastUpdated: new Date().toISOString(),
              generatedAt: new Date().toISOString(),
            });
            setLastFetch(new Date());
            return;
          }
          throw new Error(`Failed to fetch charts (${response.status})`);
        }

        const result: ChartResponse = await response.json();
        if (!result.success) throw new Error(result.message);

        const tracks =
          type === "trending" ? result.data.trending : result.data.chart;
        if (!tracks) throw new Error("No tracks received");

        setData(tracks);
        setMetadata(result.data.metadata);
        setLastFetch(new Date());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load charts");
      } finally {
        if (showLoading) setIsLoading(false);
      }
    },
    [type, countryCode, limit]
  );

  /**
   * Returns human-readable time since last update
   */
  const getTimeSinceUpdate = useCallback(() => {
    if (!metadata?.lastUpdated) return null;
    const lastUpdate = new Date(metadata.lastUpdated);
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - lastUpdate.getTime()) / 60000
    );

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  }, [metadata]);

  useEffect(() => {
    fetchCharts(true);
  }, [fetchCharts]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => fetchCharts(false), refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchCharts]);

  return {
    data,
    metadata,
    isLoading,
    error,
    lastFetch,
    timeSinceUpdate: getTimeSinceUpdate(),
    hasData: data.length > 0,
    isEmpty: !isLoading && data.length === 0,
    refetch: () => fetchCharts(true),
    refresh: () => fetchCharts(false),
  };
};
