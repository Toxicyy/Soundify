import { useRef, useState, type FC, useCallback, memo } from "react";
import type { Track } from "../../../types/TrackData";
import { useFormatTime } from "../../../hooks/useFormatTime";
import { useLike } from "../../../hooks/useLike";
import {
  HeartFilled,
  HeartOutlined,
  EllipsisOutlined,
  CaretRightOutlined,
  PauseOutlined,
} from "@ant-design/icons";
import ContextMenu from "../../mainPage/mainMenu/components/ContextMenu";
import type { AppDispatch, AppState } from "../../../store";
import { useDispatch, useSelector } from "react-redux";
import { addToQueue, playTrackAndQueue } from "../../../state/Queue.slice";
import {
  setCurrentTrack,
  setIsPlaying,
} from "../../../state/CurrentTrack.slice";
import { useNavigate } from "react-router-dom";
import { useNotification } from "../../../hooks/useNotification";

interface TrackTemplateProps {
  track: Track;
  index: number;
  isLoading?: boolean;
  allTracks?: Track[];
}

/**
 * Skeleton component that perfectly matches the track layout
 */
const TrackSkeleton = () => {
  return (
    <>
      {/* Desktop Skeleton (xl and above) */}
      <div className="hidden xl:grid grid-cols-[50px_1.47fr_1.57fr_0.8fr_50px_80px_50px] gap-4 items-center px-4 py-3 hover:bg-white/5 transition-colors duration-200 rounded-lg group animate-pulse">
        {/* Track Number */}
        <div className="text-center">
          <div className="h-6 w-6 bg-gradient-to-br from-white/10 via-white/20 to-white/5 rounded mx-auto"></div>
        </div>

        {/* Track Info */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-white/10 via-white/20 to-white/5 rounded-lg flex-shrink-0 relative overflow-hidden">
            <div className="absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer"></div>
          </div>
          <div className="flex flex-col gap-2 flex-1 min-w-0">
            <div className="h-4 bg-gradient-to-br from-white/10 via-white/20 to-white/5 rounded w-3/4 relative overflow-hidden">
              <div className="absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer"></div>
            </div>
            <div className="h-3 bg-gradient-to-br from-white/10 via-white/20 to-white/5 rounded w-1/2 relative overflow-hidden">
              <div className="absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer"></div>
            </div>
          </div>
        </div>

        {/* Album */}
        <div className="text-center">
          <div className="h-4 bg-gradient-to-br from-white/10 via-white/20 to-white/5 rounded w-2/3 mx-auto relative overflow-hidden">
            <div className="absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer"></div>
          </div>
        </div>

        {/* Date Added */}
        <div className="text-center">
          <div className="h-4 bg-gradient-to-br from-white/10 via-white/20 to-white/5 rounded w-16 mx-auto relative overflow-hidden">
            <div className="absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer"></div>
          </div>
        </div>

        {/* Like Button */}
        <div className="text-center">
          <div className="w-4 h-4 bg-gradient-to-br from-white/10 via-white/20 to-white/5 rounded-full mx-auto relative overflow-hidden">
            <div className="absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer"></div>
          </div>
        </div>

        {/* Duration */}
        <div className="text-center">
          <div className="h-4 bg-gradient-to-br from-white/10 via-white/20 to-white/5 rounded w-12 mx-auto relative overflow-hidden">
            <div className="absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer"></div>
          </div>
        </div>

        {/* More Options */}
        <div className="text-center">
          <div className="w-4 h-4 bg-gradient-to-br from-white/10 via-white/20 to-white/5 rounded mx-auto relative overflow-hidden">
            <div className="absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer"></div>
          </div>
        </div>
      </div>

      {/* Mobile/Tablet Skeleton (below xl) */}
      <div className="xl:hidden grid grid-cols-[10px_1.47fr_1fr_0.1fr_0.1fr_40px] md:grid-cols-[20px_1.47fr_1fr_0.1fr_0.1fr_40px] gap-2 sm:gap-4 items-center px-2 sm:px-4 py-3 hover:bg-white/5 transition-colors duration-200 rounded-lg group animate-pulse">
        {/* Track Number */}
        <div className="text-center">
          <div className="h-4 w-3 md:h-5 md:w-4 bg-gradient-to-br from-white/10 via-white/20 to-white/5 rounded mx-auto relative overflow-hidden">
            <div className="absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer"></div>
          </div>
        </div>

        {/* Track Info */}
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <div className="w-[50px] h-[50px] sm:w-[65px] sm:h-[65px] bg-gradient-to-br from-white/10 via-white/20 to-white/5 rounded-lg flex-shrink-0 relative overflow-hidden">
            <div className="absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer"></div>
          </div>
          <div className="flex flex-col justify-center gap-2 min-w-0 flex-1">
            <div className="h-3 sm:h-4 bg-gradient-to-br from-white/10 via-white/20 to-white/5 rounded w-24 sm:w-36 relative overflow-hidden">
              <div className="absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer"></div>
            </div>
            <div className="h-3 sm:h-4 bg-gradient-to-br from-white/10 via-white/20 to-white/5 rounded w-16 sm:w-24 relative overflow-hidden">
              <div className="absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer"></div>
            </div>
          </div>
        </div>

        {/* Listen Count */}
        <div className="text-center">
          <div className="h-3 sm:h-4 bg-gradient-to-br from-white/10 via-white/20 to-white/5 rounded w-8 sm:w-12 mx-auto relative overflow-hidden">
            <div className="absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer"></div>
          </div>
        </div>

        {/* Like Button */}
        <div className="flex justify-center">
          <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gradient-to-br from-white/10 via-white/20 to-white/5 rounded-full relative overflow-hidden">
            <div className="absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer"></div>
          </div>
        </div>

        {/* Duration */}
        <div className="text-center">
          <div className="h-3 sm:h-4 bg-gradient-to-br from-white/10 via-white/20 to-white/5 rounded w-6 sm:w-8 mx-auto relative overflow-hidden">
            <div className="absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer"></div>
          </div>
        </div>

        {/* Menu Button */}
        <div className="flex justify-center">
          <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gradient-to-br from-white/10 via-white/20 to-white/5 rounded relative overflow-hidden">
            <div className="absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer"></div>
          </div>
        </div>
      </div>
    </>
  );
};

/**
 * Individual track component with play controls, like functionality, and context menu
 * Supports loading states, responsive design, and comprehensive user interactions
 */
const TrackTemplate: FC<TrackTemplateProps> = ({
  track,
  index,
  isLoading = false,
  allTracks = [],
}) => {
  // Local state
  const [isHovered, setIsHovered] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLikeHovered, setIsLikeHovered] = useState(false);

  // Refs
  const ellipsisRef = useRef<HTMLDivElement>(null);

  // Redux state
  const dispatch = useDispatch<AppDispatch>();
  const currentTrack = useSelector((state: AppState) => state.currentTrack);

  // Computed values
  const isCurrentTrack = currentTrack.currentTrack?._id === track?._id;
  const isThisTrackPlaying = isCurrentTrack && currentTrack.isPlaying;
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();

  // Custom hooks
  const duration = useFormatTime(track?.duration || 0);
  const {
    isLiked,
    isPending: likePending,
    toggleLike,
  } = useLike(isLoading ? "" : track._id);

  // Event handlers
  /**
   * Play track with full context queue
   */
  const playTrackWithContext = useCallback(() => {
    if (!track || isLoading) return;

    if (allTracks?.length > 0) {
      dispatch(
        playTrackAndQueue({
          contextTracks: allTracks,
          startIndex: index,
        })
      );
    } else {
      dispatch(setCurrentTrack(track));
      dispatch(setIsPlaying(true));
    }
  }, [track, isLoading, allTracks, index, dispatch]);

  /**
   * Toggle play/pause for current track or start new track
   */
  const togglePlayPause = useCallback(() => {
    if (!track || isLoading) return;

    if (isCurrentTrack) {
      dispatch(setIsPlaying(!currentTrack.isPlaying));
    } else {
      playTrackWithContext();
    }
  }, [
    track,
    isLoading,
    isCurrentTrack,
    currentTrack.isPlaying,
    playTrackWithContext,
    dispatch,
  ]);

  /**
   * Handle context menu toggle
   */
  const handleEllipsisClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsMenuOpen(!isMenuOpen);
    },
    [isMenuOpen]
  );

  /**
   * Handle like button click with loading state
   */
  const handleLikeClick = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!isLoading && !likePending) {
        await toggleLike();
      }
    },
    [isLoading, likePending, toggleLike]
  );

  /**
   * Add track to queue
   */
  const handleAddToQueue = useCallback(() => {
    if (!track || isLoading) return;
    dispatch(addToQueue(track));
  }, [track, isLoading, dispatch]);

  const handleArtistClick = () => {
    if (!track) return;
    navigate(`/artist/${track.artist._id}`);
  };

  const handleAlbumClick = () => {
    if (!track) return;
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

      // Check support for Web Share API (for mobile devices)
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
      // Handle errors
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

  /**
   * Handle context menu item actions
   */
  const handleMenuItemClick = useCallback(
    (index: number) => {
      const menuActions = [
        () => handleLikeClick({} as React.MouseEvent),
        handleAddToQueue,
        handleArtistClick,
        handleAlbumClick,
        handleInfoClick,
        handleShareClick,
      ];

      if (index < menuActions.length) {
        menuActions[index]();
        setIsMenuOpen(false);
      }
    },
    [handleLikeClick, handleAddToQueue, handleArtistClick, handleAlbumClick, handleInfoClick, handleShareClick]
  );

  /**
   * Handle image loading errors
   */
  const handleImageError = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      e.currentTarget.style.display = "none";
    },
    []
  );

  // Render skeleton loading state
  if (isLoading) {
    return <TrackSkeleton />;
  }

  // Main track component render
  return (
    <div
      className="grid grid-cols-[10px_1.47fr_1fr_0.1fr_0.1fr_40px] md:grid-cols-[20px_1.47fr_1fr_0.1fr_0.1fr_40px] xl:grid-cols-[50px_1.47fr_1.57fr_0.8fr_50px_80px_50px] gap-2 sm:gap-4 items-center px-2 sm:px-4 py-3 hover:bg-white/5 rounded-lg transition-colors duration-200 group cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={isMenuOpen ? () => {} : playTrackWithContext}
      role="listitem"
      aria-label={`${track.name} by ${
        typeof track.artist === "string" ? track.artist : track.artist?.name
      }`}
    >
      {/* Track number */}
      <div
        className={`text-sm sm:text-lg xl:text-2xl text-center transition-colors duration-200 ${
          isThisTrackPlaying ? "text-white" : "text-white/50"
        }`}
        aria-label={`Track ${index + 1}`}
      >
        {index + 1}
      </div>

      {/* Track information and cover */}
      <div className="flex items-center gap-2 sm:gap-4 min-w-0">
        <div className="w-[50px] h-[50px] sm:w-[65px] sm:h-[65px] xl:w-12 xl:h-12 rounded-lg flex items-center justify-center relative overflow-hidden group/cover">
          {/* Track cover image */}
          <img
            src={track?.coverUrl}
            alt={`${track?.name} cover`}
            className="w-full h-full object-cover rounded-lg transition-opacity duration-200"
            onError={handleImageError}
            loading="lazy"
          />

          {/* Play/pause overlay on hover */}
          <div
            className={`absolute inset-0 transition-opacity duration-200 bg-black rounded-lg ${
              isHovered ? "opacity-50" : "opacity-0"
            }`}
            style={{ zIndex: 20 }}
            aria-hidden="true"
          />

          {/* Play/pause button */}
          {isHovered && (
            <button
              className="absolute inset-0 flex items-center justify-center z-30 focus:outline-none focus:ring-2 focus:ring-white/20 rounded-lg"
              onClick={(e) => {
                e.stopPropagation();
                togglePlayPause();
              }}
              aria-label={isThisTrackPlaying ? "Pause track" : "Play track"}
            >
              {isThisTrackPlaying ? (
                <PauseOutlined
                  style={{
                    color: "white",
                    fontSize: "28px",
                    filter: "drop-shadow(0 2px 8px #222)",
                  }}
                />
              ) : (
                <CaretRightOutlined
                  style={{
                    color: "white",
                    fontSize: "32px",
                    filter: "drop-shadow(0 2px 8px #222)",
                  }}
                />
              )}
            </button>
          )}
        </div>

        {/* Track title and artist */}
        <div className="flex flex-col justify-center min-w-0 flex-1">
          <h3 className="text-sm sm:text-lg xl:text-base font-medium truncate transition-colors text-white group-hover:text-white/90">
            {track.name}
          </h3>
          <p className="text-sm sm:text-lg xl:text-base text-white/60 truncate">
            {typeof track.artist === "string"
              ? track.artist
              : track.artist?.name}
          </p>
        </div>
      </div>

      {/* Album (Desktop only) */}
      <div className="hidden xl:block text-center">
        <p className="text-base text-white/60 truncate">
          {track.album === "single" ? "Single" : track.album?.name || "Unknown"}
        </p>
      </div>

      {/* Date Added (Desktop only) */}
      <div className="hidden xl:block text-center">
        <p className="text-base text-white/60">
          {new Date(track.createdAt || Date.now()).toLocaleDateString()}
        </p>
      </div>

      {/* Listen count (Mobile/Tablet) OR Like button space (Desktop) */}
      <div className="xl:hidden text-sm sm:text-lg text-white/60 truncate text-center">
        {track.listenCount?.toLocaleString() || "0"}
      </div>

      {/* Like button */}
      <div className="flex justify-center transition-opacity duration-300">
        <div
          style={{ 
            opacity: isHovered || isLiked ? 1 : (window.innerWidth >= 1280 ? 0 : 1)
          }}
        >
          {likePending ? (
            <div
              className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-white"
              aria-label="Loading like status"
            />
          ) : (
            <button
              onClick={handleLikeClick}
              onMouseEnter={() => setIsLikeHovered(true)}
              onMouseLeave={() => setIsLikeHovered(false)}
              className="transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/20 rounded-full p-1"
              aria-label={isLiked ? "Unlike track" : "Like track"}
            >
              {isLiked ? (
                <HeartFilled
                  style={{
                    color: isLikeHovered ? "#F93822" : "red",
                    fontSize: window.innerWidth >= 1280 ? "16px" : "14px",
                  }}
                />
              ) : (
                <HeartOutlined
                  style={{
                    color: isLikeHovered ? "#D3D3D3" : "rgba(255, 255, 255, 0.6)",
                    fontSize: window.innerWidth >= 1280 ? "16px" : "14px",
                  }}
                />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Duration */}
      <div className="text-sm sm:text-lg xl:text-base text-white/60 text-center">
        {duration}
      </div>

      {/* Context menu */}
      <div className="flex justify-center relative" ref={ellipsisRef}>
        <button
          onClick={handleEllipsisClick}
          className="transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/20 rounded-full p-1"
          style={{
            opacity: isHovered ? 1 : 0,
          }}
          aria-label="Track options"
          aria-expanded={isMenuOpen}
          aria-haspopup="menu"
        >
          <EllipsisOutlined
            style={{
              color: "rgba(255, 255, 255, 1)",
              fontSize: window.innerWidth >= 1280 ? "16px" : "14px",
            }}
          />
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
  );
};

export default memo(TrackTemplate);