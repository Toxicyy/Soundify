import {
  CaretRightOutlined,
  CloseOutlined,
  PauseOutlined,
} from "@ant-design/icons";
import { useState, type FC, useCallback } from "react";
import { useFormatTime } from "../../../../hooks/useFormatTime";
import { useDispatch, useSelector } from "react-redux";
import { type AppDispatch, type AppState } from "../../../../store";
import type { Track } from "../../../../types/TrackData";
import {
  removeFromQueue,
  playTrackAndQueue,
} from "../../../../state/Queue.slice";
import { Link } from "react-router-dom";

/**
 * Props для QueueTemplate компонента
 */
interface QueueTemplateProps {
  /** Трек для отображения */
  track: Track;
  /** Индекс трека в списке */
  index: number;
  /** Флаг что трек находится в очереди Next Up */
  isInQueue?: boolean;
  /** Мобильная версия компонента */
  isMobile?: boolean;
}

/**
 * Компонент для отображения трека в очереди воспроизведения
 * Поддерживает desktop и mobile layout с адаптивным дизайном
 */
export const QueueTemplate: FC<QueueTemplateProps> = ({
  track,
  index,
  isInQueue = false,
  isMobile = false,
}) => {
  // Локальные состояния для hover эффектов
  const [hover, setHover] = useState<boolean>(false);
  const [closeHover, setCloseHover] = useState<boolean>(false);

  // Redux состояния
  const dispatch = useDispatch<AppDispatch>();
  const currentTrack = useSelector((state: AppState) => state.currentTrack);
  const queueState = useSelector((state: AppState) => state.queue);

  // Вычисляемые значения
  const isCurrentTrack = currentTrack.currentTrack?._id === track._id;
  const isThisTrackPlaying = isCurrentTrack && currentTrack.isPlaying;
  const formattedDuration = useFormatTime(track.duration);

  /**
   * Воспроизводит выбранный трек и обновляет очередь
   */
  const playThisTrack = useCallback(() => {
    if (!track) return;

    if (isInQueue) {
      // Для треков из очереди Next Up - обновляем очередь
      const currentQueueIndex = queueState.queue.findIndex(
        (t) => t._id === track._id
      );
      const remainingQueue = queueState.queue.slice(currentQueueIndex + 1);

      dispatch(
        playTrackAndQueue({
          track,
          contextTracks:
            remainingQueue.length > 0 ? [track, ...remainingQueue] : [track],
          startIndex: 0,
        })
      );
    } else {
      // Для других случаев
      dispatch(playTrackAndQueue({ track }));
    }
  }, [track, isInQueue, queueState.queue, dispatch]);

  /**
   * Переключает воспроизведение/паузу или запускает новый трек
   */
  const togglePlayPause = useCallback(() => {
    if (isCurrentTrack) {
      // Переключаем play/pause для текущего трека
      dispatch({
        type: "currentTrack/setIsPlaying",
        payload: !currentTrack.isPlaying,
      });
    } else {
      // Воспроизводим новый трек
      playThisTrack();
    }
  }, [isCurrentTrack, currentTrack.isPlaying, playThisTrack, dispatch]);

  /**
   * Удаляет трек из очереди
   */
  const handleTrackClose = useCallback(() => {
    dispatch(removeFromQueue({ _id: track._id }));
  }, [track._id, dispatch]);

  /**
   * Рендерит иконку воспроизведения/паузы
   */
  const renderPlayIcon = () => {
    const iconSize = isMobile ? "14px" : "16px";

    if (!hover && !isCurrentTrack) {
      return (
        <h1 className={`text-white/50 ${isMobile ? "text-xs" : "text-sm"}`}>
          {index + 1}.
        </h1>
      );
    }

    if (isThisTrackPlaying) {
      return (
        <PauseOutlined
          style={{
            color: "#5cec8c",
            fontSize: iconSize,
            cursor: "pointer",
          }}
        />
      );
    }

    return (
      <CaretRightOutlined
        style={{
          color: isCurrentTrack ? "#5cec8c" : "white",
          fontSize: iconSize,
          cursor: "pointer",
        }}
      />
    );
  };

  /**
   * Рендерит индикатор "NOW PLAYING"
   */
  const renderPlayingIndicator = () => {
    if (!isCurrentTrack || !isThisTrackPlaying) return null;

    return (
      <div
        className={`flex items-center gap-2 mt-1 ${isMobile ? "pl-6" : "pl-9"}`}
      >
        <div className="flex items-center gap-1">
          <div className="w-0.5 h-2 bg-[#5cec8c] rounded-full animate-pulse"></div>
          <div className="w-0.5 h-1.5 bg-[#5cec8c] rounded-full animate-pulse delay-100"></div>
          <div className="w-0.5 h-3 bg-[#5cec8c] rounded-full animate-pulse delay-200"></div>
        </div>
        <span className="text-[#5cec8c] text-xs">
          {isMobile ? "PLAYING" : "NOW PLAYING"}
        </span>
      </div>
    );
  };

  // Mobile Layout
  if (isMobile) {
    return (
      <div
        className={`px-3 py-2.5 rounded-xl transition-all duration-200 ${
          hover ? "bg-white/5" : ""
        } ${
          isCurrentTrack
            ? "bg-white/10 shadow-lg border border-[#5cec8c]/20"
            : ""
        }`}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        <div className="flex items-center justify-between">
          {/* Left section: Play button + Track info */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {/* Play/Pause Button */}
            <span
              className="inline-flex w-5 justify-center cursor-pointer flex-shrink-0"
              onClick={togglePlayPause}
            >
              {renderPlayIcon()}
            </span>

            {/* Track Info */}
            <div className="min-w-0 flex-1">
              <h1
                className={`truncate text-sm font-medium ${
                  isCurrentTrack ? "text-[#5cec8c]" : "text-white"
                }`}
              >
                {track.name}
              </h1>
              <Link to={`/artist/${track.artist._id}`}>
                <h2 className="text-white/60 text-xs truncate hover:underline cursor-pointer">
                  {track.artist.name}
                </h2>
              </Link>
            </div>
          </div>

          {/* Right section: Duration + Close button */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-white/50 text-xs">{formattedDuration}</span>

            {isInQueue && (
              <CloseOutlined
                style={{
                  color: closeHover ? "red" : "rgba(255, 255, 255, 0.4)",
                  fontSize: "10px",
                }}
                className="cursor-pointer transition-colors duration-200 p-1"
                onMouseEnter={() => setCloseHover(true)}
                onMouseLeave={() => setCloseHover(false)}
                onClick={handleTrackClose}
              />
            )}
          </div>
        </div>

        {/* Playing indicator */}
        {renderPlayingIndicator()}
      </div>
    );
  }

  // Desktop Layout (Original)
  return (
    <div
      className={`pr-4 pl-8 py-2 rounded-lg transition-all duration-200 ${
        hover ? "bg-white/5" : ""
      } ${isCurrentTrack ? "bg-white/10 shadow-lg" : ""}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div className="flex items-center justify-between">
        {/* Left section */}
        <div className="flex items-center gap-3">
          {/* Index/Play Button */}
          <span
            className="inline-flex w-6 justify-center cursor-pointer"
            onClick={togglePlayPause}
          >
            {renderPlayIcon()}
          </span>

          {/* Track Info */}
          <div className="min-w-0 flex-1">
            <h1
              className={`truncate ${
                isCurrentTrack ? "text-[#5cec8c] font-medium" : "text-white"
              }`}
            >
              {track.name}
            </h1>
            <Link to={`/artist/${track.artist._id}`}>
              <h2 className="text-white/60 text-sm truncate hover:underline cursor-pointer">
                {track.artist.name}
              </h2>
            </Link>
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-3">
          <span className="text-white/50 text-sm">{formattedDuration}</span>

          <div className="flex items-center gap-2">
            {isInQueue && (
              <CloseOutlined
                style={{
                  color: closeHover ? "red" : "rgba(255, 255, 255, 0.4)",
                  fontSize: "12px",
                }}
                className="cursor-pointer transition-all duration-200"
                onMouseEnter={() => setCloseHover(true)}
                onMouseLeave={() => setCloseHover(false)}
                onClick={handleTrackClose}
              />
            )}
          </div>
        </div>
      </div>

      {/* Playing indicator */}
      {renderPlayingIndicator()}
    </div>
  );
};
