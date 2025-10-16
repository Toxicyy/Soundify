import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { type AppDispatch, type AppState } from "../store";
import { setCurrentTrack, setIsPlaying } from "../state/CurrentTrack.slice";
import type { Track } from "../types/TrackData";
import { useCharts } from "../hooks/useCharts";
import { useGetUserQuery } from "../state/UserApi.slice";
import {
  TrophyOutlined,
  ArrowLeftOutlined,
  GlobalOutlined,
  RiseOutlined,
  CaretRightOutlined,
  PauseOutlined,
  LoginOutlined,
  PlayCircleOutlined,
  SoundOutlined,
  StarFilled,
} from "@ant-design/icons";
import { api } from "../shared/api";

/**
 * Charts page with authentication requirement
 * Features: global/trending charts, track playback, auth-gated content
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

interface ChartTab {
  id: "global" | "trending";
  label: string;
  icon: React.ReactNode;
  description: string;
}

const ANIMATION_CONFIG = {
  pageTransition: { duration: 0.4 },
  itemStagger: 0.05,
  buttonHover: { scale: 1.05 },
  buttonTap: { scale: 0.95 },
} as const;

const CHART_CONFIG = {
  global: { limit: 50, refreshInterval: 300000 },
  trending: { limit: 30, refreshInterval: 300000 },
} as const;

const Charts: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const { data: user, isLoading: userLoading } = useGetUserQuery();

  const currentTrackState = useSelector(
    (state: AppState) => state.currentTrack
  );

  const [activeTab, setActiveTab] = useState<"global" | "trending">("global");

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

  const AuthRequiredState: React.FC = () => (
    <motion.div
      className="flex flex-col items-center justify-center py-16 xs:py-12 px-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="absolute inset-0 overflow-hidden opacity-5">
        <motion.div
          className="absolute top-10 left-10"
          animate={{
            y: [0, -20, 0],
            rotate: [0, 10, 0],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <SoundOutlined className="text-6xl text-white" />
        </motion.div>
        <motion.div
          className="absolute top-20 right-20"
          animate={{
            y: [0, 20, 0],
            rotate: [0, -15, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
        >
          <PlayCircleOutlined className="text-8xl text-white" />
        </motion.div>
        <motion.div
          className="absolute bottom-20 left-20"
          animate={{
            y: [0, -15, 0],
            rotate: [0, 20, 0],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2,
          }}
        >
          <StarFilled className="text-5xl text-white" />
        </motion.div>
        <motion.div
          className="absolute bottom-16 right-16"
          animate={{
            y: [0, 25, 0],
            rotate: [0, -10, 0],
          }}
          transition={{
            duration: 3.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.5,
          }}
        >
          <TrophyOutlined className="text-7xl text-white" />
        </motion.div>
      </div>

      <motion.div
        className="relative z-10 text-center max-w-md"
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{
          duration: 0.8,
          type: "spring",
          bounce: 0.4,
          delay: 0.2,
        }}
      >
        <motion.div
          className="relative mb-6 xs:mb-4"
          initial={{ rotate: -180, scale: 0 }}
          animate={{ rotate: 0, scale: 1 }}
          transition={{
            duration: 1.2,
            type: "spring",
            bounce: 0.6,
            delay: 0.3,
          }}
        >
          <div className="relative inline-block">
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-yellow-400/30 to-orange-500/30 rounded-full blur-xl scale-150"
              animate={{
                opacity: [0.3, 0.7, 0.3],
                scale: [1.4, 1.6, 1.4],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            <div className="relative p-6 xs:p-4 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 backdrop-blur-lg rounded-2xl border border-yellow-500/30">
              <TrophyOutlined className="text-yellow-400 text-6xl xs:text-5xl" />
            </div>
          </div>
        </motion.div>

        <motion.h2
          className="text-2xl xs:text-xl font-bold text-white mb-3 xs:mb-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          Join the Music Charts
        </motion.h2>

        <motion.p
          className="text-white/70 text-base xs:text-sm leading-relaxed mb-8 xs:mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
        >
          Sign in to discover trending tracks, see what's climbing the charts,
          and compete with music lovers worldwide
        </motion.p>

        <motion.div
          className="mb-8 xs:mb-6 space-y-3 xs:space-y-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.9 }}
        >
          <div className="flex items-center gap-3 text-white/80 text-sm xs:text-xs">
            <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex-shrink-0" />
            <span>Track your favorite songs in real-time charts</span>
          </div>
          <div className="flex items-center gap-3 text-white/80 text-sm xs:text-xs">
            <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex-shrink-0" />
            <span>Discover trending tracks before they go viral</span>
          </div>
          <div className="flex items-center gap-3 text-white/80 text-sm xs:text-xs">
            <div className="w-2 h-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex-shrink-0" />
            <span>Compete with global music community</span>
          </div>
        </motion.div>

        <motion.div
          className="flex flex-col xs:flex-row gap-3 xs:gap-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.1 }}
        >
          <motion.button
            onClick={() => navigate("/login")}
            className="flex items-center justify-center gap-2 px-6 xs:px-4 py-3 xs:py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-xl xs:rounded-lg transition-all duration-300 shadow-lg hover:shadow-purple-500/25 text-sm xs:text-xs"
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
          >
            <LoginOutlined className="text-base xs:text-sm" />
            Sign In
          </motion.button>

          <motion.button
            onClick={() => navigate("/signup")}
            className="flex items-center justify-center gap-2 px-6 xs:px-4 py-3 xs:py-2 bg-white/10 hover:bg-white/15 text-white font-medium rounded-xl xs:rounded-lg transition-all duration-300 border border-white/20 hover:border-white/30 text-sm xs:text-xs"
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
          >
            Create Account
          </motion.button>
        </motion.div>

        <motion.p
          className="text-white/50 text-xs xs:text-[10px] mt-6 xs:mt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.3 }}
        >
          Free forever • No credit card required
        </motion.p>
      </motion.div>

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 6 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white/20 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -100, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 4 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
    </motion.div>
  );

  const togglePlayPause = useCallback(
    async (track: ChartTrack["track"]) => {
      try {
        const isCurrentTrack =
          currentTrackState.currentTrack?._id === track._id;

        if (isCurrentTrack) {
          dispatch(setIsPlaying(!currentTrackState.isPlaying));
          return;
        }

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

        setTimeout(() => {
          dispatch(setIsPlaying(true));
        }, 50);
      } catch (error) {
        console.error("Error toggling playback:", error);
        dispatch(setCurrentTrack(track as Track));
        setTimeout(() => {
          dispatch(setIsPlaying(true));
        }, 50);
      }
    },
    [currentTrackState.currentTrack?._id, currentTrackState.isPlaying, dispatch]
  );

  const formatDuration = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }, []);

  const formatNumber = useCallback((num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  }, []);

  const ChartItemSkeleton: React.FC<{ index: number }> = ({ index }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.02 }}
      className="p-3 xs:p-4 rounded-xl"
    >
      <div className="flex items-center gap-3 xs:gap-4">
        <div className="w-10 xs:w-12 h-5 xs:h-6 bg-white/10 rounded animate-pulse" />
        <div className="w-12 h-12 xs:w-16 xs:h-16 bg-white/10 rounded-lg animate-pulse" />
        <div className="flex-1 space-y-1 xs:space-y-2">
          <div className="h-4 xs:h-5 bg-white/10 rounded w-3/4 animate-pulse" />
          <div className="h-3 xs:h-4 bg-white/10 rounded w-1/2 animate-pulse" />
          <div className="flex gap-2">
            <div className="h-2 xs:h-3 bg-white/10 rounded w-12 xs:w-16 animate-pulse" />
            <div className="h-2 xs:h-3 bg-white/10 rounded w-16 xs:w-20 animate-pulse" />
          </div>
        </div>
        <div className="hidden sm:flex flex-col items-end gap-1">
          <div className="h-3 xs:h-4 bg-white/10 rounded w-10 xs:w-12 animate-pulse" />
          <div className="h-2 xs:h-3 bg-white/10 rounded w-12 xs:w-16 animate-pulse" />
        </div>
      </div>
    </motion.div>
  );

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
          className="p-3 xs:p-4 hover:bg-white/5 rounded-xl transition-all duration-200 group"
        >
          <div className="flex items-center gap-3 xs:gap-4">
            <div className="flex items-center justify-center w-10 xs:w-12 text-center">
              <span
                className={`text-base xs:text-lg font-bold ${
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

            <div className="relative flex-shrink-0">
              <div className="w-12 h-12 xs:w-16 xs:h-16 rounded-lg overflow-hidden bg-white/10">
                {item.track.coverUrl ? (
                  <img
                    src={item.track.coverUrl}
                    alt={`${item.track.name} cover`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full bg-white/10 flex items-center justify-center">
                    <CaretRightOutlined className="text-white text-lg xs:text-2xl" />
                  </div>
                )}
              </div>

              <motion.button
                className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => togglePlayPause(item.track)}
                whileHover={ANIMATION_CONFIG.buttonHover}
                whileTap={ANIMATION_CONFIG.buttonTap}
                aria-label={isPlaying ? "Pause track" : "Play track"}
              >
                {isPlaying ? (
                  <PauseOutlined className="text-white text-lg xs:text-2xl" />
                ) : (
                  <CaretRightOutlined className="text-white text-lg xs:text-2xl" />
                )}
              </motion.button>

              {isCurrentTrack && (
                <div className="absolute -top-0.5 -right-0.5 xs:-top-1 xs:-right-1 w-3 h-3 xs:w-4 xs:h-4 bg-green-500 rounded-full flex items-center justify-center">
                  {isPlaying ? (
                    <motion.div
                      className="w-1.5 h-1.5 xs:w-2 xs:h-2 bg-white rounded-full"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    />
                  ) : (
                    <PauseOutlined className="text-white text-[8px] xs:text-xs" />
                  )}
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h3
                className={`font-semibold truncate mb-1 text-sm xs:text-base ${
                  isCurrentTrack ? "text-green-400" : "text-white"
                }`}
              >
                {item.track.name}
              </h3>
              <p className="text-white/60 text-xs xs:text-sm truncate">
                {item.track.artist.name}
              </p>
              {activeTab === "global" && (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-white/40 text-[10px] xs:text-xs">
                    Peak: #{item.peakPosition}
                  </span>
                  <span className="text-white/30">•</span>
                  <span className="text-white/40 text-[10px] xs:text-xs">
                    {item.daysInChart} days in chart
                  </span>
                </div>
              )}
            </div>

            <div className="hidden sm:flex flex-col items-end text-right">
              <span className="text-white/60 text-xs xs:text-sm">
                {formatDuration(item.track.duration)}
              </span>
              {item.track.validListenCount && (
                <span className="text-white/40 text-[10px] xs:text-xs">
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

  const renderContent = useCallback(() => {
    if (isLoading) {
      return (
        <div className="space-y-1">
          {Array.from({ length: CHART_CONFIG[activeTab].limit }, (_, index) => (
            <ChartItemSkeleton key={index} index={index} />
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center py-16 xs:py-12">
          <TrophyOutlined className="text-3xl xs:text-4xl text-white/30 mb-3 xs:mb-4" />
          <h3 className="text-white/70 text-lg xs:text-xl mb-2">
            Failed to load charts
          </h3>
          <p className="text-white/50 text-center max-w-md mb-4 text-sm xs:text-base px-4">
            {error}
          </p>
          <motion.button
            onClick={refetch}
            className="px-4 xs:px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors duration-200 text-sm xs:text-base"
            whileHover={ANIMATION_CONFIG.buttonHover}
            whileTap={ANIMATION_CONFIG.buttonTap}
          >
            Try again
          </motion.button>
        </div>
      );
    }

    if (!chartData || chartData.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-16 xs:py-12">
          <TrophyOutlined className="text-3xl xs:text-4xl text-white/30 mb-3 xs:mb-4" />
          <h3 className="text-white/70 text-lg xs:text-xl mb-2">
            No chart data available
          </h3>
          <p className="text-white/50 text-center max-w-md text-sm xs:text-base px-4">
            Charts are updated regularly. Please check back later.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-1">
        {uniqueChartData.map((item, index) => renderChartItem(item, index))}
      </div>
    );
  }, [
    isLoading,
    error,
    chartData,
    activeTab,
    refetch,
    renderChartItem,
    uniqueChartData,
  ]);

  if (userLoading) {
    return (
      <motion.main
        className="w-full min-h-screen pl-3 pr-3 xs:pl-4 xs:pr-4 sm:pl-8 sm:pr-8 xl:pl-[22vw] xl:pr-[2vw] flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 xs:w-12 xs:h-12 border-3 border-white/20 border-t-white rounded-full animate-spin" />
          <p className="text-white/70 text-sm xs:text-base">Loading...</p>
        </div>
      </motion.main>
    );
  }

  if (!user) {
    return (
      <motion.main
        className="w-full min-h-screen pl-3 pr-3 xs:pl-4 xs:pr-4 sm:pl-8 sm:pr-8 xl:pl-[22vw] xl:pr-[2vw] flex flex-col gap-4 xs:gap-6 mb-32 xs:mb-45 xl:mb-6 py-4 xs:py-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={ANIMATION_CONFIG.pageTransition}
      >
        <motion.header
          className="flex items-center gap-3 xs:gap-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <motion.button
            onClick={() => navigate(-1)}
            className="p-2 xs:p-3 bg-white/10 hover:bg-white/20 backdrop-blur-lg rounded-lg xs:rounded-xl transition-all duration-200 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-white/20 flex-shrink-0"
            whileHover={ANIMATION_CONFIG.buttonHover}
            whileTap={ANIMATION_CONFIG.buttonTap}
            aria-label="Go back"
          >
            <ArrowLeftOutlined className="text-white text-base xs:text-xl" />
          </motion.button>

          <div className="flex items-center gap-2 xs:gap-3">
            <motion.div
              className="p-2 xs:p-3 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 backdrop-blur-lg rounded-lg xs:rounded-xl border border-yellow-500/30"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                duration: 0.8,
                delay: 0.3,
                type: "spring",
                bounce: 0.6,
              }}
            >
              <TrophyOutlined className="text-yellow-400 text-lg xs:text-2xl" />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <h1 className="text-white text-2xl xs:text-3xl font-bold">
                Charts
              </h1>
              <p className="text-white/70 text-sm xs:text-lg">
                Discover what's trending
              </p>
            </motion.div>
          </div>
        </motion.header>

        <motion.section
          className="bg-white/8 md:bg-white/5 md:backdrop-blur-lg border border-white/10 rounded-xl xs:rounded-2xl overflow-hidden flex-1 flex items-center justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <AuthRequiredState />
        </motion.section>
      </motion.main>
    );
  }

  return (
    <motion.main
      className="w-full min-h-screen pl-3 pr-3 xs:pl-4 xs:pr-4 sm:pl-8 sm:pr-8 xl:pl-[22vw] xl:pr-[2vw] flex flex-col gap-4 xs:gap-6 mb-32 xs:mb-45 xl:mb-6 py-4 xs:py-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={ANIMATION_CONFIG.pageTransition}
    >
      <motion.header
        className="flex items-center gap-3 xs:gap-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <motion.button
          onClick={() => navigate(-1)}
          className="p-2 xs:p-3 bg-white/10 hover:bg-white/20 backdrop-blur-lg rounded-lg xs:rounded-xl transition-all duration-200 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-white/20 flex-shrink-0"
          whileHover={ANIMATION_CONFIG.buttonHover}
          whileTap={ANIMATION_CONFIG.buttonTap}
          aria-label="Go back"
        >
          <ArrowLeftOutlined className="text-white text-base xs:text-xl" />
        </motion.button>

        <div className="flex items-center gap-2 xs:gap-3">
          <motion.div
            className="p-2 xs:p-3 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 backdrop-blur-lg rounded-lg xs:rounded-xl border border-yellow-500/30"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              duration: 0.8,
              delay: 0.3,
              type: "spring",
              bounce: 0.6,
            }}
          >
            <TrophyOutlined className="text-yellow-400 text-lg xs:text-2xl" />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <h1 className="text-white text-2xl xs:text-3xl font-bold">
              Charts
            </h1>
            <p className="text-white/70 text-sm xs:text-lg">
              Discover what's trending
            </p>
          </motion.div>
        </div>
      </motion.header>

      <motion.nav
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <div className="flex gap-1.5 xs:gap-2 mb-4 xs:mb-6 overflow-x-auto">
          {tabs.map((tab) => (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-4 xs:px-6 py-2.5 xs:py-3 rounded-lg xs:rounded-xl text-xs xs:text-sm font-medium transition-all duration-200 whitespace-nowrap flex-shrink-0 ${
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
                <div className="text-[10px] xs:text-xs opacity-60">
                  {tab.description}
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </motion.nav>

      {metadata && !isLoading && (
        <motion.div
          className="bg-white/8 md:bg-white/5 md:backdrop-blur-lg border border-white/10 rounded-lg xs:rounded-xl p-3 xs:p-4 mb-3 xs:mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <div className="flex items-center justify-between text-xs xs:text-sm">
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

      <motion.section
        className="bg-white/8 md:bg-white/5 md:backdrop-blur-lg border border-white/10 rounded-xl xs:rounded-2xl overflow-hidden"
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
