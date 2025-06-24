import {
  CaretRightOutlined,
  HeartFilled,
  HeartOutlined,
  LinkOutlined,
  MenuUnfoldOutlined,
  MutedOutlined,
  PauseOutlined,
  RetweetOutlined,
  ShareAltOutlined,
  SoundOutlined,
  StepBackwardOutlined,
  StepForwardOutlined,
  SwapOutlined,
} from "@ant-design/icons";
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import {
  handleTrackEnd,
  playNextTrack,
  playPreviousTrack,
  setQueueOpen,
  toggleRepeat,
  toggleShuffle,
  setCurrentTrackInQueue,
} from "../../../../../state/Queue.slice";
import type { AppDispatch, AppState } from "../../../../../store";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import { useFormatTime } from "../../../../../hooks/useFormatTime";
import { setIsPlaying } from "../../../../../state/CurrentTrack.slice";
import Hls from "hls.js";

/**
 * Main audio player component with HLS streaming support
 * Fixed version with proper track loading and request management
 */
export const Player = () => {
  // UI states
  const [liked, setLiked] = useState(false);
  const [likeHover, setLikeHover] = useState(false);
  const [isLinked, setIsLinked] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isShare, setIsShare] = useState(false);

  // Audio states
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [bufferProgress, setBufferProgress] = useState(0);

  // Redux state
  const dispatch = useDispatch<AppDispatch>();
  const currentTrack = useSelector((state: AppState) => state.currentTrack);
  const queueState = useSelector((state: AppState) => state.queue);
  const { isOpen: isQueueOpen, shuffle, repeat, queue } = queueState;

  // Refs
  const audioRef = useRef<HTMLAudioElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const loadedTrackIdRef = useRef<string | number | null>(null);
  const isInitializingRef = useRef(false);

  // Formatted time strings
  const currentStr = useFormatTime(currentTime);
  const totalStr = useFormatTime(currentTrack.currentTrack?.duration || 0);

  // Generate streaming URL for current track
  const streamUrl = useMemo(() => {
    if (!currentTrack.currentTrack) return null;

    const isHLS =
      currentTrack.currentTrack.audioUrl?.includes(".m3u8") ||
      currentTrack.currentTrack.audioUrl?.includes("playlist.m3u8");

    return {
      url: isHLS
        ? `http://localhost:5000/api/tracks/${currentTrack.currentTrack._id}/playlist.m3u8`
        : currentTrack.currentTrack.audioUrl,
      isHLS,
    };
  }, [currentTrack.currentTrack]);

  // Event handlers
  const togglePlayPause = useCallback(() => {
    if (!audioRef.current || isLoading) return;
    dispatch(setIsPlaying(!currentTrack.isPlaying));
  }, [dispatch, currentTrack.isPlaying, isLoading]);

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = Number(e.target.value);
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  }, []);

  const handleVolumeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newVolume = Number(e.target.value) / 100;
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
    },
    []
  );

  const toggleMute = useCallback(() => {
    setIsMuted(!isMuted);
  }, [isMuted]);

  const toggleQueue = useCallback(() => {
    dispatch(setQueueOpen(!isQueueOpen));
  }, [isQueueOpen, dispatch]);

  // Queue navigation handlers
  const handleNext = useCallback(() => {
    if (queue.length === 0 && audioRef.current) {
      // If no queue, just stop playback
      console.log("No queue, stopping playback");
      dispatch(setIsPlaying(false));
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
    } else {
      dispatch(playNextTrack());
    }
  }, [dispatch, queue.length]);

  const handlePrevious = useCallback(() => {
    if (queue.length === 0 && audioRef.current) {
      // If no queue, restart current track
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      if (currentTrack.isPlaying) {
        audioRef.current.play().catch(() => dispatch(setIsPlaying(false)));
      }
    } else if (audioRef.current && audioRef.current.currentTime > 3) {
      // If more than 3 seconds played, restart current track
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
    } else {
      dispatch(playPreviousTrack());
    }
  }, [dispatch, queue.length, currentTrack.isPlaying]);

  const handleShuffle = useCallback(() => {
    dispatch(toggleShuffle());
  }, [dispatch]);

  const handleRepeat = useCallback(() => {
    dispatch(toggleRepeat());
  }, [dispatch]);

  // Get repeat icon color based on current repeat mode
  const getRepeatColor = useCallback(() => {
    switch (repeat) {
      case "one":
      case "all":
        return "white";
      default:
        return "rgba(255, 255, 255, 0.3)";
    }
  }, [repeat]);

  // Cleanup function for HLS
  const cleanupHLS = useCallback(() => {
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
  }, []);

  // Initialize track loading
  const initializeTrack = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || !streamUrl || !currentTrack.currentTrack) return;

    const trackId = currentTrack.currentTrack._id;

    // Prevent multiple simultaneous initializations
    if (isInitializingRef.current) return;

    // Skip if same track is already loaded
    if (loadedTrackIdRef.current === trackId) {
      console.log("Track already loaded, managing playback state");
      // Just update play state if needed
      if (currentTrack.isPlaying && audio.paused) {
        console.log("Resuming playback for already loaded track");
        audio.play().catch(() => dispatch(setIsPlaying(false)));
      } else if (!currentTrack.isPlaying && !audio.paused) {
        console.log("Pausing already loaded track");
        audio.pause();
      }
      return;
    }

    console.log("Initializing new track:", trackId);
    isInitializingRef.current = true;
    setIsLoading(true);
    setCurrentTime(0);
    setBufferProgress(0);

    // Cleanup previous track
    cleanupHLS();
    audio.pause();
    audio.src = "";
    audio.load();

    try {
      if (streamUrl.isHLS) {
        // HLS track handling
        if (Hls.isSupported()) {
          const hls = new Hls({
            debug: false,
            enableWorker: true,
            lowLatencyMode: false,
            maxBufferLength: 30,
            maxMaxBufferLength: 60,
            maxBufferSize: 60 * 1000 * 1000,
            maxBufferHole: 0.5,
            // Reduce aggressive loading
            startLevel: -1,
            autoStartLoad: true,
            startPosition: -1,
            // Prevent excessive fragment loading
            maxLoadingDelay: 4,
          });

          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            console.log("HLS manifest parsed, track ready");
            setIsLoading(false);
            loadedTrackIdRef.current = trackId;

            // Auto-play if needed
            if (currentTrack.isPlaying) {
              console.log("Auto-playing HLS track");
              audio.play().catch(() => dispatch(setIsPlaying(false)));
            }
          });

          hls.on(Hls.Events.ERROR, (_, data) => {
            console.error("HLS error:", data);
            if (data.fatal) {
              switch (data.type) {
                case Hls.ErrorTypes.NETWORK_ERROR:
                  console.error("Network error");
                  hls.startLoad();
                  break;
                case Hls.ErrorTypes.MEDIA_ERROR:
                  console.error("Media error");
                  hls.recoverMediaError();
                  break;
                default:
                  cleanupHLS();
                  setIsLoading(false);
                  dispatch(setIsPlaying(false));
                  break;
              }
            }
          });

          hls.on(Hls.Events.FRAG_BUFFERED, () => {
            if (audio.buffered.length > 0) {
              const bufferedEnd = audio.buffered.end(audio.buffered.length - 1);
              const duration = audio.duration || 1;
              setBufferProgress((bufferedEnd / duration) * 100);
            }
          });

          hls.loadSource(streamUrl.url);
          hls.attachMedia(audio);
          hlsRef.current = hls;
        } else if (audio.canPlayType("application/vnd.apple.mpegurl")) {
          // Safari native HLS support
          audio.src = streamUrl.url;

          const handleCanPlay = () => {
            console.log("Safari HLS track ready");
            setIsLoading(false);
            loadedTrackIdRef.current = trackId;

            if (currentTrack.isPlaying) {
              console.log("Auto-playing Safari HLS track");
              audio.play().catch(() => dispatch(setIsPlaying(false)));
            }
          };

          audio.addEventListener("canplaythrough", handleCanPlay, {
            once: true,
          });
        }
      } else {
        // Regular MP3 track
        audio.src = streamUrl.url;

        const handleCanPlay = () => {
          console.log("Regular audio track ready");
          setIsLoading(false);
          loadedTrackIdRef.current = trackId;

          if (currentTrack.isPlaying) {
            console.log("Auto-playing regular track");
            audio.play().catch(() => dispatch(setIsPlaying(false)));
          }
        };

        audio.addEventListener("canplaythrough", handleCanPlay, { once: true });
      }
    } catch (error) {
      console.error("Track initialization error:", error);
      setIsLoading(false);
      dispatch(setIsPlaying(false));
    } finally {
      isInitializingRef.current = false;
    }
  }, [
    streamUrl,
    currentTrack.currentTrack,
    currentTrack.isPlaying,
    dispatch,
    cleanupHLS,
  ]);

  // Синхронизация currentTrack между слайсами
  useEffect(() => {
    // Автоматически обновляем currentTrack в queue при изменении currentTrack в currentTrack slice
    if (
      currentTrack.currentTrack &&
      currentTrack.currentTrack !== queueState.currentTrack
    ) {
      console.log(
        "Syncing currentTrack to queue:",
        currentTrack.currentTrack.name
      );
      dispatch(setCurrentTrackInQueue(currentTrack.currentTrack));
    }
  }, [currentTrack.currentTrack, queueState.currentTrack, dispatch]);

  // Main effect for track changes
  useEffect(() => {
    if (!currentTrack.currentTrack || !streamUrl) return;

    console.log("Track change detected:", currentTrack.currentTrack.name);
    initializeTrack();

    // Cleanup on unmount or track change
    return () => {
      isInitializingRef.current = false;
    };
  }, [currentTrack.currentTrack?._id]); // Only depend on track ID

  // Separate effect for play/pause control
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || isLoading) return;

    console.log(
      "Play state changed:",
      currentTrack.isPlaying,
      "Track loaded:",
      loadedTrackIdRef.current === currentTrack.currentTrack?._id
    );

    // Normal play/pause control
    if (loadedTrackIdRef.current === currentTrack.currentTrack?._id) {
      if (currentTrack.isPlaying) {
        if (audio.paused) {
          console.log("Starting playback");
          audio.play().catch((err) => {
            console.error("Play error:", err);
            dispatch(setIsPlaying(false));
          });
        }
      } else {
        if (!audio.paused) {
          console.log("Pausing playback");
          audio.pause();
        }
      }
    } else if (currentTrack.isPlaying && currentTrack.currentTrack) {
      // Track changed, need to initialize new track
      console.log("Track changed while playing, reinitializing");
      initializeTrack();
    }
  }, [
    currentTrack.isPlaying,
    currentTrack.currentTrack?._id,
    isLoading,
    dispatch,
    initializeTrack,
  ]);

  // Progress update effect
  useEffect(() => {
    if (!currentTrack.isPlaying || !audioRef.current) return;

    const interval = setInterval(() => {
      if (audioRef.current && !audioRef.current.paused) {
        setCurrentTime(audioRef.current.currentTime);

        // Update buffer progress for non-HLS tracks
        if (!streamUrl?.isHLS && audioRef.current.buffered.length > 0) {
          const bufferedEnd = audioRef.current.buffered.end(
            audioRef.current.buffered.length - 1
          );
          const duration = audioRef.current.duration || 1;
          setBufferProgress((bufferedEnd / duration) * 100);
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, [currentTrack.isPlaying, streamUrl?.isHLS]);

  // Audio event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      console.log("Track ended, current repeat mode:", repeat);

      // Important: Reset time immediately in UI
      setCurrentTime(0);

      // Reset audio element time to 0
      audio.currentTime = 0;

      // Dispatch Redux action for state management
      dispatch(handleTrackEnd());
    };

    const handleError = (e: Event) => {
      console.error("Audio error:", e);
      setIsLoading(false);
      dispatch(setIsPlaying(false));
    };

    const handleLoadStart = () => {
      console.log("Load start");
      setIsLoading(true);
    };

    const handleLoadedData = () => {
      console.log("Loaded data");
    };

    const handleCanPlay = () => {
      console.log("Can play");
    };

    const handleTimeUpdate = () => {
      if (audio.currentTime && !isNaN(audio.currentTime)) {
        setCurrentTime(audio.currentTime);
      }
    };

    const handleWaiting = () => {
      console.log("Waiting for data");
      setIsLoading(true);
    };

    const handlePlaying = () => {
      console.log("Playing event fired");
      setIsLoading(false);
    };

    // Добавляем все обработчики
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);
    audio.addEventListener("loadstart", handleLoadStart);
    audio.addEventListener("loadeddata", handleLoadedData);
    audio.addEventListener("canplay", handleCanPlay);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("waiting", handleWaiting);
    audio.addEventListener("playing", handlePlaying);

    return () => {
      // Убираем все обработчики
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
      audio.removeEventListener("loadstart", handleLoadStart);
      audio.removeEventListener("loadeddata", handleLoadedData);
      audio.removeEventListener("canplay", handleCanPlay);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("waiting", handleWaiting);
      audio.removeEventListener("playing", handlePlaying);
    };
  }, [dispatch, repeat]); // Добавил repeat в зависимости

  // Volume control effect
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupHLS();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
      loadedTrackIdRef.current = null;
    };
  }, [cleanupHLS]);

  // No track selected state
  if (!currentTrack.currentTrack) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 1000 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="flex flex-col items-center justify-center h-full text-center p-8"
      >
        <p className="text-white/60 text-lg mb-2">Choose a track to play</p>
        <p className="text-white/40 text-sm">
          Select a track from the playlist to begin
        </p>
      </motion.div>
    );
  }

  const track = currentTrack.currentTrack;

  return (
    <div className="flex flex-col">
      <audio ref={audioRef} preload="metadata" crossOrigin="anonymous" />

      {/* Album cover */}
      <motion.div
        initial={{ opacity: 0, marginRight: "1000px" }}
        animate={{ opacity: 1, marginRight: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="w-[13vw] h-[13vw] mb-7 self-center relative"
      >
        <img
          src={track.coverUrl}
          alt="Album Cover"
          className="rounded-2xl drop-shadow-[0_7px_7px_rgba(0,0,0,0.4)] w-full h-full object-cover"
        />
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 rounded-2xl">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-2" />
            <p className="text-white/80 text-xs">Loading...</p>
          </div>
        )}
      </motion.div>

      {/* Track information */}
      <motion.div
        initial={{ opacity: 0, y: 1000 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      >
        <div className="flex items-center justify-between">
          <h1 className="text-white/90 font-semibold tracking-wider self-start mb-1 truncate flex-1 mr-4">
            {track.name}
          </h1>
          {liked ? (
            <HeartFilled
              style={{
                color: likeHover ? "#F93822" : "red",
                fontSize: "1.1rem",
              }}
              className="pb-1 cursor-pointer transition-colors duration-200"
              onMouseEnter={() => setLikeHover(true)}
              onMouseLeave={() => setLikeHover(false)}
              onClick={() => setLiked(false)}
            />
          ) : (
            <HeartOutlined
              style={{
                color: likeHover ? "#D3D3D3" : "white",
                fontSize: "1.1rem",
              }}
              className="pb-1 cursor-pointer transition-colors duration-200"
              onMouseEnter={() => setLikeHover(true)}
              onMouseLeave={() => setLikeHover(false)}
              onClick={() => setLiked(true)}
            />
          )}
        </div>
        <h2 className="text-white/60 mb-2 truncate">
          {track.artist?.name || "Unknown Artist"}
        </h2>
      </motion.div>

      {/* Progress bar */}
      <motion.div
        initial={{ opacity: 0, y: 1000 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-xs mx-auto rounded-xl flex flex-col items-stretch"
      >
        <div className="flex flex-col w-full mb-2 relative">
          {/* Background track */}
          <div className="absolute left-0 top-[2px] -translate-y-1/2 w-full h-[3px] rounded-lg bg-white/40 pointer-events-none" />

          {/* Buffer progress */}
          <div
            className="absolute left-0 top-[2px] -translate-y-1/2 h-[3px] rounded-lg bg-white/20 pointer-events-none transition-all duration-300"
            style={{ width: `${bufferProgress}%` }}
          />

          {/* Play progress */}
          <div
            className="absolute left-0 top-[2px] -translate-y-1/2 h-[3px] rounded-lg bg-white pointer-events-none transition-all duration-100"
            style={{
              width: `${
                track.duration ? (currentTime / track.duration) * 100 : 0
              }%`,
            }}
          />

          <input
            type="range"
            min={0}
            max={track.duration || 0}
            value={currentTime}
            onChange={handleSeek}
            disabled={isLoading}
            className="w-full h-[3px] rounded-lg appearance-none bg-transparent z-10 relative accent-white cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white/90 [&::-webkit-slider-thumb]:shadow focus:outline-none"
          />
          <div className="flex justify-between mt-2 relative z-10">
            <span className="text-[15px] text-white/50 select-none">
              {currentStr}
            </span>
            <span className="text-[15px] text-white/50 select-none">
              {totalStr}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Main controls */}
      <motion.div
        initial={{ opacity: 0, y: 1000 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: "easeOut" }}
        className="flex items-center justify-between mb-2"
      >
        <div
          className="relative cursor-pointer hover:scale-110 transition-all duration-200"
          onClick={handleRepeat}
        >
          <RetweetOutlined
            style={{ color: getRepeatColor(), fontSize: "24px" }}
          />
          {repeat === "one" && (
            <div className="absolute inset-0 flex items-center justify-center mb-1">
              <span className="text-[8px] text-white font-bold">1</span>
            </div>
          )}
        </div>

        <StepBackwardOutlined
          style={{ color: "white", fontSize: "24px" }}
          className="cursor-pointer hover:scale-110 transition-all duration-200"
          onClick={handlePrevious}
        />

        <div
          className="glass rounded-full w-[50px] h-[50px] flex items-center justify-center cursor-pointer hover:scale-110 transition-all duration-200"
          onClick={togglePlayPause}
        >
          {isLoading ? (
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white" />
          ) : currentTrack.isPlaying ? (
            <PauseOutlined style={{ fontSize: "24px", color: "white" }} />
          ) : (
            <CaretRightOutlined
              style={{ fontSize: "26px", color: "white" }}
              className="ml-[4px]"
            />
          )}
        </div>

        <StepForwardOutlined
          style={{ color: "white", fontSize: "24px" }}
          className="cursor-pointer hover:scale-110 transition-all duration-200"
          onClick={handleNext}
        />

        <SwapOutlined
          style={{
            color: shuffle ? "white" : "rgba(255, 255, 255, 0.3)",
            fontSize: "24px",
          }}
          className="cursor-pointer hover:scale-110 transition-all duration-200"
          onClick={handleShuffle}
        />
      </motion.div>

      {/* Additional controls */}
      <motion.div
        initial={{ opacity: 0, y: 1000 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="flex items-center justify-between"
      >
        <LinkOutlined
          style={{
            fontSize: "24px",
            color: isLinked ? "white" : "rgba(255, 255, 255, 0.3)",
          }}
          className="cursor-pointer hover:scale-110 transition-all duration-200"
          onClick={() => setIsLinked(!isLinked)}
        />

        <div className="flex items-center gap-2">
          {isMuted ? (
            <MutedOutlined
              style={{ fontSize: "24px", color: "white" }}
              className="cursor-pointer hover:scale-110 transition-all duration-200"
              onClick={toggleMute}
            />
          ) : (
            <SoundOutlined
              style={{ fontSize: "24px", color: "rgba(255, 255, 255, 0.3)" }}
              className="cursor-pointer hover:scale-110 transition-all duration-200"
              onClick={toggleMute}
            />
          )}
          <input
            type="range"
            min={0}
            max={100}
            value={isMuted ? 0 : volume * 100}
            onChange={handleVolumeChange}
            className="w-16 h-1 bg-white/40 rounded-lg appearance-none cursor-pointer accent-white hidden sm:block"
          />
        </div>

        <MenuUnfoldOutlined
          style={{
            fontSize: "24px",
            color: isQueueOpen ? "white" : "rgba(255, 255, 255, 0.3)",
          }}
          className="cursor-pointer hover:scale-110 transition-all duration-200"
          onClick={toggleQueue}
        />

        <ShareAltOutlined
          style={{
            fontSize: "24px",
            color: isShare ? "white" : "rgba(255, 255, 255, 0.3)",
          }}
          className="cursor-pointer hover:scale-110 transition-all duration-200"
          onClick={() => setIsShare(!isShare)}
        />
      </motion.div>
    </div>
  );
};
