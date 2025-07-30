import { useState } from "react";
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
  CaretUpOutlined,
  CaretDownOutlined,
  MinusOutlined,
  StarOutlined,
  LoadingOutlined,
} from "@ant-design/icons";

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
    audioUrl?: string; // Добавили
    isHLS?: boolean; // Добавили
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

const Charts = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  // Redux state selectors
  const currentTrackState = useSelector(
    (state: AppState) => state.currentTrack
  );

  const [activeTab, setActiveTab] = useState<"global" | "trending">("global");

  // Use charts hook for data fetching
  const {
    data: chartData,
    metadata,
    isLoading,
    error,
    refetch,
    timeSinceUpdate,
  } = useCharts(activeTab, undefined, {
    limit: activeTab === "global" ? 50 : 30,
    autoRefresh: true,
    refreshInterval: 300000, // 5 minutes
  });

  const tabs = [
    {
      id: "global" as const,
      label: "Global Top 50",
      icon: <GlobalOutlined />,
      description: "Most popular tracks worldwide",
    },
    {
      id: "trending" as const,
      label: "Trending Now",
      icon: <RiseOutlined />,
      description: "Fastest rising tracks",
    },
  ];

  const createTestData = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        "http://localhost:5000/api/charts/admin/test-data",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const result = await response.json();
      console.log("Test data creation result:", result);

      if (result.success) {
        setTimeout(() => triggerChartGeneration(), 1000);
      }
    } catch (error) {
      console.error("Failed to create test data:", error);
    }
  };

  const triggerChartGeneration = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        "http://localhost:5000/api/charts/admin/update",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ type: "all" }),
        }
      );

      const result = await response.json();
      console.log("Chart generation result:", result);

      if (result.success) {
        setTimeout(() => refetch(), 2000);
      }
    } catch (error) {
      console.error("Failed to trigger chart generation:", error);
    }
  };

  const togglePlayPause = async (track: ChartTrack["track"]) => {
    try {
      // Проверяем, является ли этот трек текущим играющим
      const isCurrentTrack = currentTrackState.currentTrack?._id === track._id;

      if (isCurrentTrack) {
        // Если это текущий трек, просто переключаем play/pause
        dispatch(setIsPlaying(!currentTrackState.isPlaying));
        return;
      }

      // Если у трека нет audioUrl, загрузим полные данные
      if (!track.audioUrl) {
        console.log("Loading full track data for playback...");

        const response = await fetch(
          `http://localhost:5000/api/tracks/${track._id}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (response.ok) {
          const result = await response.json();
          const fullTrack = result.data || result;

          // Обновляем трек с полными данными
          dispatch(
            setCurrentTrack({fullTrack})
          );
        } else {
          console.error("Failed to load track data for playback");
          dispatch(setCurrentTrack(track as Track)); // Попробуем с неполными данными
        }
      } else {
        dispatch(setCurrentTrack(track as Track));
      }

      setTimeout(() => {
        dispatch(setIsPlaying(true));
      }, 50);
    } catch (error) {
      console.error("Error loading track for playbook:", error);
      // Fallback - попробуем воспроизвести с неполными данными
      dispatch(setCurrentTrack(track as Track));
      setTimeout(() => {
        dispatch(setIsPlaying(true));
      }, 50);
    }
  };

  const getTrendIcon = (trend: ChartTrack["trend"], _rankChange: number) => {
    switch (trend) {
      case "up":
        return <CaretUpOutlined className="text-green-400" />;
      case "down":
        return <CaretDownOutlined className="text-red-400" />;
      case "new":
        return <StarOutlined className="text-yellow-400" />;
      default:
        return <MinusOutlined className="text-gray-400" />;
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const renderChartItem = (item: ChartTrack, index: number) => {
    // Проверяем, является ли этот трек текущим играющим
    const isCurrentTrack =
      currentTrackState.currentTrack?._id === item.track._id;
    const isPlaying = isCurrentTrack && currentTrackState.isPlaying;

    return (
      <motion.div
        key={item.track._id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: index * 0.05 }}
        className="p-4 hover:bg-white/5 rounded-xl transition-all duration-200 group"
      >
        <div className="flex items-center gap-4">
          {/* Rank */}
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

          {/* Trend Indicator */}
          <div className="flex flex-col items-center w-8">
            {getTrendIcon(item.trend, item.rankChange)}
            {item.rankChange !== 0 && (
              <span
                className={`text-xs ${
                  item.rankChange > 0 ? "text-green-400" : "text-red-400"
                }`}
              >
                {Math.abs(item.rankChange)}
              </span>
            )}
          </div>

          {/* Album Art + Play Button */}
          <div className="relative flex-shrink-0">
            <div className="w-16 h-16 rounded-lg overflow-hidden bg-white/10">
              {item.track.coverUrl ? (
                <img
                  src={item.track.coverUrl}
                  alt={item.track.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-white/10 flex items-center justify-center">
                  <CaretRightOutlined
                    style={{ color: "white", fontSize: "24px" }}
                  />
                </div>
              )}
            </div>

            {/* Play Button Overlay */}
            <motion.button
              className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => togglePlayPause(item.track)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isPlaying ? (
                <PauseOutlined style={{ color: "white", fontSize: "24px" }} />
              ) : (
                <CaretRightOutlined
                  style={{ color: "white", fontSize: "24px" }}
                />
              )}
            </motion.button>

            {/* Playing Indicator */}
            {isCurrentTrack && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                {isPlaying ? (
                  <motion.div
                    className="w-2 h-2 bg-white rounded-full"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                ) : (
                  <PauseOutlined style={{ color: "white", fontSize: "8px" }} />
                )}
              </div>
            )}
          </div>

          {/* Track Info */}
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

          {/* Stats */}
          <div className="hidden sm:flex flex-col items-end text-right">
            <span className="text-white/60 text-sm">
              {formatDuration(item.track.duration)}
            </span>
            {item.track.validListenCount && (
              <span className="text-white/40 text-xs">
                {formatNumber(item.track.validListenCount)} plays
              </span>
            )}
            {activeTab === "trending" && item.rankChange > 0 && (
              <span className="text-green-400 text-xs font-medium">
                +{item.rankChange} positions
              </span>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-20">
          <LoadingOutlined className="text-4xl text-white/70 mb-4" spin />
          <p className="text-white/70 text-lg">Loading charts...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center py-20">
          <TrophyOutlined className="text-4xl text-white/30 mb-4" />
          <h3 className="text-white/70 text-xl mb-2">Failed to load charts</h3>
          <p className="text-white/50 text-center max-w-md mb-4">{error}</p>
          <button
            onClick={refetch}
            className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors duration-200"
          >
            Try again
          </button>
        </div>
      );
    }

    if (!chartData || chartData.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-20">
          <TrophyOutlined className="text-4xl text-white/30 mb-4" />
          <h3 className="text-white/70 text-xl mb-2">
            No chart data available
          </h3>
          <p className="text-white/50 text-center max-w-md mb-6">
            Charts are updated regularly. Create test data to get started.
          </p>
          <div className="flex gap-3">
            <button
              onClick={createTestData}
              className="px-6 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors duration-200"
            >
              🎵 Create Test Data
            </button>
            <button
              onClick={triggerChartGeneration}
              className="px-6 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 rounded-lg transition-colors duration-200"
            >
              🔄 Generate Charts
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-1">
        {chartData.map((item, index) => renderChartItem(item, index))}
      </div>
    );
  };

  return (
    <motion.main
      className="w-full min-h-screen pl-4 pr-4 sm:pl-8 sm:pr-8 xl:pl-[22vw] xl:pr-[2vw] flex flex-col gap-6 mb-45 xl:mb-6 py-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header */}
      <motion.div
        className="flex items-center gap-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <motion.button
          onClick={() => navigate(-1)}
          className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-lg rounded-xl transition-all duration-200 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-white/20"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
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
      </motion.div>

      {/* Tabs */}
      <motion.div
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
            >
              {tab.icon}
              <div className="text-left">
                <div>{tab.label}</div>
                <div className="text-xs opacity-60">{tab.description}</div>
              </div>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Chart Info */}
      {metadata && !isLoading && (
        <motion.div
          className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-4 mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <div className="flex items-center justify-between text-sm flex-wrap gap-3">
            <div className="text-white/70">
              Last updated:{" "}
              {timeSinceUpdate ||
                (metadata
                  ? new Date(metadata.lastUpdated).toLocaleString()
                  : "Never")}
            </div>
            <div className="flex items-center gap-3">
              <div className="text-white/50">
                {metadata?.totalTracks || 0} tracks
              </div>
              <button
                onClick={createTestData}
                className="px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg text-xs transition-colors duration-200"
              >
                🎵 Create Test Data
              </button>
              <button
                onClick={triggerChartGeneration}
                className="px-3 py-1 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 rounded-lg text-xs transition-colors duration-200"
              >
                🔄 Generate Charts
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Content */}
      <motion.div
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
      </motion.div>
    </motion.main>
  );
};

export default Charts;
