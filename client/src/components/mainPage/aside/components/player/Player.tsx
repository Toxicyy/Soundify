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
import { useEffect, useRef, useState, useCallback, useMemo, memo } from "react";
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
import { motion, AnimatePresence } from "framer-motion";
import { useFormatTime } from "../../../../../hooks/useFormatTime";
import { setIsPlaying } from "../../../../../state/CurrentTrack.slice";
import { initializeLikes } from "../../../../../state/LikeUpdate.slice";
import { useLike } from "../../../../../hooks/useLike";
import { useGetUserQuery } from "../../../../../state/UserApi.slice";
import { api } from "../../../../../shared/api";
import { useNotification } from "../../../../../hooks/useNotification";
import Hls from "hls.js";
import { Link } from "react-router-dom";
import { Modal } from "antd";

interface SkipData {
  count: number;
  hourTimestamp: number;
  lastUpdate: number;
}

const FREE_SKIP_LIMIT = 6;
const SKIP_SYNC_INTERVAL = 5 * 60 * 1000;
const HOUR_CHECK_INTERVAL = 60 * 1000;
const SEEK_THRESHOLD = 3;

const HLS_CONFIG = {
  debug: false,
  enableWorker: true,
  lowLatencyMode: false,
  maxBufferLength: 30,
  maxMaxBufferLength: 60,
  maxBufferSize: 60 * 1000 * 1000,
  maxBufferHole: 0.5,
  startLevel: -1,
  autoStartLoad: true,
  startPosition: -1,
  maxLoadingDelay: 4,
} as const;

/**
 * Main desktop audio player with HLS streaming and skip limit logic
 * Features premium/free user controls, like functionality, and queue management
 */
