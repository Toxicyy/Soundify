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
  playNextTrack,
  playPreviousTrack,
  setQueueOpen,
  toggleRepeat,
  toggleShuffle,
} from "../../../../../state/Queue.slice";
import type { AppDispatch, AppState } from "../../../../../store";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import { useFormatTime } from "../../../../../hooks/useFormatTime";
import { setIsPlaying } from "../../../../../state/CurrentTrack.slice";
import Hls from "hls.js";

type RepeatMode = "off" | "playlist" | "track";

export const Player = () => {
  // UI states
  const [liked, setLiked] = useState(false);
  const [likeHover, setLikeHover] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);
  const [isLinked, setIsLinked] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isQueue, setIsQueue] = useState(false);
  const [isShare, setIsShare] = useState(false);

  // Audio states
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>("off");
  const [hlsInstance, setHlsInstance] = useState<Hls | null>(null);
  const [bufferProgress, setBufferProgress] = useState(0);
  const [isTrackLoaded, setIsTrackLoaded] = useState(false);

  const dispatch = useDispatch<AppDispatch>();
  const currentTrack = useSelector((state: AppState) => state.currentTrack);
  const audioRef = useRef<HTMLAudioElement>(null);
  const lastTrackId = useRef<string | number | null>(null);

  const currentStr = useFormatTime(currentTime);
  const totalStr = useFormatTime(currentTrack.currentTrack?.duration || 0);

  // Generate correct URL for HLS streaming through our API
  const streamUrl = useMemo(() => {
    if (!currentTrack.currentTrack) return { streamUrl: "", isHLSTrack: false };

    const isHLS =
      currentTrack.currentTrack.audioUrl?.includes(".m3u8") ||
      currentTrack.currentTrack.audioUrl?.includes("playlist.m3u8");

    const url = isHLS
      ? `http://localhost:5000/api/tracks/${currentTrack.currentTrack._id}/playlist.m3u8`
      : currentTrack.currentTrack.audioUrl;

    return { streamUrl: url, isHLSTrack: isHLS };
  }, [currentTrack.currentTrack?._id, currentTrack.currentTrack?.audioUrl]);

  // Event handlers
  const togglePlayPause = useCallback(() => {
    dispatch(setIsPlaying(!currentTrack.isPlaying));
  }, [dispatch, currentTrack.isPlaying]);

  const handleRepeatClick = useCallback(() => {
    const modes: RepeatMode[] = ["off", "playlist", "track"];
    const currentIndex = modes.indexOf(repeatMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setRepeatMode(modes[nextIndex]);
  }, [repeatMode]);

  const handleEnded = () => {
    dispatch(playNextTrack());
  };

  // Navigation buttons:
  const handleNext = () => dispatch(playNextTrack());
  const handlePrevious = () => dispatch(playPreviousTrack());

  // Toggle functions:
  const handleShuffle = () => dispatch(toggleShuffle());
  const handleRepeat = () => dispatch(toggleRepeat());

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
    setIsQueue(!isQueue);
    dispatch(setQueueOpen(!isQueue));
  }, [isQueue, dispatch]);

  // HLS cleanup function
  const cleanupHLS = useCallback(() => {
    if (hlsInstance) {
      hlsInstance.destroy();
      setHlsInstance(null);
    }
  }, [hlsInstance]);

  // Main track loading effect
  useEffect(() => {
    if (!audioRef.current || !currentTrack.currentTrack?.audioUrl) {
      cleanupHLS();
      setIsTrackLoaded(false);
      lastTrackId.current = null;
      return;
    }

    const currentTrackId = currentTrack.currentTrack._id;

    // Skip reload if same track is already loaded
    if (lastTrackId.current === currentTrackId && isTrackLoaded) {
      return;
    }

    lastTrackId.current = currentTrackId;

    const audio = audioRef.current;
    const trackUrl = streamUrl.streamUrl;

    setIsLoading(true);
    setCurrentTime(0);
    setIsTrackLoaded(false);

    if (streamUrl.isHLSTrack) {
      // HLS track handling
      if (Hls.isSupported()) {
        // Cleanup previous instance
        if (hlsInstance) {
          hlsInstance.destroy();
        }

        const hls = new Hls({
          debug: false,
          enableWorker: true,
          lowLatencyMode: false,
          maxBufferLength: 30,
          maxMaxBufferLength: 60,
          maxBufferSize: 60 * 1000 * 1000,
          maxBufferHole: 0.5,
        });

        // HLS events
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setIsLoading(false);
          setIsTrackLoaded(true);

          // Auto-start playback for HLS
          dispatch(setIsPlaying(true));
          setTimeout(() => {
            audio.play().catch(() => {
              dispatch(setIsPlaying(false));
            });
          }, 200);
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
                hls.destroy();
                setIsLoading(false);
                setIsTrackLoaded(false);
                dispatch(setIsPlaying(false));
                break;
            }
          }
        });

        hls.on(Hls.Events.BUFFER_APPENDED, () => {
          if (audio.buffered.length > 0) {
            const bufferedEnd = audio.buffered.end(audio.buffered.length - 1);
            const duration = audio.duration || 1;
            setBufferProgress((bufferedEnd / duration) * 100);
          }
        });

        hls.loadSource(trackUrl);
        hls.attachMedia(audio);
        setHlsInstance(hls);

        return () => {
          hls.destroy();
        };
      } else if (audio.canPlayType("application/vnd.apple.mpegurl")) {
        // Safari native HLS support
        audio.src = trackUrl;

        const handleCanPlay = () => {
          setIsLoading(false);
          setIsTrackLoaded(true);

          // Auto-start playback for Safari HLS
          dispatch(setIsPlaying(true));
          setTimeout(() => {
            audio.play().catch(() => {
              dispatch(setIsPlaying(false));
            });
          }, 200);
        };

        const handleError = () => {
          setIsLoading(false);
          setIsTrackLoaded(false);
          dispatch(setIsPlaying(false));
        };

        audio.addEventListener("canplaythrough", handleCanPlay);
        audio.addEventListener("error", handleError);

        return () => {
          audio.removeEventListener("canplaythrough", handleCanPlay);
          audio.removeEventListener("error", handleError);
        };
      } else {
        setIsLoading(false);
        setIsTrackLoaded(false);
        dispatch(setIsPlaying(false));
      }
    } else {
      // Regular MP3 track
      if (hlsInstance) {
        hlsInstance.destroy();
        setHlsInstance(null);
      }

      audio.src = trackUrl;

      const handleCanPlay = () => {
        setIsLoading(false);
        setIsTrackLoaded(true);

        // Auto-start playback for MP3
        dispatch(setIsPlaying(true));
        setTimeout(() => {
          audio.play().catch(() => {
            dispatch(setIsPlaying(false));
          });
        }, 200);
      };

      const handleError = () => {
        setIsLoading(false);
        setIsTrackLoaded(false);
        dispatch(setIsPlaying(false));
      };

      audio.addEventListener("canplaythrough", handleCanPlay);
      audio.addEventListener("error", handleError);

      return () => {
        audio.removeEventListener("canplaythrough", handleCanPlay);
        audio.removeEventListener("error", handleError);
      };
    }
  }, [currentTrack.currentTrack?._id]);

  // Playback control effect
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !isTrackLoaded) return;

    if (currentTrack.isPlaying) {
      if (audio.paused && audio.readyState >= 2) {
        audio.play().catch(() => {
          dispatch(setIsPlaying(false));
        });
      }
    } else if (!audio.paused) {
      audio.pause();
    }
  }, [currentTrack.isPlaying, isTrackLoaded, dispatch]);

  // Progress update effect
  useEffect(() => {
    if (!currentTrack.isPlaying || !audioRef.current) return;

    const interval = setInterval(() => {
      if (audioRef.current && !audioRef.current.paused) {
        setCurrentTime(audioRef.current.currentTime);

        // Update buffer progress for regular tracks
        if (!streamUrl.isHLSTrack && audioRef.current.buffered.length > 0) {
          const bufferedEnd = audioRef.current.buffered.end(
            audioRef.current.buffered.length - 1
          );
          const duration = audioRef.current.duration || 1;
          setBufferProgress((bufferedEnd / duration) * 100);
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, [currentTrack.isPlaying, streamUrl.isHLSTrack]);

  // Audio events effect
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      setCurrentTime(0);
      if (repeatMode === "track") {
        audio.currentTime = 0;
        audio.play().catch(() => {
          dispatch(setIsPlaying(false));
        });
      } else {
        dispatch(setIsPlaying(false));
      }
    };

    const handleLoadedMetadata = () => {
      // Track metadata loaded
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);

    return () => {
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
    };
  }, [repeatMode, dispatch]);

  // Volume control effect
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (hlsInstance) {
        hlsInstance.destroy();
      }
    };
  }, []);

  // Helper functions
  const getRepeatColor = useCallback(() => {
    switch (repeatMode) {
      case "track":
      case "playlist":
        return "white";
      default:
        return "rgba(255, 255, 255, 0.3)";
    }
  }, [repeatMode]);

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
      <audio ref={audioRef} preload="metadata" />

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
          onClick={handleRepeatClick}
        >
          <RetweetOutlined
            style={{ color: getRepeatColor(), fontSize: "24px" }}
          />
          {repeatMode === "track" && (
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
            color: isShuffling ? "white" : "rgba(255, 255, 255, 0.3)",
            fontSize: "24px",
          }}
          className="cursor-pointer hover:scale-110 transition-all duration-200"
          onClick={() => {
            setIsShuffling(!isShuffling)
            handleShuffle()
          }}
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
            color: isQueue ? "white" : "rgba(255, 255, 255, 0.3)",
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
