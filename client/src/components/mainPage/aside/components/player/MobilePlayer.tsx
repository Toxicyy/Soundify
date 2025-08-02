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
  ShareAltOutlined,
  DownOutlined,
  LinkOutlined,
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
 * - Compact bottom bar with basic controls and animated progress
 * - Full-screen expanded view with all player controls
 * - Swipe and button dismiss functionality
 * - Purple gradient theme with glassmorphism effects
 * - Responsive design for mobile and tablet devices
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
  const [isLinked, setIsLinked] = useState(false);
  const [isShare, setIsShare] = useState(false);
  
  // Audio element reference for time synchronization
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

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
      const audioElement = document.querySelector('audio');
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
  const handleTogglePlayPause = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (isLoading) return;
    dispatch(setIsPlaying(!currentTrack.isPlaying));
  }, [dispatch, currentTrack.isPlaying, isLoading]);

  const handleNext = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    dispatch(playNextTrack());
  }, [dispatch]);

  const handlePrevious = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    dispatch(playPreviousTrack());
  }, [dispatch]);

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
  const handleDragEnd = useCallback((_event: any, info: PanInfo) => {
    if (info.offset.y > 100) {
      handleCollapse();
    }
  }, [handleCollapse]);

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
      <div className="fixed bottom-[80px] left-0 right-0 xl:hidden bg-gradient-to-r from-slate-900/80 via-purple-900/60 to-slate-900/80 backdrop-blur-md border-t border-purple-500/20 p-3 z-40">
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
      {/* Compact Bottom Player - Always visible on mobile */}
      <motion.div
        className="fixed bottom-[80px] left-0 right-0 xl:hidden z-40"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        {/* Animated Progress Bar */}
        <div className="relative h-1 bg-gradient-to-r from-transparent via-purple-500/20 to-transparent">
          <motion.div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-400 via-pink-400 to-purple-600 shadow-lg shadow-purple-500/50"
            style={{
              width: `${progress}%`,
              background: progress > 0 
                ? "linear-gradient(90deg, #a855f7, #ec4899, #8b5cf6)" 
                : "transparent"
            }}
            transition={{ duration: 0.1 }}
          />
          {/* Glowing dot at progress end */}
          {progress > 0 && (
            <motion.div
              className="absolute top-1/2 w-3 h-3 -translate-y-1/2 bg-white rounded-full shadow-lg shadow-purple-500/50"
              style={{ left: `${progress}%`, marginLeft: "-6px" }}
              animate={{
                boxShadow: [
                  "0 0 8px rgba(168, 85, 247, 0.5)",
                  "0 0 12px rgba(168, 85, 247, 0.8)",
                  "0 0 8px rgba(168, 85, 247, 0.5)"
                ]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          )}
        </div>

        {/* Main Player Bar */}
        <div
          className="bg-gradient-to-r from-slate-900/95 via-purple-900/85 to-slate-900/95 backdrop-blur-xl border-t border-purple-500/30 p-3 cursor-pointer active:scale-[0.98] transition-transform duration-200"
          onClick={handleExpand}
        >
          <div className="flex items-center justify-between gap-3">
            {/* Track Info */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="relative">
                <img
                  src={currentTrackData.coverUrl}
                  alt="Album Cover"
                  className="w-12 h-12 rounded-xl object-cover shadow-lg"
                />
                {/* Subtle glow effect */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-purple-400/20 to-pink-400/20 pointer-events-none" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-medium truncate text-sm">
                  {currentTrackData.name}
                </h3>
                <p className="text-purple-200/70 text-xs truncate">
                  {currentTrackData.artist?.name || "Unknown Artist"}
                </p>
              </div>
            </div>

            {/* Compact Controls */}
            <div className="flex items-center gap-2">
              <motion.button
                onClick={handlePrevious}
                className="p-2 rounded-full hover:bg-white/10 transition-colors duration-200"
                whileTap={{ scale: 0.95 }}
              >
                <StepBackwardOutlined className="text-lg" style={{color: "rgba(255, 255, 255, 0.8)"}} />
              </motion.button>
              <motion.button
                onClick={handleTogglePlayPause}
                className="px-2.5 py-2 rounded-full bg-gradient-to-br from-purple-500/80 to-pink-500/80 hover:from-purple-500 hover:to-pink-500 shadow-lg backdrop-blur-sm transition-all duration-200"
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.05 }}
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : currentTrack.isPlaying ? (
                  <PauseOutlined className="text-lg" style={{color: "white"}} />
                ) : (
                  <CaretRightOutlined className=" text-lg ml-0.5" style={{color: "white"}} />
                )}
              </motion.button>

              <motion.button
                onClick={handleNext}
                className="p-2 rounded-full hover:bg-white/10 transition-colors duration-200"
                whileTap={{ scale: 0.95 }}
              >
                <StepForwardOutlined className="text-lg" style={{color: "rgba(255, 255, 255, 0.8)"}} />
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Expanded Full-Screen Player */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            className="fixed inset-0 xl:hidden z-50 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900"
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
            <div className="absolute inset-0 opacity-30">
              <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
              <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
            </div>

            {/* Content */}
            <div className="relative z-10 flex flex-col h-full p-6 pt-12">
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <motion.button
                  onClick={handleCollapse}
                  className="px-3.5 py-2.5 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 transition-colors duration-200"
                  whileTap={{ scale: 0.95 }}
                >
                  <DownOutlined className="text-lg" style={{color: "white"}} />
                </motion.button>

                <div className="text-center">
                  <p className="text-white/60 text-sm">Playing from</p>
                  <p className="text-white font-medium">Your Library</p>
                </div>

                <motion.button
                  className="px-4 py-3 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 transition-colors duration-200"
                  whileTap={{ scale: 0.95 }}
                >
                  <MenuUnfoldOutlined className="text-lg" style={{color: "white"}} onClick={toggleQueue} />
                </motion.button>
              </div>

              {/* Album Art */}
              <div className="flex-1 flex items-center justify-center mb-8">
                <motion.div
                  className="relative max-w-sm w-full aspect-square"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1, duration: 0.5 }}
                >
                  <img
                    src={currentTrackData.coverUrl}
                    alt="Album Cover"
                    className="w-full h-full rounded-3xl object-cover shadow-2xl"
                  />
                  {/* Glow effect */}
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-400/30 to-pink-400/30 shadow-2xl shadow-purple-500/25" />
                  
                  {/* Loading overlay */}
                  {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-3xl backdrop-blur-sm">
                      <div className="flex flex-col items-center gap-3">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-400 border-t-transparent" />
                        <p className="text-white/80 text-sm">Loading...</p>
                      </div>
                    </div>
                  )}
                </motion.div>
              </div>

              {/* Track Info */}
              <motion.div
                className="mb-6"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0 mr-4">
                    <h1 className="text-white text-2xl font-bold truncate mb-1">
                      {currentTrackData.name}
                    </h1>
                    <Link
                      to={`/artist/${currentTrackData.artist?._id}`}
                      className="text-purple-200/80 text-lg hover:text-purple-200 transition-colors"
                    >
                      {currentTrackData.artist?.name || "Unknown Artist"}
                    </Link>
                  </div>
                  
                  {/* Like Button */}
                  <motion.button
                    className="p-2"
                    whileTap={{ scale: 0.9 }}
                    onMouseEnter={() => setLikeHover(true)}
                    onMouseLeave={() => setLikeHover(false)}
                    onClick={toggleLike}
                    disabled={likePending}
                  >
                    {likePending ? (
                      <div className="w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                    ) : isLiked ? (
                      <HeartFilled 
                        className="text-2xl transition-colors duration-200"
                        style={{ color: likeHover ? "#F93822" : "#ef4444" }}
                      />
                    ) : (
                      <HeartOutlined 
                        className="text-2xl transition-colors duration-200"
                        style={{ color: likeHover ? "#D3D3D3" : "#fff" }}
                      />
                    )}
                  </motion.button>
                </div>
              </motion.div>

              {/* Progress Bar */}
              <motion.div
                className="mb-8"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                <div className="relative mb-2">
                  {/* Track background */}
                  <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                    {/* Buffer/background */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                    
                    {/* Progress */}
                    <motion.div
                      className="h-full bg-gradient-to-r from-purple-400 via-pink-400 to-purple-600 rounded-full relative overflow-hidden"
                      style={{ width: `${progress}%` }}
                      transition={{ duration: 0.1 }}
                    >
                      {/* Animated shimmer effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
                    </motion.div>
                  </div>

                  {/* Seek input */}
                  <input
                    type="range"
                    min={0}
                    max={currentTrackData.duration || 0}
                    value={currentTime}
                    onChange={handleSeek}
                    className="absolute inset-0 w-full h-2 opacity-0 cursor-pointer"
                  />
                </div>

                {/* Time labels */}
                <div className="flex justify-between text-sm text-white/60">
                  <span>{currentStr}</span>
                  <span>{totalStr}</span>
                </div>
              </motion.div>

              {/* Main Controls */}
              <motion.div
                className="flex items-center justify-between mb-6"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                {/* Shuffle */}
                <motion.button
                  onClick={handleShuffle}
                  className="p-3 rounded-full hover:bg-white/10 transition-colors duration-200"
                  whileTap={{ scale: 0.95 }}
                >
                  <SwapOutlined 
                    className="text-2xl"
                    style={{ color: queueState.shuffle ? "#a855f7" : "rgba(255, 255, 255, 0.4)" }}
                  />
                </motion.button>

                {/* Previous */}
                <motion.button
                  onClick={handlePrevious}
                  className="p-4 rounded-full hover:bg-white/10 transition-colors duration-200"
                  whileTap={{ scale: 0.95 }}
                >
                  <StepBackwardOutlined className="text-3xl" style={{color: "rgba(255, 255, 255, 0.8)"}} />
                </motion.button>

                {/* Play/Pause */}
                <motion.button
                  onClick={handleTogglePlayPause}
                  className="p-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-2xl shadow-purple-500/40"
                  whileTap={{ scale: 0.95 }}
                  whileHover={{ scale: 1.05 }}
                >
                  {isLoading ? (
                    <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin" />
                  ) : currentTrack.isPlaying ? (
                    <PauseOutlined className="text-4xl" style={{color: "white"}} />
                  ) : (
                    <CaretRightOutlined className="text-4xl ml-1" style={{color: "white"}} />
                  )}
                </motion.button>

                {/* Next */}
                <motion.button
                  onClick={handleNext}
                  className="p-4 rounded-full hover:bg-white/10 transition-colors duration-200"
                  whileTap={{ scale: 0.95 }}
                >
                  <StepForwardOutlined className="text-3xl" style={{color: "rgba(255, 255, 255, 0.8)"}} />
                </motion.button>

                {/* Repeat */}
                <motion.button
                  onClick={handleRepeat}
                  className="p-3 rounded-full hover:bg-white/10 transition-colors duration-200 relative"
                  whileTap={{ scale: 0.95 }}
                >
                  <RetweetOutlined 
                    className="text-2xl"
                    style={{ color: getRepeatColor() }}
                  />
                  {queueState.repeat === "one" && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs text-white font-bold">1</span>
                    </div>
                  )}
                </motion.button>
              </motion.div>

              {/* Additional Controls */}
              <motion.div
                className="flex items-center justify-between"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
              >
                <motion.button
                  onClick={() => setIsLinked(!isLinked)}
                  className="p-3 rounded-full hover:bg-white/10 transition-colors duration-200"
                  whileTap={{ scale: 0.95 }}
                >
                  <LinkOutlined 
                    className="text-xl"
                    style={{ color: isLinked ? "#a855f7" : "rgba(255, 255, 255, 0.4)" }}
                  />
                </motion.button>

                <motion.button
                  onClick={toggleQueue}
                  className="p-3 rounded-full hover:bg-white/10 transition-colors duration-200"
                  whileTap={{ scale: 0.95 }}
                >
                  <MenuUnfoldOutlined 
                    className="text-xl"
                    style={{ color: queueState.isOpen ? "#a855f7" : "rgba(255, 255, 255, 0.4)" }}
                  />
                </motion.button>

                <motion.button
                  onClick={() => setIsShare(!isShare)}
                  className="p-3 rounded-full hover:bg-white/10 transition-colors duration-200"
                  whileTap={{ scale: 0.95 }}
                >
                  <ShareAltOutlined 
                    className="text-xl"
                    style={{ color: isShare ? "#a855f7" : "rgba(255, 255, 255, 0.4)" }}
                  />
                </motion.button>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};