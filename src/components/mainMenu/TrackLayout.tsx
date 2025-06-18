import {
  CaretRightOutlined,
  EllipsisOutlined,
  HeartFilled,
  HeartOutlined,
  PauseOutlined,
} from "@ant-design/icons";
import { useEffect, useRef, useState } from "react";
import type { Track } from "../../types/TrackData";
import { useFormatTime } from "../../hooks/useFormatTime";
import type { AppDispatch, AppState } from "../../store";
import { useDispatch, useSelector } from "react-redux";
import {
  playTrack,
  setCurrentTrack,
  setIsPlaying,
} from "../../state/CurrentTrack.slice";

export default function TrackLayout({ track }: { track: Track | undefined }) {
  const [liked, setLiked] = useState(false);
  const [likeHover, setLikeHover] = useState(false);
  const [hover, setHover] = useState(false);
  const duration = useFormatTime(track?.duration || 0);
  const dispatch = useDispatch<AppDispatch>();
  const currentTrack = useSelector((state: AppState) => state.currentTrack);

  const isThisTrackPlaying = () => currentTrack.isPlaying && currentTrack.currentTrack?.name === track?.name
  const togglePlayPause = () => {
    dispatch(playTrack(track));
  };
  return (
    <div
      className="flex justify-between items-center w-[40vw]"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div className="flex gap-3 items-end justify-center">
        <div
          className="w-[65px] h-[65px] rounded-[10px] bg-cover bg-center flex items-center justify-center relative overflow-hidden group"
          style={{ backgroundImage: `url(${track?.coverUrl})` }}
        >
          {/* Оверлей затемнения */}
          <div
            className={`absolute inset-0 transition bg-black ${
              hover ? "opacity-50" : "opacity-0"
            }`}
            style={{ zIndex: 20 }}
          />

          {/* Иконка play/pause */}
          {hover && (
            <div className="flex items-center justify-center absolute inset-0 z-30">
              {isThisTrackPlaying() ? (
                <PauseOutlined
                  style={{
                    color: "#5cec8c",
                    fontSize: "32px",
                    filter: "drop-shadow(0 2px 8px #222)", // чтобы светилась
                    cursor: "pointer",
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePlayPause();
                  }}
                />
              ) : (
                <CaretRightOutlined
                  style={{
                    color: "#5cec8c",
                    fontSize: "32px",
                    filter: "drop-shadow(0 2px 8px #222)",
                    cursor: "pointer",
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePlayPause();
                  }}
                />
              )}
            </div>
          )}
        </div>
        <div>
          <h1 className="text-white text-lg  tracking-wider">{track?.name}</h1>
          <h1
            className="text-sm tracking-wider"
            style={{ color: "rgba(255, 255, 255, 0.6)" }}
          >
            {track?.listenCount}
          </h1>
        </div>
      </div>
      <div className="flex gap-4 items-center">
        <h1 style={{ color: "rgba(255, 255, 255, 0.6)" }} className="mr-20">
          {duration}
        </h1>
        {liked ? (
          <HeartFilled
            style={{
              color: likeHover ? "#F93822" : "red",
              fontSize: "1.1rem",
            }}
            className="pb-1"
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
            className="pb-1"
            onMouseEnter={() => setLikeHover(true)}
            onMouseLeave={() => setLikeHover(false)}
            onClick={() => setLiked(true)}
          />
        )}
        <EllipsisOutlined
          style={{ color: "white" }}
          className="cursor-pointer"
        />
      </div>
    </div>
  );
}
