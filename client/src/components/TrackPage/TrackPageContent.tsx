import { useRef, useState, useCallback, memo } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  HeartFilled,
  HeartOutlined,
  EllipsisOutlined,
  CaretRightOutlined,
  PauseOutlined,
  CalendarOutlined,
  PlayCircleOutlined,
} from "@ant-design/icons";
import { useLike } from "../../hooks/useLike";
import { useFormatTime } from "../../hooks/useFormatTime";
import { useNotification } from "../../hooks/useNotification";
import ContextMenu from "../../components/mainPage/mainMenu/components/ContextMenu";
import type { AppDispatch, AppState } from "../../store";
import { setIsPlaying } from "../../state/CurrentTrack.slice";
import { playTrackAndQueue } from "../../state/Queue.slice";
import type { Track } from "../../types/TrackData";

interface TrackPageContentProps {
  track: Track;
}

/**
 * Track page content component with detailed track information
 */
const TrackPageContent = ({ track }: TrackPageContentProps) => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  // Local state
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLikeHovered, setIsLikeHovered] = useState(false);

  // Refs
  const ellipsisRef = useRef<HTMLDivElement>(null);

  // Redux state
  const currentTrack = useSelector((state: AppState) => state.currentTrack);

  // Custom hooks
  const { isLiked, isPending: likePending, toggleLike } = useLike(track._id);
  const { showSuccess, showError } = useNotification();

  // Computed values
  const isCurrentTrack = currentTrack.currentTrack?._id === track._id;
  const isThisTrackPlaying = isCurrentTrack && currentTrack.isPlaying;
  const duration = useFormatTime(track.duration || 0);

  // Event handlers
  const handlePlayClick = useCallback(() => {
    if (isCurrentTrack) {
      dispatch(setIsPlaying(!currentTrack.isPlaying));
    } else {
      dispatch(playTrackAndQueue({ track, contextTracks: [track] }));
    }
  }, [track, isCurrentTrack, currentTrack.isPlaying, dispatch]);

  const handleLikeClick = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!likePending) {
        await toggleLike();
      }
    },
    [likePending, toggleLike]
  );

  const handleEllipsisClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsMenuOpen(!isMenuOpen);
    },
    [isMenuOpen]
  );

  const handleArtistClick = useCallback(() => {
    const artistId =
      typeof track.artist === "string" ? track.artist : track.artist?._id;
    if (artistId) {
      navigate(`/artist/${artistId}`);
    }
  }, [track, navigate]);

  const handleAlbumClick = useCallback(() => {
    if (track.album === "single") {
      navigate(`/single/${track._id}`);
    } else if (typeof track.album === "object" && track.album._id) {
      navigate(`/album/${track.album._id}`);
    }
  }, [track, navigate]);

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

  const handleMenuItemClick = useCallback(
    (index: number) => {
      const menuActions = [
        () => handleLikeClick({} as React.MouseEvent),
        () => {}, // Add to queue
        handleArtistClick,
        handleAlbumClick,
        () => {}, // Info - already on info page
        handleShareClick,
      ];

      if (index < menuActions.length) {
        menuActions[index]();
        setIsMenuOpen(false);
      }
    },
    [handleLikeClick, handleArtistClick, handleAlbumClick, handleShareClick]
  );

  const handleImageError = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      e.currentTarget.style.display = "none";
    },
    []
  );

  const formatDate = (dateString: string | Date) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return "Unknown date";
    }
  };

  const artistName =
    typeof track.artist === "string" ? track.artist : track.artist?.name;

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 sm:p-8 border border-white/20">
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
        {/* Track Cover */}
        <div className="w-full max-w-[250px] sm:max-w-[300px] mx-auto lg:mx-0">
          <div className="aspect-square rounded-lg overflow-hidden bg-white/5 border border-white/10 shadow-lg">
            <img
              src={track.coverUrl}
              alt={`${track.name} cover`}
              className="w-full h-full object-cover"
              onError={handleImageError}
              loading="lazy"
            />
          </div>
        </div>

        {/* Track Information */}
        <div className="flex-1 flex flex-col gap-6 w-full">
          {/* Title and Artist */}
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight">
              {track.name}
            </h1>
            <button
              onClick={handleArtistClick}
              className="text-lg sm:text-2xl text-white/80 hover:text-white transition-colors duration-200 text-left"
            >
              {artistName}
            </button>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4">
            {/* Play Button */}
            <button
              onClick={handlePlayClick}
              className="w-14 h-14 sm:w-16 sm:h-16 bg-white hover:bg-white/90 rounded-full flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/20 shadow-lg"
              aria-label={isThisTrackPlaying ? "Pause track" : "Play track"}
            >
              {isThisTrackPlaying ? (
                <PauseOutlined
                  style={{
                    color: "black",
                    fontSize: "24px",
                  }}
                />
              ) : (
                <CaretRightOutlined
                  style={{
                    color: "black",
                    fontSize: "28px",
                    marginLeft: "2px",
                  }}
                />
              )}
            </button>

            {/* Like Button */}
            <button
              onClick={handleLikeClick}
              onMouseEnter={() => setIsLikeHovered(true)}
              onMouseLeave={() => setIsLikeHovered(false)}
              disabled={likePending}
              className="transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/20 rounded-full p-2 disabled:opacity-50"
              aria-label={isLiked ? "Unlike track" : "Like track"}
            >
              {likePending ? (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white" />
              ) : isLiked ? (
                <HeartFilled
                  style={{
                    color: isLikeHovered ? "#F93822" : "red",
                    fontSize: "24px",
                  }}
                />
              ) : (
                <HeartOutlined
                  style={{
                    color: isLikeHovered
                      ? "#D3D3D3"
                      : "rgba(255, 255, 255, 0.6)",
                    fontSize: "24px",
                  }}
                />
              )}
            </button>

            {/* Context Menu */}
            <div className="relative" ref={ellipsisRef}>
              <button
                onClick={handleEllipsisClick}
                className="transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/20 rounded-full p-2 text-white/60 hover:text-white"
                aria-label="Track options"
                aria-expanded={isMenuOpen}
                aria-haspopup="menu"
              >
                <EllipsisOutlined style={{ fontSize: "20px" }} />
              </button>

              <ContextMenu
                isOpen={isMenuOpen}
                onClose={() => setIsMenuOpen(false)}
                onMenuItemClick={handleMenuItemClick}
                anchorRef={ellipsisRef}
                isPlaying={isCurrentTrack}
                isLiked={isLiked}
                isPending={likePending}
                usePortal={true}
              />
            </div>
          </div>

          {/* Track Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-white/80">
            {/* Album */}
            <div className="space-y-1">
              <div className="text-sm text-white/50 uppercase tracking-wide">
                Album
              </div>
              <div className="text-base">
                {track.album === "single" ? (
                  <span className="text-white/70">Single</span>
                ) : typeof track.album === "object" && track.album ? (
                  <button
                    onClick={handleAlbumClick}
                    className="hover:text-white transition-colors duration-200 text-left"
                  >
                    {track.album.name}
                  </button>
                ) : (
                  <span className="text-white/70">Unknown</span>
                )}
              </div>
            </div>

            {/* Duration */}
            <div className="space-y-1">
              <div className="text-sm text-white/50 uppercase tracking-wide">
                Duration
              </div>
              <div className="text-base">{duration}</div>
            </div>

            {/* Genre */}
            {track.genre && (
              <div className="space-y-1">
                <div className="text-sm text-white/50 uppercase tracking-wide">
                  Genre
                </div>
                <div className="text-base capitalize">{track.genre}</div>
              </div>
            )}

            {/* Release Date */}
            <div className="space-y-1">
              <div className="text-sm text-white/50 uppercase tracking-wide">
                Release Date
              </div>
              <div className="text-base flex items-center gap-2">
                <CalendarOutlined className="text-white/50" />
                {formatDate(track.createdAt)}
              </div>
            </div>

            {/* Listen Count */}
            <div className="space-y-1">
              <div className="text-sm text-white/50 uppercase tracking-wide">
                Plays
              </div>
              <div className="text-base flex items-center gap-2">
                <PlayCircleOutlined className="text-white/50" />
                {track.listenCount?.toLocaleString() || "0"}
              </div>
            </div>

            {/* Like Count */}
            <div className="space-y-1">
              <div className="text-sm text-white/50 uppercase tracking-wide">
                Likes
              </div>
              <div className="text-base flex items-center gap-2">
                <HeartOutlined className="text-white/50" />
                {track.likeCount?.toLocaleString() || "0"}
              </div>
            </div>
          </div>

          {/* Tags */}
          {track.tags && track.tags.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm text-white/50 uppercase tracking-wide">
                Tags
              </div>
              <div className="flex flex-wrap gap-2">
                {track.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-full text-sm text-white/80 transition-colors duration-200 border border-white/10"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Future: Recommendations section */}
      <div className="space-y-4 mt-8 pt-8 border-t border-white/10">
        <h3 className="text-xl font-semibold text-white">
          More like this track
        </h3>
        <div className="text-white/60 text-center py-8">
          Recommendations coming soon...
        </div>
      </div>
    </div>
  );
};

export default memo(TrackPageContent);
