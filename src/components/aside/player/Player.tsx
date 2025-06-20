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
import { useEffect, useRef, useState } from "react";
import { setQueueOpen } from "../../../state/QueseOpen.slice";
import type { AppDispatch, AppState } from "../../../store";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import { useFormatTime } from "../../../hooks/useFormatTime";
import { setIsPlaying } from "../../../state/CurrentTrack.slice";

export const Player = () => {
  const [liked, setLiked] = useState(false);
  const [likeHover, setLikeHover] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);
  const [isLinked, setIsLinked] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isQueue, setIsQueue] = useState(false);
  const [isShare, setIsShare] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [repeatMode, setRepeatMode] = useState<"off" | "playlist" | "track">(
    "off"
  );

  const dispatch = useDispatch<AppDispatch>();
  const currentTrack = useSelector((state: AppState) => state.currentTrack);
  const audioRef = useRef<HTMLAudioElement>(null);

  const currentStr = useFormatTime(currentTime);
  const totalStr = useFormatTime(currentTrack.currentTrack?.duration || 0);

  const isPlayingRef = useRef(false);

  useEffect(() => {
    isPlayingRef.current = currentTrack.isPlaying;
  }, [currentTrack.isPlaying]);

  const getRepeatColor = () => {
    switch (repeatMode) {
      case "off":
        return "rgba(255, 255, 255, 0.3)";
      case "playlist":
        return "white";
      case "track":
        return "white";
      default:
        return "rgba(255, 255, 255, 0.3)";
    }
  };

  const handleRepeatClick = () => {
    const nextMode =
      repeatMode === "off"
        ? "playlist"
        : repeatMode === "playlist"
        ? "track"
        : "off";
    setRepeatMode(nextMode);
  };

  const togglePlayPause = () => {
    dispatch(setIsPlaying(!currentTrack.isPlaying));
  };

  // Загрузка нового трека
  useEffect(() => {
    if (!audioRef.current || !currentTrack.currentTrack?.audioUrl) return;

    const audio = audioRef.current;
    const newSrc = currentTrack.currentTrack.audioUrl;

    if (audio.src !== newSrc) {
      console.log("Загружается новый трек:", newSrc);
      setIsLoading(true);
      setCurrentTime(0);

      audio.pause();
      audio.src = newSrc;
      audio.load();

      const handleCanPlay = () => {
        setIsLoading(false);
        console.log("Трек готов к воспроизведению");
        if (currentTrack.isPlaying) {
          audio.play().catch(console.error);
        }
        audio.removeEventListener("canplaythrough", handleCanPlay);
        audio.removeEventListener("error", handleError);
      };

      const handleError = () => {
        setIsLoading(false);
        dispatch(setIsPlaying(false));
        console.error("Ошибка загрузки аудио");
        audio.removeEventListener("canplaythrough", handleCanPlay);
        audio.removeEventListener("error", handleError);
      };

      audio.addEventListener("canplaythrough", handleCanPlay);
      audio.addEventListener("error", handleError);

      // Очистка при размонтировании или смене трека
      return () => {
        audio.removeEventListener("canplaythrough", handleCanPlay);
        audio.removeEventListener("error", handleError);
      };
    }
  }, [currentTrack.currentTrack?.audioUrl, currentTrack.isPlaying, dispatch]);

  // Управление воспроизведением
  useEffect(() => {
    if (!audioRef.current || isLoading) return;

    const audio = audioRef.current;

    if (currentTrack.isPlaying) {
      if (audio.paused && audio.readyState >= 2) {
        audio.play().catch((error) => {
          console.error("Ошибка воспроизведения:", error);
          dispatch(setIsPlaying(false));
        });
      }
    } else {
      if (!audio.paused) {
        audio.pause();
      }
    }
  }, [currentTrack.isPlaying, isLoading, dispatch]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      console.log("Time update:", audio.currentTime); // Для отладки
    };

    const handleEnded = () => {
      console.log("Трек завершился, режим повтора:", repeatMode);
      setCurrentTime(0);

      if (repeatMode === "track") {
        audio.currentTime = 0;
        requestAnimationFrame(() => {
          if (
            repeatMode === "track" &&
            audioRef.current &&
            isPlayingRef.current
          ) {
            audioRef.current.play().catch((error) => {
              if (error.name !== "AbortError") {
                console.error("Ошибка повтора трека:", error);
                dispatch(setIsPlaying(false));
              }
            });
          }
        });
      } else {
        dispatch(setIsPlaying(false));
      }
    };

    const handleLoadedMetadata = () => {
      console.log("Метаданные загружены, длительность:", audio.duration);
      setCurrentTime(0);
    };

    const handlePlay = () => {
      console.log("Аудио начало воспроизведение");
    };

    const handlePause = () => {
      console.log("Аудио поставлено на паузу");
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
    };
  }, [repeatMode, dispatch]);

  // Громкость
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = Number(e.target.value);
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = Number(e.target.value) / 100;
    setVolume(newVolume);
    if (newVolume === 0) {
      setIsMuted(true);
    } else if (isMuted) {
      setIsMuted(false);
    }
  };

  if (currentTrack.currentTrack === null) {
    return (
      <motion.div
        initial={{ opacity: 0, y: "1000px" }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="flex flex-col items-center justify-center h-full text-center p-8"
      >
        <p className="text-white/60 text-lg mb-2">
          Выберите трек для воспроизведения
        </p>
        <p className="text-white/40 text-sm">
          Нажмите на любой трек в плейлисте
        </p>
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col">
      <audio ref={audioRef} />

      <motion.div
        initial={{ opacity: 0, marginRight: "1000px" }}
        animate={{ opacity: 1, marginRight: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="w-[13vw] h-[13vw] mb-7 self-center relative"
      >
        <img
          src={currentTrack.currentTrack.coverUrl}
          alt="Music Cover"
          className="rounded-2xl drop-shadow-[0_7px_7px_rgba(0,0,0,0.4)] w-full h-full object-cover"
        />
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
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
            {currentTrack.currentTrack.name}
          </h1>
          {liked ? (
            <HeartFilled
              style={{
                color: likeHover ? "#F93822" : "red",
                fontSize: "1.1rem",
              }}
              className="pb-1 cursor-pointer"
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
              className="pb-1 cursor-pointer"
              onMouseEnter={() => setLikeHover(true)}
              onMouseLeave={() => setLikeHover(false)}
              onClick={() => setLiked(true)}
            />
          )}
        </div>
        <h2 className="text-white/60 mb-2 truncate">
          {currentTrack.currentTrack.artist?.name || "Неизвестный исполнитель"}
        </h2>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 1000 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-xs mx-auto rounded-xl flex flex-col items-stretch"
      >
        <div className="flex flex-col w-full mb-2 relative">
          <div className="absolute left-0 top-[2px] -translate-y-1/2 w-full h-[3px] rounded-lg bg-white/40 pointer-events-none" />
          <div
            className="absolute left-0 top-[2px] -translate-y-1/2 h-[3px] rounded-lg bg-white pointer-events-none transition-all duration-100"
            style={{
              width: `${
                currentTrack.currentTrack.duration
                  ? (currentTime / currentTrack.currentTrack.duration) * 100
                  : 0
              }%`,
            }}
          />
          <input
            type="range"
            min={0}
            max={currentTrack.currentTrack.duration || 0}
            value={currentTime}
            onChange={handleSeek}
            disabled={isLoading}
            className="
              w-full h-[3px] rounded-lg mt-[0.7px] appearance-none bg-transparent z-10 relative
              accent-white cursor-pointer disabled:cursor-not-allowed disabled:opacity-50
              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2
              [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white
              [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white/90
              [&::-webkit-slider-thumb]:shadow focus:outline-none
            "
          />
          <div className="flex justify-between mt-2 relative z-10">
            <span className="text-[15px] text-white/50 select-none">
              {currentStr}
            </span>
            <span className="text-[15px] text-white/50 select-none">
              {totalStr}
            </span>
          </div>

          {/* Отладочная информация */}
          {process.env.NODE_ENV === "development" && (
            <div className="text-xs text-white/30 mt-1">
              Debug: {currentTime.toFixed(1)}s /{" "}
              {currentTrack.currentTrack.duration}s
            </div>
          )}
        </div>
      </motion.div>

      {/* Управление */}
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
              <div className="w-3 h-3 bg-transparent rounded-full flex items-center justify-center">
                <span className="text-[8px] text-white font-bold">1</span>
              </div>
            </div>
          )}
        </div>
        <StepBackwardOutlined
          style={{ color: "white", fontSize: "24px" }}
          className="cursor-pointer hover:scale-110 transition-all duration-200"
        />
        <div
          className="glass rounded-full w-[50px] h-[50px] flex items-center justify-center cursor-pointer hover:scale-110 transition-all duration-200"
          onClick={togglePlayPause}
        >
          {isLoading ? (
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
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
        />
        <SwapOutlined
          style={{
            color: isShuffling ? "white" : "rgba(255, 255, 255, 0.3)",
            fontSize: "24px",
          }}
          className="cursor-pointer hover:scale-110 transition-all duration-200"
          onClick={() => setIsShuffling(!isShuffling)}
        />
      </motion.div>

      {/* Дополнительные элементы */}
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
              onClick={() => setIsMuted(!isMuted)}
            />
          ) : (
            <SoundOutlined
              style={{ fontSize: "24px", color: "rgba(255, 255, 255, 0.3)" }}
              className="cursor-pointer hover:scale-110 transition-all duration-200"
              onClick={() => setIsMuted(!isMuted)}
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
          onClick={() => {
            setIsQueue(!isQueue);
            dispatch(setQueueOpen(!isQueue));
          }}
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
