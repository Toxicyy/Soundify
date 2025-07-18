import {
  CaretRightOutlined,
  PauseOutlined,
  StepBackwardOutlined,
  StepForwardOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, AppState } from "../../../../../store";
import { setIsPlaying } from "../../../../../state/CurrentTrack.slice";
import { playNextTrack, playPreviousTrack } from "../../../../../state/Queue.slice";
import { useNavigate } from "react-router-dom";
import { useCallback, useState, useEffect, useRef } from "react";

/**
 * Compact mobile player component for bottom navigation
 * Features mini track info, basic controls, and click-to-expand functionality
 */
export const MobilePlayer = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const currentTrack = useSelector((state: AppState) => state.currentTrack);
  const queueState = useSelector((state: AppState) => state.queue);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  
  // Используем ref для доступа к основному audio элементу из Player компонента
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  // Находим audio элемент из основного плеера при монтировании
  useEffect(() => {
    const findAudioElement = () => {
      const audioElement = document.querySelector('audio');
      if (audioElement) {
        audioElementRef.current = audioElement;
      }
    };

    findAudioElement();
    
    // Проверяем каждые 100ms, пока не найдем audio элемент
    const interval = setInterval(() => {
      if (!audioElementRef.current) {
        findAudioElement();
      } else {
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  // Отслеживаем время воспроизведения из основного audio элемента
  useEffect(() => {
    if (!currentTrack.isPlaying || !audioElementRef.current) return;

    const interval = setInterval(() => {
      if (audioElementRef.current && !audioElementRef.current.paused) {
        setCurrentTime(audioElementRef.current.currentTime);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [currentTrack.isPlaying]);

  // Сброс времени при смене трека
  useEffect(() => {
    setCurrentTime(0);
  }, [currentTrack.currentTrack?._id]);

  const handleTogglePlayPause = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLoading) return;
    dispatch(setIsPlaying(!currentTrack.isPlaying));
  }, [dispatch, currentTrack.isPlaying, isLoading]);

  const handleNext = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch(playNextTrack());
  }, [dispatch]);

  const handlePrevious = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch(playPreviousTrack());
  }, [dispatch]);

  const handlePlayerClick = useCallback(() => {
    if (currentTrack.currentTrack) {
      navigate(`/player/${currentTrack.currentTrack._id}`);
    }
  }, [currentTrack.currentTrack, navigate]);

  // No track selected state
  if (!currentTrack.currentTrack) {
    return (
      <div className="fixed bottom-[80px] left-0 right-0 bg-black/80 backdrop-blur-md border-t border-white/10 p-3 z-40">
        <div className="flex items-center justify-center">
          <p className="text-white/60 text-sm">No track selected</p>
        </div>
      </div>
    );
  }

  const currentTrackData = currentTrack.currentTrack;

  return (
    <div 
      className="fixed bottom-[80px] left-0 right-0 bg-black/50 backdrop-blur-md border-t border-white/10 p-3 z-40 cursor-pointer active:bg-black/95 transition-colors duration-200"
      onClick={handlePlayerClick}
    >
      <div className="flex items-center justify-between gap-3">
        {/* Track Info */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <img
            src={currentTrackData.coverUrl}
            alt="Album Cover"
            className="w-10 h-10 rounded-lg object-cover"
          />
          <div className="flex-1 min-w-0">
            <h3 className="text-white text-sm font-medium truncate">
              {currentTrackData.name}
            </h3>
            <p className="text-white/60 text-xs truncate">
              {currentTrackData.artist?.name || "Unknown Artist"}
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevious}
            className="p-2 hover:bg-white/10 rounded-full transition-colors duration-200"
            aria-label="Previous track"
          >
            <StepBackwardOutlined 
              style={{ color: "white", fontSize: "18px" }} 
            />
          </button>

          <button
            onClick={handleTogglePlayPause}
            className="p-2 hover:bg-white/10 rounded-full transition-colors duration-200"
            aria-label={currentTrack.isPlaying ? "Pause" : "Play"}
          >
            {isLoading ? (
              <div className="w-[18px] h-[18px] border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : currentTrack.isPlaying ? (
              <PauseOutlined style={{ fontSize: "18px", color: "white" }} />
            ) : (
              <CaretRightOutlined style={{ fontSize: "20px", color: "white" }} />
            )}
          </button>

          <button
            onClick={handleNext}
            className="p-2 hover:bg-white/10 rounded-full transition-colors duration-200"
            aria-label="Next track"
          >
            <StepForwardOutlined 
              style={{ color: "white", fontSize: "18px" }} 
            />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-2 w-full h-1 bg-white/20 rounded-full overflow-hidden">
        <div 
          className="h-full bg-white rounded-full transition-all duration-100"
          style={{
            width: `${
              currentTrackData.duration
                ? (currentTime / currentTrackData.duration) * 100
                : 0
            }%`,
          }}
        />
      </div>
    </div>
  );
};