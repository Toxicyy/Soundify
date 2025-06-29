import {
  PauseOutlined,
  CaretRightOutlined,
  EllipsisOutlined,
} from "@ant-design/icons";
import { useState, useRef, type FC } from "react";
import { useFormatTime } from "../../../../hooks/useFormatTime";
import { useLike } from "../../../../hooks/useLike";
import { useDispatch, useSelector } from "react-redux";
import { type AppDispatch, type AppState } from "../../../../store";
import { setIsPlaying } from "../../../../state/CurrentTrack.slice";
import type { Track } from "../../../../types/TrackData";
import ContextMenu from "../../../mainPage/mainMenu/components/ContextMenu";
import { addToQueue } from "../../../../state/Queue.slice";

interface CurrentTrackTemplateProps {
  track: Track;
}

export const CurrentTrackTemplate: FC<CurrentTrackTemplateProps> = ({
  track,
}) => {
  const [hover, setHover] = useState<boolean>(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const ellipsisRef = useRef<HTMLDivElement>(null);

  const dispatch = useDispatch<AppDispatch>();
  const currentTrack = useSelector((state: AppState) => state.currentTrack);
  const isCurrentTrack = currentTrack.currentTrack?._id === track?._id;
  const isPlaying = currentTrack.isPlaying && isCurrentTrack;

  // Используем кастомный хук для лайков
  const { isLiked, isPending: likePending, toggleLike } = useLike(track._id);

  const togglePlayPause = () => {
    dispatch(setIsPlaying(!isPlaying));
  };

  const handleEllipsisClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(!menuOpen);
  };

  const handleLikeClick = async () => {
    if (!track?._id) return;
    await toggleLike();
  };

  const handleAddToQueue = () => {
    if (!track) return;
    dispatch(addToQueue(track));
  };

  const handleHideTrack = () => {
    console.log("Hide track clicked");
  };

  const handleArtistClick = () => {
    console.log("Artist clicked");
  };

  const handleAlbumClick = () => {
    console.log("Album clicked");
  };

  const handleInfoClick = () => {
    console.log("Info clicked");
  };

  const handleShareClick = () => {
    console.log("Share clicked");
  };

  const handleMenuItemClick = (index: number) => {
    const menuActions = [
      handleLikeClick,
      handleAddToQueue,
      handleHideTrack,
      handleArtistClick,
      handleAlbumClick,
      handleInfoClick,
      handleShareClick,
    ];

    if (index >= menuActions.length) return;

    menuActions[index]();

    console.log(`Clicked: ${menuActions[index]} for track: ${track?.name}`);
  };

  const handleCloseMenu = () => {
    setMenuOpen(false);
  };

  return (
    <div
      className="pr-4 pl-3 ml-6 py-3 bg-white/5 rounded-lg border border-white/10"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Album Cover */}
          <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
            <img
              src={track.coverUrl}
              alt="Album Cover"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Play Button */}
          <div
            className="flex items-center justify-center cursor-pointer"
            onClick={togglePlayPause}
          >
            {isPlaying ? (
              <PauseOutlined
                style={{
                  color: "#5cec8c",
                  fontSize: "20px",
                  cursor: "pointer",
                }}
              />
            ) : (
              <CaretRightOutlined
                style={{
                  color: "#5cec8c",
                  fontSize: "20px",
                  cursor: "pointer",
                }}
              />
            )}
          </div>

          {/* Track Info */}
          <div className="flex flex-col min-w-0 flex-1">
            <h1 className="text-white font-medium truncate">{track.name}</h1>
            <h2 className="text-white/60 text-sm truncate">
              {track.artist.name}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-white/50 text-sm">
            {useFormatTime(track.duration)}
          </span>

          <div className="relative" ref={ellipsisRef}>
            <EllipsisOutlined
              style={{ color: hover ? "white" : "rgba(255, 255, 255, 0.4)" }}
              className="cursor-pointer transition-all duration-200 hover:scale-110"
              onClick={handleEllipsisClick}
            />

            <ContextMenu
              isOpen={menuOpen}
              onClose={handleCloseMenu}
              onMenuItemClick={handleMenuItemClick}
              anchorRef={ellipsisRef}
              isPlaying={isCurrentTrack}
              isLiked={isLiked}
              isPending={likePending} // Передаем состояние загрузки
            />
          </div>
        </div>
      </div>

      {/* Now Playing Indicator */}
      {isPlaying && (
        <div className="flex items-center gap-2 mt-2 pl-16">
          <div className="flex items-center gap-1">
            <div className="w-1 h-3 bg-[#5cec8c] rounded-full animate-pulse"></div>
            <div className="w-1 h-2 bg-[#5cec8c] rounded-full animate-pulse delay-100"></div>
            <div className="w-1 h-4 bg-[#5cec8c] rounded-full animate-pulse delay-200"></div>
          </div>
          <span className="text-[#5cec8c] text-xs font-medium">
            NOW PLAYING
          </span>
        </div>
      )}
    </div>
  );
};