const Player = () => {
  const [likeHover, setLikeHover] = useState(false);
  const [isLinked, setIsLinked] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [skipCount, setSkipCount] = useState(0);
  const [skipBlocked, setSkipBlocked] = useState(false);
  const [_blockMessage, setBlockMessage] = useState("");
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [bufferProgress, setBufferProgress] = useState(0);

  const dispatch = useDispatch<AppDispatch>();
  const currentTrack = useSelector((state: AppState) => state.currentTrack);
  const queueState = useSelector((state: AppState) => state.queue);
  const { data: user, isFetching } = useGetUserQuery();

  const { showWarning, showError, showSuccess } = useNotification();
  const { isOpen: isQueueOpen, shuffle, repeat, queue } = queueState;

  const currentTrackId = currentTrack.currentTrack?._id || "";
  const {
    isLiked,
    isPending: likePending,
    toggleLike,
  } = useLike(currentTrackId);

  useEffect(() => {
    if (!isFetching && user?.likedSongs) {
      dispatch(initializeLikes(user.likedSongs));
    }
  }, [isFetching, user?.likedSongs, dispatch]);

  const audioRef = useRef<HTMLAudioElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const loadedTrackIdRef = useRef<string | number | null>(null);
  const isInitializingRef = useRef(false);
  const isStoppingAtEndRef = useRef(false);

  const currentStr = useFormatTime(currentTime);
  const totalStr = useFormatTime(currentTrack.currentTrack?.duration || 0);

  const canSeek = user?.status === "PREMIUM" || user?.status === "ADMIN";
  const canGoBack = user?.status === "PREMIUM" || user?.status === "ADMIN";
  const isPremium = user?.status === "PREMIUM" || user?.status === "ADMIN";

  const getCurrentHourTimestamp = useCallback(() => {
    const now = new Date();
    const hourStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      now.getHours(),
      0,
      0,
      0
    );
    return hourStart.getTime();
  }, []);

  const getSkipData = useCallback((): SkipData => {
    try {
      const data = localStorage.getItem("skipData");
      if (!data) {
        return {
          count: 0,
          hourTimestamp: getCurrentHourTimestamp(),
          lastUpdate: Date.now(),
        };
      }
      return JSON.parse(data);
    } catch (error) {
      return {
        count: 0,
        hourTimestamp: getCurrentHourTimestamp(),
        lastUpdate: Date.now(),
      };
    }
  }, [getCurrentHourTimestamp]);

  const saveSkipData = useCallback(
    (count: number) => {
      try {
        const data: SkipData = {
          count,
          hourTimestamp: getCurrentHourTimestamp(),
          lastUpdate: Date.now(),
        };
        localStorage.setItem("skipData", JSON.stringify(data));
        setSkipCount(count);
      } catch (error) {
        console.error("Failed to save skip data");
      }
    },
    [getCurrentHourTimestamp]
  );

  const showSkipLimitNotification = useCallback((remainingSkips: number) => {
    const { showCustom } = useNotification();

    return showCustom(
      <div className="max-w-md w-full bg-yellow-500/10 backdrop-blur-lg border border-yellow-500/30 shadow-lg rounded-xl pointer-events-auto flex ring-1 ring-yellow-500/20">
        <div className="flex-1 w-0 p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-500/20 rounded-full flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-yellow-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-semibold text-white">
                {remainingSkips > 0
                  ? `${remainingSkips} skips remaining`
                  : "Skip limit reached"}
              </p>
              <p className="mt-1 text-sm text-white/80">
                {remainingSkips > 0
                  ? `You have ${remainingSkips} skips left this hour`
                  : "You've reached your hourly limit of 6 skips"}
              </p>
              <p className="mt-1 text-xs text-white/60">
                Upgrade to Premium for unlimited skips, no ads, and more
                features
              </p>
            </div>
          </div>
        </div>
        <div className="flex border-l border-yellow-500/20">
          <button
            onClick={() => setShowUpgradeModal(true)}
            className="w-full border border-transparent rounded-none rounded-r-xl p-4 flex items-center justify-center text-sm font-medium text-yellow-400 hover:text-yellow-300 transition-colors"
          >
            Upgrade
          </button>
        </div>
      </div>,
      { duration: 6000 }
    );
  }, []);

  useEffect(() => {
    if (!isPremium) {
      const skipData = getSkipData();
      const currentHour = getCurrentHourTimestamp();

      if (skipData.hourTimestamp < currentHour) {
        setSkipCount(0);
        setSkipBlocked(false);
        saveSkipData(0);
      } else {
        setSkipCount(skipData.count);
        if (skipData.count >= FREE_SKIP_LIMIT) {
          setSkipBlocked(true);
          setBlockMessage(
            "Skip limit reached. Try again next hour or upgrade to Premium!"
          );
        }
      }
    } else {
      setSkipCount(0);
      setSkipBlocked(false);
    }
  }, [isPremium, getSkipData, getCurrentHourTimestamp, saveSkipData]);

  useEffect(() => {
    if (isPremium) return;

    const syncSkipData = async () => {
      try {
        const skipData = getSkipData();
        const response = await api.user.syncSkipData(skipData.count);

        if (response.ok) {
          const result = await response.json();

          if (result.data.blocked) {
            setSkipBlocked(true);
            setBlockMessage(result.data.message || "Skip limit exceeded");
            if (result.data.reason === "anti_cheat") {
              showError(
                "Suspicious activity detected. Skip function temporarily disabled."
              );
            } else {
              showWarning(result.data.message || "Skip limit exceeded");
            }
          } else if (result.data.success) {
            setSkipBlocked(false);
            if (result.data.remainingSkips !== undefined) {
              const serverCount = FREE_SKIP_LIMIT - result.data.remainingSkips;
              if (serverCount !== skipData.count) {
                saveSkipData(serverCount);
              }
            }
          }
        }
      } catch (error) {
        console.warn("Skip sync failed, continuing with offline mode");
      }
    };

    syncSkipData();
    const syncInterval = setInterval(syncSkipData, SKIP_SYNC_INTERVAL);

    return () => clearInterval(syncInterval);
  }, [isPremium, getSkipData, saveSkipData, showError, showWarning]);

  useEffect(() => {
    if (isPremium) return;

    const checkHourReset = () => {
      const skipData = getSkipData();
      const currentHour = getCurrentHourTimestamp();

      if (skipData.hourTimestamp < currentHour) {
        setSkipCount(0);
        setSkipBlocked(false);
        setBlockMessage("");
        saveSkipData(0);
      }
    };

    const resetInterval = setInterval(checkHourReset, HOUR_CHECK_INTERVAL);
    return () => clearInterval(resetInterval);
  }, [isPremium, getSkipData, getCurrentHourTimestamp, saveSkipData]);

  const streamUrl = useMemo(() => {
    if (!currentTrack.currentTrack) return null;

    const isHLS =
      currentTrack.currentTrack.audioUrl?.includes(".m3u8") ||
      currentTrack.currentTrack.audioUrl?.includes("playlist.m3u8");

    return {
      url: isHLS
        ? api.track.getPlaylistUrl(currentTrack.currentTrack._id)
        : currentTrack.currentTrack.audioUrl,
      isHLS,
    };
  }, [currentTrack.currentTrack]);

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

  const showUpgradePrompt = useCallback(() => {
    setShowUpgradeModal(true);
    const remainingSkips = Math.max(0, FREE_SKIP_LIMIT - skipCount);
    showSkipLimitNotification(remainingSkips);
  }, [showSkipLimitNotification, skipCount]);

  const handleNext = useCallback(() => {
    if (!isPremium) {
      if (skipBlocked) {
        showUpgradePrompt();
        return;
      }

      const skipData = getSkipData();

      if (skipData.count >= FREE_SKIP_LIMIT) {
        setSkipBlocked(true);
        setBlockMessage(
          `Skip limit reached (${FREE_SKIP_LIMIT}/hour). Upgrade to Premium for unlimited skips!`
        );
        showUpgradePrompt();
        return;
      }

      const newCount = skipData.count + 1;
      saveSkipData(newCount);

      if (newCount >= FREE_SKIP_LIMIT) {
        setSkipBlocked(true);
        setBlockMessage(
          `Skip limit reached (${FREE_SKIP_LIMIT}/hour). Upgrade to Premium for unlimited skips!`
        );
        showSkipLimitNotification(0);
      } else if (newCount >= 4) {
        const remaining = FREE_SKIP_LIMIT - newCount;
        showSkipLimitNotification(remaining);
      }
    }

    if (queue.length === 0 && audioRef.current) {
      if (repeat === "one" || repeat === "all") {
        audioRef.current.currentTime = 0;
        setCurrentTime(0);
        dispatch(setIsPlaying(true));
      } else {
        isStoppingAtEndRef.current = true;
        dispatch(setIsPlaying(false));
        audioRef.current.pause();

        setTimeout(() => {
          if (audioRef.current && !currentTrack.isPlaying) {
            audioRef.current.currentTime = 0;
            setCurrentTime(0);
          }
          isStoppingAtEndRef.current = false;
        }, 200);
      }
    } else {
      dispatch(playNextTrack());
    }
  }, [
    isPremium,
    skipBlocked,
    getSkipData,
    saveSkipData,
    showUpgradePrompt,
    dispatch,
    queue.length,
    repeat,
    currentTrack.isPlaying,
    showSkipLimitNotification,
  ]);

  const handleShareClick = useCallback(async () => {
    try {
      if (!currentTrack.currentTrack) return;
      const url = `${window.location.origin}/track/${currentTrack.currentTrack._id}`;

      if (navigator.share && /Mobi|Android/i.test(navigator.userAgent)) {
        const artistName =
          typeof currentTrack.currentTrack.artist === "string"
            ? currentTrack.currentTrack.artist
            : currentTrack.currentTrack.artist?.name;

        await navigator.share({
          title: `${currentTrack.currentTrack.name} - ${artistName}`,
          text: `Listen to "${currentTrack.currentTrack.name}" by ${artistName} on Soundify`,
          url: url,
        });

        showSuccess("Track shared successfully!");
      } else {
        await navigator.clipboard.writeText(url);
        showSuccess("Track link copied to clipboard!");
      }
    } catch (error) {
      if (error === "AbortError") {
        return;
      }

      try {
        if (!currentTrack.currentTrack) return;
        const url = `${window.location.origin}/track/${currentTrack.currentTrack._id}`;
        await navigator.clipboard.writeText(url);
        showSuccess("Track link copied to clipboard!");
      } catch (clipboardError) {
        showError("Failed to share track. Please copy the URL manually.");
      }
    }
  }, [currentTrack.currentTrack, showSuccess, showError]);

  const handlePrevious = useCallback(() => {
    if (audioRef.current && audioRef.current.currentTime > SEEK_THRESHOLD) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
    } else {
      dispatch(playPreviousTrack());
    }
  }, [dispatch]);

  const handleShuffle = useCallback(() => {
    dispatch(toggleShuffle());
  }, [dispatch]);

  const handleRepeat = useCallback(() => {
    dispatch(toggleRepeat());
  }, [dispatch]);

  const getRepeatColor = useCallback(() => {
    switch (repeat) {
      case "one":
      case "all":
        return "white";
      default:
        return "rgba(255, 255, 255, 0.3)";
    }
  }, [repeat]);

  const cleanupHLS = useCallback(() => {
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
  }, []);

  const initializeTrack = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || !streamUrl || !currentTrack.currentTrack) return;

    const trackId = currentTrack.currentTrack._id;

    if (isInitializingRef.current) {
      return;
    }

    if (loadedTrackIdRef.current === trackId) {
      if (currentTrack.isPlaying && audio.paused) {
        audio.play().catch(() => dispatch(setIsPlaying(false)));
      } else if (!currentTrack.isPlaying && !audio.paused) {
        audio.pause();
      }
      return;
    }

    isInitializingRef.current = true;
    setIsLoading(true);
    setCurrentTime(0);
    setBufferProgress(0);

    cleanupHLS();
    audio.pause();
    audio.src = "";
    audio.load();

    try {
      if (streamUrl.isHLS) {
        if (Hls.isSupported()) {
          const hls = new Hls(HLS_CONFIG);

          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            setIsLoading(false);
            loadedTrackIdRef.current = trackId;

            if (currentTrack.isPlaying) {
              audio.play().catch(() => dispatch(setIsPlaying(false)));
            }
          });

          hls.on(Hls.Events.ERROR, (_, data) => {
            if (data.fatal) {
              switch (data.type) {
                case Hls.ErrorTypes.NETWORK_ERROR:
                  hls.startLoad();
                  break;
                case Hls.ErrorTypes.MEDIA_ERROR:
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
          audio.src = streamUrl.url;

          const handleCanPlay = () => {
            setIsLoading(false);
            loadedTrackIdRef.current = trackId;

            if (currentTrack.isPlaying) {
              audio.play().catch(() => dispatch(setIsPlaying(false)));
            }
          };

          audio.addEventListener("canplaythrough", handleCanPlay, {
            once: true,
          });
        }
      } else {
        audio.src = streamUrl.url;

        const handleCanPlay = () => {
          setIsLoading(false);
          loadedTrackIdRef.current = trackId;

          if (currentTrack.isPlaying) {
            audio.play().catch(() => dispatch(setIsPlaying(false)));
          }
        };

        audio.addEventListener("canplaythrough", handleCanPlay, { once: true });
      }
    } catch (error) {
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

  useEffect(() => {
    if (
      currentTrack.currentTrack &&
      currentTrack.currentTrack !== queueState.currentTrack
    ) {
      dispatch(setCurrentTrackInQueue(currentTrack.currentTrack));
    }
  }, [currentTrack.currentTrack, queueState.currentTrack, dispatch]);

  useEffect(() => {
    if (!currentTrack.currentTrack || !streamUrl) {
      return;
    }

    if (isStoppingAtEndRef.current) {
      return;
    }

    const trackId = currentTrack.currentTrack._id;
    if (loadedTrackIdRef.current === trackId && !currentTrack.isPlaying) {
      return;
    }

    initializeTrack();

    return () => {
      isInitializingRef.current = false;
    };
  }, [currentTrack.currentTrack?._id, initializeTrack, streamUrl]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isLoading || isInitializingRef.current) {
      return;
    }

    const currentTrackId = currentTrack.currentTrack?._id;
    const isTrackLoaded = loadedTrackIdRef.current === currentTrackId;

    if (isTrackLoaded && currentTrackId) {
      if (currentTrack.isPlaying && audio.paused) {
        audio.play().catch(() => {
          dispatch(setIsPlaying(false));
        });
      } else if (!currentTrack.isPlaying && !audio.paused) {
        audio.pause();
      }
    }
  }, [
    currentTrack.isPlaying,
    currentTrack.currentTrack?._id,
    isLoading,
    dispatch,
  ]);

  useEffect(() => {
    if (!currentTrack.isPlaying || !audioRef.current) return;

    const interval = setInterval(() => {
      if (audioRef.current && !audioRef.current.paused) {
        setCurrentTime(audioRef.current.currentTime);

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

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      setCurrentTime(0);
      audio.currentTime = 0;

      if (repeat === "off" && queue.length === 0) {
        isStoppingAtEndRef.current = true;
        setTimeout(() => {
          isStoppingAtEndRef.current = false;
        }, 100);
      }

      dispatch(handleTrackEnd());
    };

    const handleError = () => {
      setIsLoading(false);
      dispatch(setIsPlaying(false));
    };

    const handleLoadStart = () => {
      setIsLoading(true);
    };

    const handleTimeUpdate = () => {
      if (audio.currentTime && !isNaN(audio.currentTime)) {
        setCurrentTime(audio.currentTime);
      }
    };

    const handleWaiting = () => {
      if (!isStoppingAtEndRef.current && currentTrack.isPlaying) {
        setIsLoading(true);
      }
    };

    const handlePlaying = () => {
      setIsLoading(false);
    };

    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);
    audio.addEventListener("loadstart", handleLoadStart);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("waiting", handleWaiting);
    audio.addEventListener("playing", handlePlaying);

    return () => {
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
      audio.removeEventListener("loadstart", handleLoadStart);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("waiting", handleWaiting);
      audio.removeEventListener("playing", handlePlaying);
    };
  }, [dispatch, repeat, queue.length, currentTrack.isPlaying]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

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

  const currentTrackData = currentTrack.currentTrack;

  return (
    <div className="flex flex-col">
      <audio ref={audioRef} preload="metadata" crossOrigin="anonymous" />

      <AnimatePresence>
        <Modal
          open={showUpgradeModal}
          onCancel={() => setShowUpgradeModal(false)}
          footer={null}
          centered
          width={400}
          closable={false}
          styles={{
            mask: {
              backdropFilter: "blur(8px)",
              backgroundColor: "rgba(0, 0, 0, 0.6)",
            },
            content: {
              background: "rgba(0, 0, 0, 0.4)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "16px",
              padding: 0,
            },
          }}
        >
          <div className="p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z"
                  clipRule="evenodd"
                />
              </svg>
            </div>

            <h3 className="text-xl font-bold text-white mb-2">
              Upgrade to Premium
            </h3>
            <p className="text-white/80 mb-6 text-sm">
              You've reached your skip limit for this hour. Upgrade to Premium
              for unlimited skips, high quality audio, and ad-free experience!
            </p>

            <div className="mb-6 text-left">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                    <svg
                      className="w-3 h-3 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <span className="text-white/90 text-sm">
                    Unlimited track skips
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                    <svg
                      className="w-3 h-3 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <span className="text-white/90 text-sm">
                    Full track navigation
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                    <svg
                      className="w-3 h-3 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <span className="text-white/90 text-sm">
                    Up to 15 playlists
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                    <svg
                      className="w-3 h-3 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <span className="text-white/90 text-sm">
                    Priority support
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="flex-1 py-3 px-4 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors border border-white/20"
              >
                Maybe Later
              </button>
              <button
                onClick={() => {
                  setShowUpgradeModal(false);
                  window.location.href = "/upgrade-to-premium";
                }}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-lg text-white font-medium transition-all shadow-lg"
              >
                Upgrade Now
              </button>
            </div>
          </div>
        </Modal>
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, marginRight: "1000px" }}
        animate={{ opacity: 1, marginRight: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="w-[13vw] h-[13vw] mb-4 self-center relative"
      >
        <img
          src={currentTrackData.coverUrl}
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

      <motion.div
        initial={{ opacity: 0, y: 1000 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      >
        <div className="flex items-center justify-between">
          <h1 className="text-white/90 font-semibold tracking-wider self-start mb-1 truncate flex-1 mr-4">
            {currentTrackData.name}
          </h1>
          {likePending ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mb-1" />
          ) : isLiked ? (
            <HeartFilled
              style={{
                color: likeHover ? "#F93822" : "red",
                fontSize: "1.1rem",
              }}
              className="pb-1 cursor-pointer transition-colors duration-200"
              onMouseEnter={() => setLikeHover(true)}
              onMouseLeave={() => setLikeHover(false)}
              onClick={toggleLike}
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
              onClick={toggleLike}
            />
          )}
        </div>

        <h2 className="text-white/60 mb-2 truncate">
          <Link
            to={`/artist/${currentTrackData.artist?._id}`}
            className="hover:underline cursor-pointer"
          >
            {currentTrackData.artist?.name || "Unknown Artist"}
          </Link>
        </h2>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 1000 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-xs mx-auto rounded-xl flex flex-col items-stretch"
      >
        <div className="flex flex-col w-full relative">
          <div className="absolute left-0 top-[2px] -translate-y-1/2 w-full h-[3px] rounded-lg bg-white/40 pointer-events-none" />

          <div
            className="absolute left-0 top-[2px] -translate-y-1/2 h-[3px] rounded-lg bg-white/20 pointer-events-none transition-all duration-300"
            style={{ width: `${bufferProgress}%` }}
          />

          <div
            className="absolute left-0 top-[2px] -translate-y-1/2 h-[3px] rounded-lg bg-white pointer-events-none transition-all duration-100"
            style={{
              width: `${
                currentTrackData.duration
                  ? (currentTime / currentTrackData.duration) * 100
                  : 0
              }%`,
            }}
          />

          <input
            type="range"
            min={0}
            max={currentTrackData.duration || 0}
            value={currentTime}
            onChange={handleSeek}
            disabled={isLoading || !canSeek}
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
          style={{
            color: canGoBack ? "white" : "rgba(255, 255, 255, 0.3)",
            fontSize: "24px",
            cursor: canGoBack ? "pointer" : "not-allowed",
          }}
          className="hover:scale-110 transition-all duration-200"
          onClick={canGoBack ? handlePrevious : () => setShowUpgradeModal(true)}
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
          style={{
            color:
              !isPremium && skipBlocked ? "rgba(255, 255, 255, 0.3)" : "white",
            fontSize: "24px",
            cursor: !isPremium && skipBlocked ? "not-allowed" : "pointer",
          }}
          className="hover:scale-110 transition-all duration-200"
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
            color: "rgba(255, 255, 255, 0.3)",
          }}
          className="cursor-pointer hover:scale-110 transition-all duration-200"
          onClick={handleShareClick}
        />
      </motion.div>
    </div>
  );
};

export default memo(Player);
export { Player };
