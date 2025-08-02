import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { type AppDispatch, type AppState } from "../store";
import { setCurrentTrack, setIsPlaying } from "../state/CurrentTrack.slice";
import type { Track } from "../types/TrackData";
import { useCharts } from "../hooks/useCharts";
import {
  TrophyOutlined,
  ArrowLeftOutlined,
  GlobalOutlined,
  RiseOutlined,
  CaretRightOutlined,
  PauseOutlined,
} from "@ant-design/icons";
import { api } from "../shared/api";

/**
 * Represents a track in the charts with additional chart-specific metadata
 */
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
    audioUrl?: string;
    isHLS?: boolean;
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

/**
 * Chart tab configuration
 */
interface ChartTab {
  id: "global" | "trending";
  label: string;
  icon: React.ReactNode;
  description: string;
}

/**
 * Animation configuration constants
 */
const ANIMATION_CONFIG = {
  pageTransition: { duration: 0.4 },
  itemStagger: 0.05,
  buttonHover: { scale: 1.05 },
  buttonTap: { scale: 0.95 },
} as const;

/**
 * Chart configuration constants
 */
const CHART_CONFIG = {
  global: { limit: 50, refreshInterval: 300000 }, // 5 minutes
  trending: { limit: 30, refreshInterval: 300000 },
} as const;

/**
 * Charts component - displays global and trending music charts
 * Features real-time updates, playback controls, and responsive design
 */
