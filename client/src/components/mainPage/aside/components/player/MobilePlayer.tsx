import {
  CaretRightOutlined,
  PauseOutlined,
  StepBackwardOutlined,
  StepForwardOutlined,
  HeartFilled,
  HeartOutlined,
  RetweetOutlined,
  SwapOutlined,
  MenuUnfoldOutlined,
  DownOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, AppState } from "../../../../../store";
import { setIsPlaying } from "../../../../../state/CurrentTrack.slice";
import {
  playNextTrack,
  playPreviousTrack,
  setQueueOpen,
  toggleRepeat,
  toggleShuffle,
} from "../../../../../state/Queue.slice";
import { useCallback, useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, type PanInfo } from "framer-motion";
import { useFormatTime } from "../../../../../hooks/useFormatTime";
import { useLike } from "../../../../../hooks/useLike";
import { Link } from "react-router-dom";

/**
 * Mobile player component with compact and expanded views
 * Features:
 * - Adaptive layout for different screen heights
 * - Compact bottom bar positioned above mobile navigation
 * - Full-screen expanded view optimized for small devices
 * - Swipe and button dismiss functionality
 * - Modern design with glassmorphism effects
 * - Responsive for mobile phones and tablets
 */
export const MobilePlayer = () => {
  const dispatch = useDispatch<AppDispatch>();
  const currentTrack = useSelector((state: AppState) => state.currentTrack);
  const queueState = useSelector((state: AppState) => state.queue);

  // Component state
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, _setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [likeHover, setLikeHover] = useState(false);
  const [screenHeight, setScreenHeight] = useState(window.innerHeight);

  // Audio element reference for time synchronization
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  // Screen height tracking for adaptive layout
  useEffect(() => {
    const handleResize = () => setScreenHeight(window.innerHeight);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Mobile navigation height is approximately 80px (py-2 + pb-4 + icon + text)
  const MOBILE_NAV_HEIGHT = 80;
  const availableHeight = screenHeight - MOBILE_NAV_HEIGHT;

  // Determine screen size categories based on available height
  const isVerySmallScreen = availableHeight < 520; // iPhone SE, small phones
  const isSmallScreen = availableHeight < 620; // Standard phones
  const isMediumScreen = availableHeight < 720; // Large phones, small tablets

  // Like functionality
  const currentTrackId = currentTrack.currentTrack?._id || "";
  const {
    isLiked,
    isPending: likePending,
    toggleLike,
  } = useLike(currentTrackId);

  // Format time utilities
  const currentStr = useFormatTime(currentTime);
  const totalStr = useFormatTime(currentTrack.currentTrack?.duration || 0);

  // Find and sync with main audio element
  useEffect(() => {
    const findAudioElement = () => {
      const audioElement = document.querySelector("audio");
      if (audioElement) {
        audioElementRef.current = audioElement;
      }
    };

    findAudioElement();

    const interval = setInterval(() => {
      if (!audioElementRef.current) {
        findAudioElement();
      } else {
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  // Sync current time with main audio player
  useEffect(() => {
    if (!currentTrack.isPlaying || !audioElementRef.current) return;

    const interval = setInterval(() => {
      if (audioElementRef.current && !audioElementRef.current.paused) {
        setCurrentTime(audioElementRef.current.currentTime);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [currentTrack.isPlaying]);

  // Reset time on track change
  useEffect(() => {
    setCurrentTime(0);
  }, [currentTrack.currentTrack?._id]);

  // Control handlers
  const handleTogglePlayPause = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      if (isLoading) return;
      dispatch(setIsPlaying(!currentTrack.isPlaying));
    },
    [dispatch, currentTrack.isPlaying, isLoading]
  );

  const handleNext = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      dispatch(playNextTrack());
    },
    [dispatch]
  );

  const handlePrevious = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      dispatch(playPreviousTrack());
    },
    [dispatch]
  );

  const handleShuffle = useCallback(() => {
    dispatch(toggleShuffle());
  }, [dispatch]);

  const handleRepeat = useCallback(() => {
    dispatch(toggleRepeat());
  }, [dispatch]);

  const toggleQueue = useCallback(() => {
    dispatch(setQueueOpen(!queueState.isOpen));
  }, [queueState.isOpen, dispatch]);

  // Expand/collapse handlers
  const handleExpand = useCallback(() => {
    if (currentTrack.currentTrack) {
      setIsExpanded(true);
    }
  }, [currentTrack.currentTrack]);

  const handleCollapse = useCallback(() => {
    setIsExpanded(false);
  }, []);

  // Swipe to dismiss functionality
  const handleDragEnd = useCallback(
    (_event: any, info: PanInfo) => {
      if (info.offset.y > 100) {
        handleCollapse();
      }
    },
    [handleCollapse]
  );

  // Progress bar seek handler
  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = Number(e.target.value);
    setCurrentTime(newTime);
    if (audioElementRef.current) {
      audioElementRef.current.currentTime = newTime;
    }
  }, []);

  // Get repeat icon color
  const getRepeatColor = useCallback(() => {
    switch (queueState.repeat) {
      case "one":
      case "all":
        return "#a855f7";
      default:
        return "rgba(255, 255, 255, 0.4)";
    }
  }, [queueState.repeat]);

  // No track state
  if (!currentTrack.currentTrack) {
    return (
      <div
        className={`fixed left-0 right-0 xl:hidden bg-gradient-to-r from-slate-900/80 via-purple-900/60 to-slate-900/80 backdrop-blur-md border-t border-purple-500/20 p-3 z-40`}
        style={{ bottom: `${MOBILE_NAV_HEIGHT}px` }}
      >
        <div className="flex items-center justify-center">
          <p className="text-white/60 text-sm">No track selected</p>
        </div>
      </div>
    );
  }

  const currentTrackData = currentTrack.currentTrack;
  const progress = currentTrackData.duration
    ? (currentTime / currentTrackData.duration) * 100
    : 0;

  return (
    <>
      {/* Compact Bottom Player - Positioned above mobile navigation */}
      <motion.div
        className="fixed left-0 right-0 xl:hidden z-40"
        style={{ bottom: `${MOBILE_NAV_HEIGHT}px` }}
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        {/* Animated Progress Bar */}
        <div className="relative h-0.5 bg-gradient-to-r from-transparent via-purple-500/20 to-transparent">
          <motion.div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-400 via-pink-400 to-purple-600 shadow-sm shadow-purple-500/30"
            style={{
              width: `${progress}%`,
              background:
                progress > 0
                  ? "linear-gradient(90deg, #a855f7, #ec4899, #8b5cf6)"
                  : "transparent",
            }}
            transition={{ duration: 0.1 }}
          />
        </div>

        {/* Main Player Bar */}
        <div
          className="bg-gradient-to-r from-slate-900/98 via-purple-900/95 to-slate-900/98 backdrop-blur-xl border-t border-purple-500/20 p-2.5 cursor-pointer active:scale-[0.98] transition-transform duration-150"
          onClick={handleExpand}
        >
          <div className="flex items-center justify-between gap-2.5">
            {/* Track Info */}
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <div className="relative">
                <img
                  src={currentTrackData.coverUrl}
                  alt="Album Cover"
                  className="w-10 h-10 rounded-lg object-cover shadow-md"
                />
                <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-purple-400/15 to-pink-400/15 pointer-events-none" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-medium truncate text-sm leading-tight">
                  {currentTrackData.name}
                </h3>
                <p className="text-purple-200/60 text-xs truncate">
                  {currentTrackData.artist?.name || "Unknown Artist"}
                </p>
              </div>
            </div>

            {/* Compact Controls */}
            <div className="flex items-center gap-1">
              <motion.button
                onClick={handlePrevious}
                className="p-1.5 rounded-full hover:bg-white/10 transition-colors duration-150"
                whileTap={{ scale: 0.9 }}
              >
                <StepBackwardOutlined
                  className="text-base"
                  style={{ color: "rgba(255, 255, 255, 0.7)" }}
                />
              </motion.button>

              <motion.button
                onClick={handleTogglePlayPause}
                className="p-2 px-3 rounded-full bg-gradient-to-br from-purple-500/90 to-pink-500/90 hover:from-purple-500 hover:to-pink-500 shadow-md backdrop-blur-sm transition-all duration-150"
                whileTap={{ scale: 0.9 }}
                whileHover={{ scale: 1.02 }}
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : currentTrack.isPlaying ? (
                  <PauseOutlined
                    className="text-base"
                    style={{ color: "white" }}
                  />
                ) : (
                  <CaretRightOutlined
                    className="text-base ml-0.5"
                    style={{ color: "white" }}
                  />
                )}
              </motion.button>

              <motion.button
                onClick={handleNext}
                className="p-1.5 rounded-full hover:bg-white/10 transition-colors duration-150"
                whileTap={{ scale: 0.9 }}
              >
                <StepForwardOutlined
                  className="text-base"
                  style={{ color: "rgba(255, 255, 255, 0.7)" }}
                />
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Expanded Full-Screen Player */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            className="fixed inset-0 xl:hidden z-50 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.2 }}
            onDragEnd={handleDragEnd}
          >
            {/* Background Effects */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-500/30 rounded-full blur-3xl" />
              <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-pink-500/30 rounded-full blur-3xl" />
            </div>

            {/* Drag Indicator */}
            <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-10 h-1 bg-white/30 rounded-full" />

            {/* Scrollable Content Container */}
            <div className="h-full overflow-hidden">
              <div
                className="flex flex-col min-h-full justify-between"
                style={{
                  padding: isVerySmallScreen
                    ? "8px 16px 16px"
                    : isSmallScreen
                    ? "12px 20px 20px"
                    : "16px 24px 24px",
                  paddingTop: isVerySmallScreen
                    ? "24px"
                    : isSmallScreen
                    ? "32px"
                    : "40px",
                }}
              >
                {/* Header */}
                <div
                  className={`flex items-center mt-2 justify-between ${
                    isVerySmallScreen ? "mb-1" : isSmallScreen ? "mb-4" : "mb-6"
                  }`}
                >
                  <motion.button
                    onClick={handleCollapse}
                    className="p-2 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 transition-colors duration-150"
                    whileTap={{ scale: 0.9 }}
                  >
                    <DownOutlined
                      className="text-lg"
                      style={{ color: "white" }}
                    />
                  </motion.button>

                  <div className="text-center">
                    <p className="text-white/50 text-xs">Playing from</p>
                    <p className="text-white font-medium text-sm">
                      Your Library
                    </p>
                  </div>

                  <motion.button
                    onClick={toggleQueue}
                    className="p-2 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 transition-colors duration-150"
                    whileTap={{ scale: 0.9 }}
                  >
                    <MenuUnfoldOutlined
                      className="text-lg"
                      style={{ color: "white" }}
                    />
                  </motion.button>
                </div>

                {/* Album Art Container - Flexible but with max constraints */}
                <div className="flex-1 flex items-center justify-center">
                  <motion.div
                    className="relative w-full aspect-square"
                    style={{
                      maxWidth: isVerySmallScreen
                        ? "240px"
                        : isSmallScreen
                        ? "260px"
                        : isMediumScreen
                        ? "320px"
                        : "360px",
                      maxHeight: isVerySmallScreen
                        ? "240px"
                        : isSmallScreen
                        ? "260px"
                        : isMediumScreen
                        ? "320px"
                        : "360px",
                    }}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1, duration: 0.4 }}
                  >
                    <img
                      src={currentTrackData.coverUrl}
                      alt="Album Cover"
                      className="w-full h-full rounded-2xl object-cover shadow-2xl"
                    />
                    {/* Modern glow effect */}
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-400/20 to-pink-400/20 shadow-xl shadow-purple-500/15" />

                    {/* Loading overlay */}
                    {isLoading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-2xl backdrop-blur-sm">
                        <div className="flex flex-col items-center gap-2">
                          <div className="animate-spin rounded-full h-8 w-8 border-3 border-purple-400 border-t-transparent" />
                          <p className="text-white/80 text-xs">Loading...</p>
                        </div>
                      </div>
                    )}
                  </motion.div>
                </div>

                {/* Bottom Section - Track Info + Controls */}
                <div className="flex-shrink-0 space-y-4">
                  {/* Track Info */}
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.4 }}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex-1 min-w-0 mr-3">
                        <h1
                          className={`text-white font-bold truncate mb-1 ${
                            isVerySmallScreen
                              ? "text-lg"
                              : isSmallScreen
                              ? "text-xl"
                              : "text-2xl"
                          }`}
                        >
                          {currentTrackData.name}
                        </h1>
                        <Link
                          to={`/artist/${currentTrackData.artist?._id}`}
                          className={`text-purple-200/70 hover:text-purple-200 transition-colors ${
                            isVerySmallScreen ? "text-sm" : "text-base"
                          }`}
                        >
                          {currentTrackData.artist?.name || "Unknown Artist"}
                        </Link>
                      </div>

                      {/* Like Button */}
                      <motion.button
                        className="p-1"
                        whileTap={{ scale: 0.9 }}
                        onMouseEnter={() => setLikeHover(true)}
                        onMouseLeave={() => setLikeHover(false)}
                        onClick={toggleLike}
                        disabled={likePending}
                      >
                        {likePending ? (
                          <div className="w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                        ) : isLiked ? (
                          <HeartFilled
                            className={`transition-colors duration-200 ${
                              isVerySmallScreen ? "text-lg" : "text-xl"
                            }`}
                            style={{ color: likeHover ? "#F93822" : "#ef4444" }}
                          />
                        ) : (
                          <HeartOutlined
                            className={`transition-colors duration-200 ${
                              isVerySmallScreen ? "text-lg" : "text-xl"
                            }`}
                            style={{ color: likeHover ? "#D3D3D3" : "#fff" }}
                          />
                        )}
                      </motion.button>
                    </div>
                  </motion.div>

                  {/* Progress Bar */}
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.4 }}
                  >
                    <div className="relative mb-2">
                      {/* Track background */}
                      <div
                        className={`w-full bg-white/20 rounded-full overflow-hidden ${
                          isVerySmallScreen ? "h-1.5" : "h-2"
                        }`}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                        {/* Progress */}
                        <motion.div
                          className="h-full bg-gradient-to-r from-purple-400 via-pink-400 to-purple-600 rounded-full relative overflow-hidden"
                          style={{ width: `${progress}%` }}
                          transition={{ duration: 0.1 }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                        </motion.div>
                      </div>

                      {/* Seek input */}
                      <input
                        type="range"
                        min={0}
                        max={currentTrackData.duration || 0}
                        value={currentTime}
                        onChange={handleSeek}
                        className={`absolute inset-0 w-full opacity-0 cursor-pointer ${
                          isVerySmallScreen ? "h-1.5" : "h-2"
                        }`}
                      />
                    </div>

                    {/* Time labels */}
                    <div
                      className={`flex justify-between text-white/50 ${
                        isVerySmallScreen ? "text-xs" : "text-sm"
                      }`}
                    >
                      <span>{currentStr}</span>
                      <span>{totalStr}</span>
                    </div>
                  </motion.div>

                  {/* Main Controls */}
                  <motion.div
                    className="flex items-center justify-between"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.4 }}
                  >
                    {/* Shuffle */}
                    <motion.button
                      onClick={handleShuffle}
                      className={`rounded-full z-100 hover:bg-white/10 transition-colors duration-150 ${
                        isVerySmallScreen ? "p-1.5" : "p-2"
                      }`}
                      whileTap={{ scale: 0.9 }}
                    >
                      <SwapOutlined
                        className={isVerySmallScreen ? "text-base" : "text-lg"}
                        style={{
                          color: queueState.shuffle
                            ? "#a855f7"
                            : "rgba(255, 255, 255, 0.4)",
                        }}
                      />
                    </motion.button>

                    {/* Previous */}
                    <motion.button
                      onClick={handlePrevious}
                      className={`rounded-full z-100 hover:bg-white/10 transition-colors duration-150 ${
                        isVerySmallScreen ? "p-2" : "p-2.5"
                      }`}
                      whileTap={{ scale: 0.9 }}
                    >
                      <StepBackwardOutlined
                        className={isVerySmallScreen ? "text-xl" : "text-2xl"}
                        style={{ color: "rgba(255, 255, 255, 0.8)" }}
                      />
                    </motion.button>

                    {/* Play/Pause - Smaller and adaptive */}
                    <motion.button
                      onClick={handleTogglePlayPause}
                      className={`rounded-full z-100 bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg shadow-purple-500/25 ${
                        isVerySmallScreen
                          ? "p-3"
                          : isSmallScreen
                          ? "p-3.5"
                          : "p-4"
                      }`}
                      whileTap={{ scale: 0.95 }}
                      whileHover={{ scale: 1.02 }}
                    >
                      {isLoading ? (
                        <div
                          className={`border-3 border-white border-t-transparent rounded-full animate-spin ${
                            isVerySmallScreen ? "w-5 h-5" : "w-6 h-6"
                          }`}
                        />
                      ) : currentTrack.isPlaying ? (
                        <PauseOutlined
                          className={isVerySmallScreen ? "text-xl" : "text-2xl"}
                          style={{ color: "white" }}
                        />
                      ) : (
                        <CaretRightOutlined
                          className={`ml-0.5 ${
                            isVerySmallScreen ? "text-xl" : "text-2xl"
                          }`}
                          style={{ color: "white" }}
                        />
                      )}
                    </motion.button>

                    {/* Next */}
                    <motion.button
                      onClick={handleNext}
                      className={`rounded-full z-100 hover:bg-white/10 transition-colors duration-150 ${
                        isVerySmallScreen ? "p-2" : "p-2.5"
                      }`}
                      whileTap={{ scale: 0.9 }}
                    >
                      <StepForwardOutlined
                        className={isVerySmallScreen ? "text-xl" : "text-2xl"}
                        style={{ color: "rgba(255, 255, 255, 0.8)" }}
                      />
                    </motion.button>

                    {/* Repeat */}
                    <motion.button
                      onClick={handleRepeat}
                      className={`rounded-full z-100 hover:bg-white/10 transition-colors duration-150 relative ${
                        isVerySmallScreen ? "p-1.5" : "p-2"
                      }`}
                      whileTap={{ scale: 0.9 }}
                    >
                      <RetweetOutlined
                        className={isVerySmallScreen ? "text-base" : "text-lg"}
                        style={{ color: getRepeatColor() }}
                      />
                      {queueState.repeat === "one" && (
                        <div className="absolute inset-0 flex items-center justify-center mt-[-4px]">
                          <span className="text-[8px] text-white/60 font-bold">
                            1
                          </span>
                        </div>
                      )}
                    </motion.button>
                  </motion.div>
                  {/* Safe area for mobile navigation */}
                  <div className="h-16" />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
