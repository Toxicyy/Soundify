import { useState, useEffect, useCallback } from "react";

interface ChartTrack {
  rank: number;
  track: {
    _id: string;
    name: string;
    artist: {
      _id: string;
      name: string;
      avatar?: string;
    };
    coverUrl?: string;
    duration: number;
    validListenCount?: number;
  };
  chartScore: number;
  trend: "up" | "down" | "stable" | "new";
  rankChange: number;
  daysInChart: number;
  peakPosition: number;
  lastUpdated: string;
}

interface ChartMetadata {
  type: string;
  country: string;
  limit: number;
  totalTracks: number;
  lastUpdated: string;
  generatedAt: string;
}

interface ChartResponse {
  success: boolean;
  message: string;
  data: {
    chart?: ChartTrack[];
    trending?: ChartTrack[];
    metadata: ChartMetadata;
  };
}

interface UseChartsOptions {
  limit?: number;
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
}

export const useCharts = (
  type: "global" | "trending" | "country",
  countryCode?: string,
  options: UseChartsOptions = {}
) => {
  const {
    limit = 50,
    autoRefresh = false,
    refreshInterval = 300000, // 5 minutes
  } = options;

  const [data, setData] = useState<ChartTrack[]>([]);
  const [metadata, setMetadata] = useState<ChartMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);

  const getApiEndpoint = useCallback(() => {
    const baseUrl = "http://localhost:5000/api/charts";
    const limitParam = `?limit=${limit}`;

    switch (type) {
      case "global":
        return `${baseUrl}/global${limitParam}`;
      case "trending":
        return `${baseUrl}/trending${limitParam}`;
      case "country":
        if (!countryCode) {
          throw new Error("Country code is required for country charts");
        }
        return `${baseUrl}/country/${countryCode}${limitParam}`;
      default:
        throw new Error("Invalid chart type");
    }
  }, [type, countryCode, limit]);

  const fetchCharts = useCallback(
    async (showLoading = true) => {
      if (showLoading) {
        setIsLoading(true);
      }
      setError(null);

      try {
        const token = localStorage.getItem("token");
        console.log("Token:", token ? "exists" : "missing"); // Debug log

        if (!token) {
          throw new Error("Authentication required. Please log in.");
        }

        const endpoint = getApiEndpoint();
        console.log("Fetching:", endpoint); // Debug log

        const response = await fetch(endpoint, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          cache: "no-store", // Disable caching
        });

        console.log("Response status:", response.status); // Debug log

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("Authentication failed. Please log in again.");
          }
          if (response.status === 404) {
            // Special handling for charts not available yet
            console.warn(
              "Charts not available yet, using mock data for development"
            );

            // Return mock data for development - MORE DATA for trending
            const mockData: ChartTrack[] =
              type === "trending"
                ? [
                    {
                      rank: 1,
                      track: {
                        _id: "mock-trending-1",
                        name: "Rising Star",
                        artist: { _id: "artist-1", name: "New Artist" },
                        duration: 180,
                        validListenCount: 1000,
                        coverUrl:
                          "https://via.placeholder.com/300x300/EF4444/FFFFFF?text=Rising+Star",
                      },
                      chartScore: 100,
                      trend: "new" as const,
                      rankChange: 0,
                      daysInChart: 1,
                      peakPosition: 1,
                      lastUpdated: new Date().toISOString(),
                    },
                    {
                      rank: 2,
                      track: {
                        _id: "mock-trending-2",
                        name: "Viral Hit",
                        artist: { _id: "artist-2", name: "Trending Artist" },
                        duration: 210,
                        validListenCount: 2500,
                        coverUrl:
                          "https://via.placeholder.com/300x300/10B981/FFFFFF?text=Viral+Hit",
                      },
                      chartScore: 95,
                      trend: "up" as const,
                      rankChange: 15,
                      daysInChart: 3,
                      peakPosition: 2,
                      lastUpdated: new Date().toISOString(),
                    },
                    {
                      rank: 3,
                      track: {
                        _id: "mock-trending-3",
                        name: "Rocket Song",
                        artist: { _id: "artist-3", name: "Hot Artist" },
                        duration: 195,
                        validListenCount: 1800,
                        coverUrl:
                          "https://via.placeholder.com/300x300/F59E0B/FFFFFF?text=Rocket+Song",
                      },
                      chartScore: 88,
                      trend: "up" as const,
                      rankChange: 8,
                      daysInChart: 5,
                      peakPosition: 3,
                      lastUpdated: new Date().toISOString(),
                    },
                    {
                      rank: 4,
                      track: {
                        _id: "mock-trending-4",
                        name: "Fresh Sound",
                        artist: { _id: "artist-4", name: "Breakout Star" },
                        duration: 175,
                        validListenCount: 1200,
                        coverUrl:
                          "https://via.placeholder.com/300x300/8B5CF6/FFFFFF?text=Fresh+Sound",
                      },
                      chartScore: 82,
                      trend: "new" as const,
                      rankChange: 0,
                      daysInChart: 1,
                      peakPosition: 4,
                      lastUpdated: new Date().toISOString(),
                    },
                  ]
                : [
                    {
                      rank: 1,
                      track: {
                        _id: "mock-1",
                        name: "Global Hit 1",
                        artist: { _id: "artist-1", name: "Popular Artist" },
                        duration: 200,
                        validListenCount: 5000,
                        coverUrl:
                          "https://via.placeholder.com/300x300/10B981/FFFFFF?text=Global+Hit",
                      },
                      chartScore: 500,
                      trend: "stable" as const,
                      rankChange: 0,
                      daysInChart: 7,
                      peakPosition: 1,
                      lastUpdated: new Date().toISOString(),
                    },
                    {
                      rank: 2,
                      track: {
                        _id: "mock-2",
                        name: "Chart Topper 2",
                        artist: { _id: "artist-2", name: "Famous Singer" },
                        duration: 195,
                        validListenCount: 4500,
                        coverUrl:
                          "https://via.placeholder.com/300x300/F59E0B/FFFFFF?text=Chart+Topper",
                      },
                      chartScore: 450,
                      trend: "down" as const,
                      rankChange: -1,
                      daysInChart: 14,
                      peakPosition: 1,
                      lastUpdated: new Date().toISOString(),
                    },
                  ];

            setData(mockData);
            setMetadata({
              type,
              country: "GLOBAL",
              limit,
              totalTracks: mockData.length,
              lastUpdated: new Date().toISOString(),
              generatedAt: new Date().toISOString(),
            });
            setLastFetch(new Date());
            return;
          }
          throw new Error(
            `Failed to fetch ${type} charts (${response.status})`
          );
        }

        const result: ChartResponse = await response.json();

        if (!result.success) {
          throw new Error(result.message || "Failed to load charts");
        }

        // Extract tracks based on chart type
        const tracks =
          type === "trending" ? result.data.trending : result.data.chart;

        if (!tracks) {
          throw new Error("No chart data received");
        }

        setData(tracks);
        setMetadata(result.data.metadata);
        setLastFetch(new Date());
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to load charts";
        setError(errorMessage);
        console.error("Charts fetch error:", err);
      } finally {
        if (showLoading) {
          setIsLoading(false);
        }
      }
    },
    [type, countryCode, getApiEndpoint]
  );

  // Refresh charts silently (without loading state)
  const refreshCharts = useCallback(() => {
    fetchCharts(false);
  }, [fetchCharts]);

  // Manual refresh with loading state
  const refetchCharts = useCallback(() => {
    fetchCharts(true);
  }, [fetchCharts]);

  // Initial fetch
  useEffect(() => {
    fetchCharts(true);
  }, [fetchCharts]);

  // Auto-refresh setup
  useEffect(() => {
    if (!autoRefresh || refreshInterval <= 0) {
      return;
    }

    const interval = setInterval(() => {
      refreshCharts();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, refreshCharts]);

  // Calculate time since last update
  const getTimeSinceUpdate = useCallback(() => {
    if (!metadata?.lastUpdated) return null;

    const lastUpdate = new Date(metadata.lastUpdated);
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - lastUpdate.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  }, [metadata?.lastUpdated]);

  return {
    // Data
    data,
    metadata,
    lastFetch,

    // States
    isLoading,
    error,

    // Actions
    refetch: refetchCharts,
    refresh: refreshCharts,

    // Computed
    timeSinceUpdate: getTimeSinceUpdate(),
    hasData: data.length > 0,
    isEmpty: !isLoading && data.length === 0,
  };
};

// Hook for getting available countries with charts
export const useAvailableCountries = () => {
  const [countries, setCountries] = useState<
    Array<{
      countryCode: string;
      trackCount: number;
      lastUpdated: string;
    }>
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCountries = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch(
        "http://localhost:5000/api/charts/countries",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch available countries");
      }

      const result = await response.json();

      if (result.success) {
        setCountries(result.data.countries || []);
      } else {
        throw new Error(result.message || "Failed to load countries");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load countries";
      setError(errorMessage);
      console.error("Countries fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCountries();
  }, [fetchCountries]);

  return {
    countries,
    isLoading,
    error,
    refetch: fetchCountries,
    hasCountries: countries.length > 0,
  };
};

// Hook for chart statistics (admin/monitoring)
export const useChartStats = () => {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch("http://localhost:5000/api/charts/stats", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch chart statistics");
      }

      const result = await response.json();

      if (result.success) {
        setStats(result.data);
      } else {
        throw new Error(result.message || "Failed to load statistics");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load statistics";
      setError(errorMessage);
      console.error("Chart stats fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    isLoading,
    error,
    refetch: fetchStats,
  };
};
