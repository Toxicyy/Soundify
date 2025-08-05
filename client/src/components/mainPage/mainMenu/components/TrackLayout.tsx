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
import { addToQueue, playTrackAndQueue } from "../../../../state/Queue.slice";
import { useNavigate } from "react-router-dom";
import { useNotification } from "../../../../hooks/useNotification";
import { motion } from "framer-motion";
import { useGetUserQuery } from "../../../../state/UserApi.slice";
import { api } from "../../../../shared/api";

interface TrackLayoutProps {
  track: Track | undefined;
  isLoading?: boolean;
  isMobile?: boolean;
}

export default function TrackLayout({
  track,
  isLoading = false,
  isMobile = false,
}: TrackLayoutProps) {
  const [likeHover, setLikeHover] = useState(false);
  const [ellipsisHover, setEllipsisHover] = useState(false);
  const [hover, setHover] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { data: user } = useGetUserQuery();

  const ellipsisRef = useRef<HTMLDivElement>(null);

  const duration = useFormatTime(track?.duration || 0);
  const dispatch = useDispatch<AppDispatch>();
  const currentTrack = useSelector((state: AppState) => state.currentTrack);

  const isCurrentTrack = currentTrack.currentTrack?._id === track?._id;
  const isThisTrackPlaying = isCurrentTrack && currentTrack.isPlaying;

  const navigate = useNavigate();
  const { showError, showSuccess } = useNotification();

  const {
    isLiked,
    isPending: likePending,
    toggleLike,
  } = useLike(track?._id || "");

  const togglePlayPauseWithRecommendations = async () => {
    if (!track || isLoading) return;

    // Если это текущий трек - просто переключаем паузу
    if (isCurrentTrack) {
      dispatch(setIsPlaying(!currentTrack.isPlaying));
      return;
    }

    try {
      if (!user?._id) return;
      const response = await api.recommendations.getForUser(user?._id);
      const recommendations = await response.json();

      const playQueue = [track, ...recommendations];

      dispatch(
        playTrackAndQueue({
          track, // Текущий трек
          contextTracks: playQueue,
          startIndex: 0,
        })
      );

      setTimeout(() => {
        dispatch(setIsPlaying(true));
      }, 50);
    } catch (error) {
      console.error("Ошибка при получении рекомендаций:", error);

      dispatch(setCurrentTrack(track));
      setTimeout(() => {
        dispatch(setIsPlaying(true));
      }, 50);
    }
  };

  const handleEllipsisClick = () => {
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

  // Mobile Layout
  const MobileLayout = () => (
    <motion.div
      className={`glass-card rounded-xl p-3 transition-all duration-200 ${
        isLoading ? "pointer-events-none" : "cursor-pointer"
      } ${hover && !isLoading ? "glass-card-hover" : ""}`}
      onMouseEnter={() => !isLoading && setHover(true)}
      onMouseLeave={() => !isLoading && setHover(false)}
      onClick={
        menuOpen || likeHover || ellipsisHover
          ? () => {}
          : () => {
              togglePlayPauseWithRecommendations();
            }
      }
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-center gap-3">
        {/* Cover Image */}
        <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 relative">
          {isLoading ? (
            <div className="skeleton-glass rounded-lg">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-shimmer"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-white/40 text-lg">🎵</div>
              </div>
            </div>
          ) : (
            <>
              <img
                src={track?.coverUrl}
                alt={track?.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />

              {/* Play overlay */}
              {hover && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  {isThisTrackPlaying ? (
                    <PauseOutlined
                      style={{ color: "white", fontSize: "16px" }}
                    />
                  ) : (
                    <CaretRightOutlined
                      style={{ color: "white", fontSize: "16px" }}
                    />
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Track Info */}
        <div className="flex-1 min-w-0">
          {isLoading ? (
            <div className="space-y-2">
              <div className="skeleton-text h-4 w-3/4 rounded"></div>
              <div className="skeleton-text h-3 w-1/2 rounded"></div>
            </div>
          ) : (
            <>
              <h1
                className={`text-sm font-medium truncate ${
                  isCurrentTrack ? "text-[#5cec8c]" : "text-white"
                }`}
              >
                {track?.name}
              </h1>
              <p className="text-xs text-white/60 truncate">
                {track?.listenCount} plays
              </p>
            </>
          )}
        </div>

        {/* Actions - остальной код без изменений */}
        <div className="flex items-center gap-2">
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-white/10 rounded-full"></div>
              <div className="w-4 h-4 bg-white/10 rounded-sm"></div>
            </div>
          ) : (
            <>
              {/* Duration */}
              <span className="text-white/50 text-xs">{duration}</span>

              {/* Like Button */}
              {likePending ? (
                <div className="animate-spin rounded-full h-3 w-3 border-b border-white" />
              ) : isLiked ? (
                <HeartFilled
                  style={{
                    color: likeHover ? "#F93822" : "red",
                    fontSize: "14px",
                  }}
                  className="cursor-pointer transition-all duration-200"
                  onMouseEnter={() => setLikeHover(true)}
                  onMouseLeave={() => setLikeHover(false)}
                  onClick={handleLikeClick}
                />
              ) : (
                <HeartOutlined
                  style={{
                    color: likeHover ? "#D3D3D3" : "white/60",
                    fontSize: "14px",
                  }}
                  className="cursor-pointer transition-all duration-200"
                  onMouseEnter={() => setLikeHover(true)}
                  onMouseLeave={() => setLikeHover(false)}
                  onClick={handleLikeClick}
                />
              )}

              {/* Menu */}
              <div className="relative" ref={ellipsisRef}>
                <EllipsisOutlined
                  style={{ color: "white", fontSize: "14px" }}
                  className="cursor-pointer transition-all duration-200 hover:scale-110"
                  onMouseEnter={() => setEllipsisHover(true)}
                  onMouseLeave={() => setEllipsisHover(false)}
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
            </>
          )}
        </div>
      </div>
    </motion.div>
  );

  // Desktop/Tablet Layout (Original)
  const DesktopLayout = () => (
    <div
      className={`flex justify-between items-center w-full ${
        isLoading ? "pointer-events-none" : "cursor-pointer"
      }`}
      onMouseEnter={() => !isLoading && setHover(true)}
      onMouseLeave={() => !isLoading && setHover(false)}
      onClick={
        menuOpen || likeHover || ellipsisHover
          ? () => {}
          : () => {
              togglePlayPauseWithRecommendations();
            }
      }
    >
      <div className="flex gap-2 md:gap-3 items-end justify-center">
        <div className="w-12 h-12 md:w-16 md:h-16 xl:w-[65px] xl:h-[65px] rounded-lg xl:rounded-[10px] flex items-center justify-center relative overflow-hidden group">
          {isLoading ? (
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-white/20 to-white/5 backdrop-blur-md border border-white/20 rounded-lg xl:rounded-[10px]">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-shimmer"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-white/40 text-lg xl:text-2xl">🎵</div>
              </div>
            </div>
          ) : (
            <>
              {/* Изображение обложки */}
              <img
                src={track?.coverUrl}
                alt={track?.name}
                className="w-full h-full object-cover rounded-lg xl:rounded-[10px]"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />

              {/* Overlay при hover */}
              <div
                className={`absolute inset-0 transition bg-black rounded-lg xl:rounded-[10px] ${
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
                        fontSize: "24px",
                        filter: "drop-shadow(0 2px 8px #222)",
                        cursor: "pointer",
                      }}
                    />
                  ) : (
                    <CaretRightOutlined
                      style={{
                        color: "white",
                        fontSize: "24px",
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

        <div className="flex flex-col gap-1 xl:gap-2 min-w-0 flex-1">
          {isLoading ? (
            <div className="h-4 xl:h-5 w-24 xl:w-36 bg-gradient-to-r from-white/10 via-white/20 to-white/10 backdrop-blur-md border border-white/20 rounded-md relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-shimmer-delayed"></div>
            </div>
          ) : (
            <h1 className="text-white text-sm md:text-base xl:text-lg tracking-wider truncate">
              {track?.name}
            </h1>
          )}

          {isLoading ? (
            <div className="h-3 xl:h-4 w-12 xl:w-16 bg-gradient-to-r from-white/8 via-white/15 to-white/8 backdrop-blur-md border border-white/15 rounded-md relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -skew-x-12 animate-shimmer-delayed-2"></div>
            </div>
          ) : (
            <h1
              className="text-xs xl:text-sm tracking-wider truncate"
              style={{ color: "rgba(255, 255, 255, 0.6)" }}
            >
              {track?.listenCount}
            </h1>
          )}
        </div>
      </div>

      <div className="flex gap-2 md:gap-3 xl:gap-4 items-center relative">
        {isLoading ? (
          <div className="h-3 xl:h-4 w-8 xl:w-12 mr-8 xl:mr-20 bg-gradient-to-r from-white/8 via-white/15 to-white/8 backdrop-blur-md border border-white/15 rounded-md relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -skew-x-12 animate-shimmer"></div>
          </div>
        ) : (
          <h1
            style={{ color: "rgba(255, 255, 255, 0.6)" }}
            className="mr-8 xl:mr-20 text-xs xl:text-sm"
          >
            {duration}
          </h1>
        )}

        {isLoading ? (
          <div className="w-4 h-4 xl:w-5 xl:h-5 bg-gradient-to-r from-white/10 via-white/20 to-white/10 backdrop-blur-md border border-white/20 rounded-full relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-shimmer-delayed"></div>
          </div>
        ) : likePending ? (
          <div className="animate-spin rounded-full h-3 w-3 xl:h-4 xl:w-4 border-b-2 border-white mr-1" />
        ) : isLiked ? (
          <HeartFilled
            style={{
              color: likeHover ? "#F93822" : "red",
              fontSize: "16px",
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
              fontSize: "16px",
            }}
            className="pb-1 cursor-pointer transition-all duration-200"
            onMouseEnter={() => setLikeHover(true)}
            onMouseLeave={() => setLikeHover(false)}
            onClick={handleLikeClick}
          />
        )}

        {isLoading ? (
          <div className="w-4 h-4 xl:w-5 xl:h-5 bg-gradient-to-r from-white/10 via-white/20 to-white/10 backdrop-blur-md border border-white/20 rounded-sm relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-shimmer-delayed-2"></div>
          </div>
        ) : (
          <div className="relative" ref={ellipsisRef}>
            <EllipsisOutlined
              style={{ color: "white", fontSize: "16px" }}
              className="cursor-pointer transition-all duration-200 hover:scale-110"
              onMouseEnter={() => setEllipsisHover(true)}
              onMouseLeave={() => setEllipsisHover(false)}
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

  return isMobile ? <MobileLayout /> : <DesktopLayout />;
}
