import {
  CaretRightOutlined,
  CloseOutlined,
  PauseOutlined,
} from "@ant-design/icons";
import { useState, type FC } from "react";
import { useFormatTime } from "../../../../hooks/useFormatTime";
import { useDispatch, useSelector } from "react-redux";
import { type AppDispatch, type AppState } from "../../../../store";
import type { Track } from "../../../../types/TrackData";
import {
  removeFromQueue,
  playTrackAndQueue,
} from "../../../../state/Queue.slice";
import { Link } from "react-router-dom";

interface QueueTemplateProps {
  track: Track;
  index: number;
  isInQueue?: boolean; // Флаг что трек в очереди Next Up
}

export const QueueTemplate: FC<QueueTemplateProps> = ({
  track,
  index,
  isInQueue = false,
}) => {
  const [hover, setHover] = useState<boolean>(false);
  const [closeHover, setCloseHover] = useState<boolean>(false);

  const dispatch = useDispatch<AppDispatch>();
  const currentTrack = useSelector((state: AppState) => state.currentTrack);
  const queueState = useSelector((state: AppState) => state.queue);

  // Проверяем является ли этот трек текущим играющим
  const isCurrentTrack = currentTrack.currentTrack?._id === track._id;
  const isThisTrackPlaying = isCurrentTrack && currentTrack.isPlaying;

  const playThisTrack = () => {
    if (!track) return;

    if (isInQueue) {
      // Если трек из очереди Next Up - воспроизводим его и обновляем очередь
      // Берем остальные треки из очереди после этого трека
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
      // Для других случаев (если нужно)
      dispatch(playTrackAndQueue({ track }));
    }
  };

  const togglePlayPause = () => {
    if (isCurrentTrack) {
      // Если это текущий трек - переключаем play/pause
      dispatch({
        type: "currentTrack/setIsPlaying",
        payload: !currentTrack.isPlaying,
      });
    } else {
      // Иначе воспроизводим этот трек
      playThisTrack();
    }
  };

  const handleTrackClose = () => {
    dispatch(removeFromQueue({ _id: track._id }));
  };

  return (
    <div
      className={`pr-4 pl-8 py-2 rounded-lg transition-all duration-200 ${
        hover ? "bg-white/5" : ""
      } ${isCurrentTrack ? "bg-white/10 shadow-lg" : ""}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Index/Play Button */}
          <span
            className="inline-flex w-6 justify-center cursor-pointer"
            onClick={togglePlayPause}
          >
            {!hover && !isCurrentTrack ? (
              <h1 className="text-white/50 text-sm">{index + 1}.</h1>
            ) : isThisTrackPlaying ? (
              <PauseOutlined
                style={{
                  color: "#5cec8c",
                  fontSize: "16px",
                  cursor: "pointer",
                }}
              />
            ) : (
              <CaretRightOutlined
                style={{
                  color: isCurrentTrack ? "#5cec8c" : "white",
                  fontSize: "16px",
                  cursor: "pointer",
                }}
              />
            )}
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

        <div className="flex items-center gap-3">
          <span className="text-white/50 text-sm">
            {useFormatTime(track.duration)}
          </span>

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

      {/* Playing indicator for current track */}
      {isCurrentTrack && isThisTrackPlaying && (
        <div className="flex items-center gap-2 mt-1 pl-9">
          <div className="flex items-center gap-1">
            <div className="w-0.5 h-2 bg-[#5cec8c] rounded-full animate-pulse"></div>
            <div className="w-0.5 h-1.5 bg-[#5cec8c] rounded-full animate-pulse delay-100"></div>
            <div className="w-0.5 h-3 bg-[#5cec8c] rounded-full animate-pulse delay-200"></div>
          </div>
          <span className="text-[#5cec8c] text-xs">NOW PLAYING</span>
        </div>
      )}
    </div>
  );
};
