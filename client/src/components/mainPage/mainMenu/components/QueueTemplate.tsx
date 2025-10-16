import { memo, useState, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  CaretRightOutlined,
  CloseOutlined,
  PauseOutlined,
} from "@ant-design/icons";
import { useFormatTime } from "../../../../hooks/useFormatTime";
import { type AppDispatch, type AppState } from "../../../../store";
import type { Track } from "../../../../types/TrackData";
import {
  removeFromQueue,
  playTrackAndQueue,
} from "../../../../state/Queue.slice";

interface QueueTemplateProps {
  track: Track;
  index: number;
  isInQueue?: boolean;
  isMobile?: boolean;
}

/**
 * Template for track item in queue
 * Supports mobile and desktop layouts with play controls
 */
const QueueTemplate = ({
  track,
  index,
  isInQueue = false,
  isMobile = false,
}: QueueTemplateProps) => {
  const [hover, setHover] = useState(false);
  const [closeHover, setCloseHover] = useState(false);

  const dispatch = useDispatch<AppDispatch>();
  const currentTrack = useSelector((state: AppState) => state.currentTrack);
  const queueState = useSelector((state: AppState) => state.queue);

  const isCurrentTrack = currentTrack.currentTrack?._id === track._id;
  const isThisTrackPlaying = isCurrentTrack && currentTrack.isPlaying;
  const formattedDuration = useFormatTime(track.duration);

  const playThisTrack = useCallback(() => {
    if (!track) return;

    if (isInQueue) {
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
      dispatch(playTrackAndQueue({ track }));
    }
  }, [track, isInQueue, queueState.queue, dispatch]);

  const togglePlayPause = useCallback(() => {
    if (isCurrentTrack) {
      dispatch({
        type: "currentTrack/setIsPlaying",
        payload: !currentTrack.isPlaying,
      });
    } else {
      playThisTrack();
    }
  }, [isCurrentTrack, currentTrack.isPlaying, playThisTrack, dispatch]);

  const handleTrackClose = useCallback(() => {
    dispatch(removeFromQueue({ _id: track._id }));
  }, [track._id, dispatch]);

  const renderPlayIcon = useMemo(() => {
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
  }, [hover, isCurrentTrack, isThisTrackPlaying, isMobile, index]);

  const renderPlayingIndicator = useMemo(() => {
    if (!isCurrentTrack || !isThisTrackPlaying) return null;

    return (
      <div
        className={`flex items-center gap-2 mt-1 ${isMobile ? "pl-6" : "pl-9"}`}
      >
        <div className="flex items-center gap-1">
          <div className="w-0.5 h-2 bg-[#5cec8c] rounded-full animate-pulse" />
          <div className="w-0.5 h-1.5 bg-[#5cec8c] rounded-full animate-pulse delay-100" />
          <div className="w-0.5 h-3 bg-[#5cec8c] rounded-full animate-pulse delay-200" />
        </div>
        <span className="text-[#5cec8c] text-xs">
          {isMobile ? "PLAYING" : "NOW PLAYING"}
        </span>
      </div>
    );
  }, [isCurrentTrack, isThisTrackPlaying, isMobile]);

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
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span
              className="inline-flex w-5 justify-center cursor-pointer flex-shrink-0"
              onClick={togglePlayPause}
            >
              {renderPlayIcon}
            </span>

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

        {renderPlayingIndicator}
      </div>
    );
  }

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
          <span
            className="inline-flex w-6 justify-center cursor-pointer"
            onClick={togglePlayPause}
          >
            {renderPlayIcon}
          </span>

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

      {renderPlayingIndicator}
    </div>
  );
};

export default memo(QueueTemplate);