const Charts: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  // Redux state
  const currentTrackState = useSelector(
    (state: AppState) => state.currentTrack
  );

  // Local state
  const [activeTab, setActiveTab] = useState<"global" | "trending">("global");

  // Chart data fetching
  const {
    data: chartData,
    metadata,
    isLoading,
    error,
    refetch,
    timeSinceUpdate,
  } = useCharts(activeTab, undefined, {
    limit: CHART_CONFIG[activeTab].limit,
    autoRefresh: true,
    refreshInterval: CHART_CONFIG[activeTab].refreshInterval,
  });

  const getBestRankedTracks = (data: ChartTrack[]) => {
    const trackMap = new Map<string, ChartTrack>();

    data.forEach((item) => {
      const existingTrack = trackMap.get(item.track._id);
      if (!existingTrack || item.rank < existingTrack.rank) {
        trackMap.set(item.track._id, item);
      }
    });

    return Array.from(trackMap.values()).sort((a, b) => a.rank - b.rank);
  };

  const uniqueChartData = getBestRankedTracks(chartData);

  /**
   * Tab configuration
   */
  const tabs: ChartTab[] = [
    {
      id: "global",
      label: "Global Top 50",
      icon: <GlobalOutlined />,
      description: "Most popular tracks worldwide",
    },
    {
      id: "trending",
      label: "Trending Now",
      icon: <RiseOutlined />,
      description: "Fastest rising tracks",
    },
  ];

  /**
   * Handles play/pause functionality for chart tracks
   * Fetches full track data if needed before playing
   */
  const togglePlayPause = useCallback(
    async (track: ChartTrack["track"]) => {
      try {
        const isCurrentTrack =
          currentTrackState.currentTrack?._id === track._id;

        // Toggle play/pause for current track
        if (isCurrentTrack) {
          dispatch(setIsPlaying(!currentTrackState.isPlaying));
          return;
        }

        // Fetch full track data if audioUrl is missing
        if (!track.audioUrl) {
          const response = await api.track.getTrack(track._id);

          if (response.ok) {
            const result = await response.json();
            const fullTrack = result.data || result;
            dispatch(setCurrentTrack(fullTrack as Track));
          } else {
            dispatch(setCurrentTrack(track as Track));
          }
        } else {
          dispatch(setCurrentTrack(track as Track));
        }

        // Start playback with slight delay for state synchronization
        setTimeout(() => {
          dispatch(setIsPlaying(true));
        }, 50);
      } catch (error) {
        console.error("Error toggling playback:", error);
        // Fallback - attempt playback with available data
        dispatch(setCurrentTrack(track as Track));
        setTimeout(() => {
          dispatch(setIsPlaying(true));
        }, 50);
      }
    },
    [currentTrackState.currentTrack?._id, currentTrackState.isPlaying, dispatch]
  );

  /**
   * Formats duration from seconds to MM:SS format
   */
  const formatDuration = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }, []);

  /**
   * Formats large numbers with K/M suffixes
   */
  const formatNumber = useCallback((num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  }, []);

  /**
   * Loading skeleton for chart items
   */
  const ChartItemSkeleton: React.FC<{ index: number }> = ({ index }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.02 }}
      className="p-4 rounded-xl"
    >
      <div className="flex items-center gap-4">
        {/* Rank skeleton */}
        <div className="w-12 h-6 bg-white/10 rounded animate-pulse" />

        {/* Album art skeleton */}
        <div className="w-16 h-16 bg-white/10 rounded-lg animate-pulse" />

        {/* Track info skeleton */}
        <div className="flex-1 space-y-2">
          <div className="h-5 bg-white/10 rounded w-3/4 animate-pulse" />
          <div className="h-4 bg-white/10 rounded w-1/2 animate-pulse" />
          <div className="flex gap-2">
            <div className="h-3 bg-white/10 rounded w-16 animate-pulse" />
            <div className="h-3 bg-white/10 rounded w-20 animate-pulse" />
          </div>
        </div>

        {/* Stats skeleton */}
        <div className="hidden sm:flex flex-col items-end gap-1">
          <div className="h-4 bg-white/10 rounded w-12 animate-pulse" />
          <div className="h-3 bg-white/10 rounded w-16 animate-pulse" />
        </div>
      </div>
    </motion.div>
  );

  /**
   * Renders individual chart item with play controls and metadata
   */
  const renderChartItem = useCallback(
    (item: ChartTrack, index: number) => {
      const isCurrentTrack =
        currentTrackState.currentTrack?._id === item.track._id;
      const isPlaying = isCurrentTrack && currentTrackState.isPlaying;

      return (
        <motion.div
          key={`${item.track._id}-${item.rank}-${activeTab}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.4,
            delay: index * ANIMATION_CONFIG.itemStagger,
          }}
          className="p-4 hover:bg-white/5 rounded-xl transition-all duration-200 group"
        >
          <div className="flex items-center gap-4">
            {/* Rank Display */}
            <div className="flex items-center justify-center w-12 text-center">
              <span
                className={`text-lg font-bold ${
                  item.rank <= 3
                    ? "text-yellow-400"
                    : item.rank <= 10
                    ? "text-white"
                    : "text-white/70"
                }`}
              >
                {item.rank}
              </span>
            </div>

            {/* Album Art with Play Button */}
            <div className="relative flex-shrink-0">
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-white/10">
                {item.track.coverUrl ? (
                  <img
                    src={item.track.coverUrl}
                    alt={`${item.track.name} cover`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full bg-white/10 flex items-center justify-center">
                    <CaretRightOutlined className="text-white text-2xl" />
                  </div>
                )}
              </div>

              {/* Play/Pause Button Overlay */}
              <motion.button
                className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => togglePlayPause(item.track)}
                whileHover={ANIMATION_CONFIG.buttonHover}
                whileTap={ANIMATION_CONFIG.buttonTap}
                aria-label={isPlaying ? "Pause track" : "Play track"}
              >
                {isPlaying ? (
                  <PauseOutlined className="text-white text-2xl" />
                ) : (
                  <CaretRightOutlined className="text-white text-2xl" />
                )}
              </motion.button>

              {/* Currently Playing Indicator */}
              {isCurrentTrack && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                  {isPlaying ? (
                    <motion.div
                      className="w-2 h-2 bg-white rounded-full"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    />
                  ) : (
                    <PauseOutlined className="text-white text-xs" />
                  )}
                </div>
              )}
            </div>

            {/* Track Information */}
            <div className="flex-1 min-w-0">
              <h3
                className={`font-semibold truncate mb-1 ${
                  isCurrentTrack ? "text-green-400" : "text-white"
                }`}
              >
                {item.track.name}
              </h3>
              <p className="text-white/60 text-sm truncate">
                {item.track.artist.name}
              </p>
              {activeTab === "global" && (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-white/40 text-xs">
                    Peak: #{item.peakPosition}
                  </span>
                  <span className="text-white/30">•</span>
                  <span className="text-white/40 text-xs">
                    {item.daysInChart} days in chart
                  </span>
                </div>
              )}
            </div>

            {/* Track Statistics */}
            <div className="hidden sm:flex flex-col items-end text-right">
              <span className="text-white/60 text-sm">
                {formatDuration(item.track.duration)}
              </span>
              {item.track.validListenCount && (
                <span className="text-white/40 text-xs">
                  {formatNumber(item.track.validListenCount)} plays
                </span>
              )}
            </div>
          </div>
        </motion.div>
      );
    },
    [
      activeTab,
      currentTrackState,
      togglePlayPause,
      formatDuration,
      formatNumber,
    ]
  );

  /**
   * Renders main content based on loading/error/data states
   */
  const renderContent = useCallback(() => {
    // Loading state with skeletons
    if (isLoading) {
      return (
        <div className="space-y-1">
          {Array.from({ length: CHART_CONFIG[activeTab].limit }, (_, index) => (
            <ChartItemSkeleton key={index} index={index} />
          ))}
        </div>
      );
    }

    // Error state
    if (error) {
      return (
        <div className="flex flex-col items-center justify-center py-20">
          <TrophyOutlined className="text-4xl text-white/30 mb-4" />
          <h3 className="text-white/70 text-xl mb-2">Failed to load charts</h3>
          <p className="text-white/50 text-center max-w-md mb-4">{error}</p>
          <motion.button
            onClick={refetch}
            className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors duration-200"
            whileHover={ANIMATION_CONFIG.buttonHover}
            whileTap={ANIMATION_CONFIG.buttonTap}
          >
            Try again
          </motion.button>
        </div>
      );
    }

    // Empty state
    if (!chartData || chartData.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-20">
          <TrophyOutlined className="text-4xl text-white/30 mb-4" />
          <h3 className="text-white/70 text-xl mb-2">
            No chart data available
          </h3>
          <p className="text-white/50 text-center max-w-md">
            Charts are updated regularly. Please check back later.
          </p>
        </div>
      );
    }

    // Data state
    return (
      <div className="space-y-1">
        {uniqueChartData.map((item, index) => renderChartItem(item, index))}
      </div>
    );
  }, [isLoading, error, chartData, activeTab, refetch, renderChartItem]);

  return (
    <motion.main
      className="w-full min-h-screen pl-4 pr-4 sm:pl-8 sm:pr-8 xl:pl-[22vw] xl:pr-[2vw] flex flex-col gap-6 mb-45 xl:mb-6 py-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={ANIMATION_CONFIG.pageTransition}
    >
      {/* Page Header */}
      <motion.header
        className="flex items-center gap-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <motion.button
          onClick={() => navigate(-1)}
          className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-lg rounded-xl transition-all duration-200 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-white/20"
          whileHover={ANIMATION_CONFIG.buttonHover}
          whileTap={ANIMATION_CONFIG.buttonTap}
          aria-label="Go back"
        >
          <ArrowLeftOutlined className="text-white text-xl" />
        </motion.button>

        <div className="flex items-center gap-3">
          <motion.div
            className="p-3 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 backdrop-blur-lg rounded-xl border border-yellow-500/30"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              duration: 0.8,
              delay: 0.3,
              type: "spring",
              bounce: 0.6,
            }}
          >
            <TrophyOutlined className="text-yellow-400 text-2xl" />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <h1 className="text-white text-3xl font-bold">Charts</h1>
            <p className="text-white/70 text-lg">Discover what's trending</p>
          </motion.div>
        </div>
      </motion.header>

      {/* Tab Navigation */}
      <motion.nav
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <div className="flex gap-2 mb-6">
          {tabs.map((tab) => (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? "bg-white/20 text-white"
                  : "text-white/70 hover:text-white hover:bg-white/10"
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              aria-pressed={activeTab === tab.id}
            >
              {tab.icon}
              <div className="text-left">
                <div>{tab.label}</div>
                <div className="text-xs opacity-60">{tab.description}</div>
              </div>
            </motion.button>
          ))}
        </div>
      </motion.nav>

      {/* Chart Metadata */}
      {metadata && !isLoading && (
        <motion.div
          className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-4 mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <div className="flex items-center justify-between text-sm">
            <div className="text-white/70">
              Last updated:{" "}
              {timeSinceUpdate ||
                (metadata.lastUpdated
                  ? new Date(metadata.lastUpdated).toLocaleString()
                  : "Never")}
            </div>
            <div className="text-white/50">
              {metadata.totalTracks || 0} tracks
            </div>
          </div>
        </motion.div>
      )}

      {/* Main Content */}
      <motion.section
        className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </motion.section>
    </motion.main>
  );
};

export default Charts;
