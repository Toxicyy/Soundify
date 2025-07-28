import {
  CaretRightOutlined,
  EllipsisOutlined,
  HeartFilled,
  HeartOutlined,
  PauseOutlined,
} from "@ant-design/icons";
import { useState, useRef, useCallback } from "react";
import type { Track } from "../../../../types/TrackData";
import { useFormatTime } from "../../../../hooks/useFormatTime";
import { useLike } from "../../../../hooks/useLike";
import type { AppDispatch, AppState } from "../../../../store";
import { useDispatch, useSelector } from "react-redux";
import {
  setCurrentTrack,
  setIsPlaying,
} from "../../../../state/CurrentTrack.slice";
import ContextMenu from "./ContextMenu";
import { addToQueue } from "../../../../state/Queue.slice";
import { useNavigate } from "react-router-dom";
import { useNotification } from "../../../../hooks/useNotification";

interface TrackLayoutProps {
  track: Track | undefined;
  isLoading?: boolean;
}

export default function TrackLayout({
  track,
  isLoading = false,
}: TrackLayoutProps) {
  const [likeHover, setLikeHover] = useState(false);
  const [hover, setHover] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const ellipsisRef = useRef<HTMLDivElement>(null);

  const duration = useFormatTime(track?.duration || 0);
  const dispatch = useDispatch<AppDispatch>();
  const currentTrack = useSelector((state: AppState) => state.currentTrack);

  const isCurrentTrack = currentTrack.currentTrack?._id === track?._id;
  const isThisTrackPlaying = isCurrentTrack && currentTrack.isPlaying;

  const navigate = useNavigate();
  const { showError, showSuccess } = useNotification();

  // Используем кастомный хук для лайков
  const {
    isLiked,
    isPending: likePending,
    toggleLike,
  } = useLike(track?._id || "");

  const togglePlayPause = () => {
    if (!track || isLoading) return;

    if (isCurrentTrack) {
      dispatch(setIsPlaying(!currentTrack.isPlaying));
    } else {
      dispatch(setCurrentTrack(track));
      setTimeout(() => {
        dispatch(setIsPlaying(true));
      }, 50);
    }
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

  const handleArtistClick = () => {
    if (!track) return;
    navigate(`/artist/${track.artist._id}`);
  };

  const handleAlbumClick = () => {
    if (!track) return;
    if (track.album == null) return;
    if (track.album == "single") {
      navigate(`/single/${track._id}`);
    } else {
      navigate(`/album/${track.album._id}`);
    }
  };

  const handleInfoClick = () => {
    if (!track) return;
    navigate(`/track/${track._id}`);
  };

  const handleShareClick = useCallback(async () => {
    try {
      if (!track) return;
      const url = `${window.location.origin}/track/${track._id}`;

      // Проверяем поддержку Web Share API (для мобильных устройств)
      if (navigator.share && /Mobi|Android/i.test(navigator.userAgent)) {
        const artistName =
          typeof track.artist === "string" ? track.artist : track.artist?.name;

        await navigator.share({
          title: `${track.name} - ${artistName}`,
          text: `Listen to "${track.name}" by ${artistName} on Soundify`,
          url: url,
        });

        showSuccess("Track shared successfully!");
      } else {
        await navigator.clipboard.writeText(url);
        showSuccess("Track link copied to clipboard!");
      }
    } catch (error) {
      // Обработка ошибок
      if (error === "AbortError") {
        return;
      }

      console.error("Share failed:", error);

      try {
        if (!track) return;
        const url = `${window.location.origin}/track/${track._id}`;
        await navigator.clipboard.writeText(url);
        showSuccess("Track link copied to clipboard!");
      } catch (clipboardError) {
        showError("Failed to share track. Please copy the URL manually.");
      }
    }
  }, [track, showSuccess, showError]);

  const handleMenuItemClick = (index: number) => {
    const menuActions = [
      handleLikeClick,
      handleAddToQueue,
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
      className={`flex justify-between items-center w-[40vw] ${
        isLoading ? "pointer-events-none" : "cursor-pointer"
      }`}
      onMouseEnter={() => !isLoading && setHover(true)}
      onMouseLeave={() => !isLoading && setHover(false)}
      onClick={
        menuOpen || likeHover
          ? () => {}
          : (e) => {
              e.stopPropagation();
              togglePlayPause();
            }
      }
    >
      <div className="flex gap-3 items-end justify-center">
        <div className="w-[65px] h-[65px] rounded-[10px] flex items-center justify-center relative overflow-hidden group">
          {isLoading ? (
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-white/20 to-white/5 backdrop-blur-md border border-white/20 rounded-[10px]">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-shimmer"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-white/40 text-2xl">🎵</div>
              </div>
            </div>
          ) : (
            <>
              {/* Изображение обложки */}
              <img
                src={track?.coverUrl}
                alt={track?.name}
                className="w-full h-full object-cover rounded-[10px]"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />

              {/* Overlay при hover */}
              <div
                className={`absolute inset-0 transition bg-black rounded-[10px] ${
                  hover ? "opacity-50" : "opacity-0"
                }`}
                style={{ zIndex: 20 }}
              />

              {/* Кнопки play/pause при hover */}
              {hover && (
                <div className="flex items-center justify-center absolute inset-0 z-30">
                  {isThisTrackPlaying ? (
                    <PauseOutlined
                      style={{
                        color: "white",
                        fontSize: "32px",
                        filter: "drop-shadow(0 2px 8px #222)",
                        cursor: "pointer",
                      }}
                    />
                  ) : (
                    <CaretRightOutlined
                      style={{
                        color: "white",
                        fontSize: "32px",
                        filter: "drop-shadow(0 2px 8px #222)",
                        cursor: "pointer",
                      }}
                    />
                  )}
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex flex-col gap-2">
          {isLoading ? (
            <div className="h-5 w-36 bg-gradient-to-r from-white/10 via-white/20 to-white/10 backdrop-blur-md border border-white/20 rounded-md relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-shimmer-delayed"></div>
            </div>
          ) : (
            <h1 className="text-white text-lg tracking-wider">{track?.name}</h1>
          )}

          {isLoading ? (
            <div className="h-4 w-16 bg-gradient-to-r from-white/8 via-white/15 to-white/8 backdrop-blur-md border border-white/15 rounded-md relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -skew-x-12 animate-shimmer-delayed-2"></div>
            </div>
          ) : (
            <h1
              className="text-sm tracking-wider"
              style={{ color: "rgba(255, 255, 255, 0.6)" }}
            >
              {track?.listenCount}
            </h1>
          )}
        </div>
      </div>

      <div className="flex gap-4 items-center relative">
        {isLoading ? (
          <div className="h-4 w-12 mr-20 bg-gradient-to-r from-white/8 via-white/15 to-white/8 backdrop-blur-md border border-white/15 rounded-md relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -skew-x-12 animate-shimmer"></div>
          </div>
        ) : (
          <h1 style={{ color: "rgba(255, 255, 255, 0.6)" }} className="mr-20">
            {duration}
          </h1>
        )}

        {isLoading ? (
          <div className="w-5 h-5 bg-gradient-to-r from-white/10 via-white/20 to-white/10 backdrop-blur-md border border-white/20 rounded-full relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-shimmer-delayed"></div>
          </div>
        ) : likePending ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1" />
        ) : isLiked ? (
          <HeartFilled
            style={{
              color: likeHover ? "#F93822" : "red",
              fontSize: "1.1rem",
            }}
            className="pb-1 cursor-pointer transition-all duration-200"
            onMouseEnter={() => setLikeHover(true)}
            onMouseLeave={() => setLikeHover(false)}
            onClick={handleLikeClick}
          />
        ) : (
          <HeartOutlined
            style={{
              color: likeHover ? "#D3D3D3" : "white",
              fontSize: "1.1rem",
            }}
            className="pb-1 cursor-pointer transition-all duration-200"
            onMouseEnter={() => setLikeHover(true)}
            onMouseLeave={() => setLikeHover(false)}
            onClick={handleLikeClick}
          />
        )}

        {isLoading ? (
          <div className="w-5 h-5 bg-gradient-to-r from-white/10 via-white/20 to-white/10 backdrop-blur-md border border-white/20 rounded-sm relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-shimmer-delayed-2"></div>
          </div>
        ) : (
          <div className="relative" ref={ellipsisRef}>
            <EllipsisOutlined
              style={{ color: "white" }}
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
            />
          </div>
        )}
      </div>
    </div>
  );
}
