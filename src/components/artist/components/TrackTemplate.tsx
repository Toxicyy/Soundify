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

interface TrackTemplateProps {
  track: Track;
  index: number;
  isLoading?: boolean;
  allTracks?: Track[];
}

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

  /**
   * Handle context menu item actions
   */
  const handleMenuItemClick = useCallback(
    (index: number) => {
      const menuActions = [
        () => handleLikeClick({} as React.MouseEvent),
        handleAddToQueue,
        () => console.log("Hide track clicked"),
        () => console.log("Artist clicked"),
        () => console.log("Album clicked"),
        () => console.log("Info clicked"),
        () => console.log("Share clicked"),
      ];

      if (index < menuActions.length) {
        menuActions[index]();
        setIsMenuOpen(false);
      }
    },
    [handleLikeClick, handleAddToQueue]
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
    return (
      <div
        className="grid grid-cols-[50px_1.47fr_1fr_0.1fr_0.1fr_40px] gap-2 sm:gap-4 items-center px-2 sm:px-4 py-3 rounded-lg"
        role="listitem"
        aria-label="Loading track"
      >
        {/* Track number skeleton */}
        <div className="h-6 w-6 bg-gradient-to-r from-white/10 via-white/20 to-white/10 backdrop-blur-md border border-white/20 rounded-md relative overflow-hidden mx-auto">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-shimmer"></div>
        </div>

        {/* Track info skeleton */}
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <div className="w-[50px] h-[50px] sm:w-[65px] sm:h-[65px] bg-gradient-to-br from-white/10 via-white/20 to-white/5 backdrop-blur-md border border-white/20 rounded-lg relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-shimmer"></div>
          </div>
          <div className="flex flex-col justify-center gap-2 min-w-0 flex-1">
            <div className="h-4 sm:h-5 w-24 sm:w-36 bg-gradient-to-r from-white/10 via-white/20 to-white/10 backdrop-blur-md border border-white/20 rounded-md relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-shimmer-delayed"></div>
            </div>
            <div className="h-3 sm:h-4 w-16 sm:w-24 bg-gradient-to-r from-white/8 via-white/15 to-white/8 backdrop-blur-md border border-white/15 rounded-md relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -skew-x-12 animate-shimmer-delayed-2"></div>
            </div>
          </div>
        </div>

        {/* Listen count skeleton */}
        <div className="flex justify-center">
          <div className="h-4 w-12 sm:w-16 bg-gradient-to-r from-white/8 via-white/15 to-white/8 backdrop-blur-md border border-white/15 rounded-md relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -skew-x-12 animate-shimmer"></div>
          </div>
        </div>

        {/* Like button skeleton */}
        <div className="flex justify-center">
          <div className="w-4 h-4 sm:w-5 sm:h-5 bg-gradient-to-r from-white/10 via-white/20 to-white/10 backdrop-blur-md border border-white/20 rounded-full relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-shimmer-delayed-2"></div>
          </div>
        </div>

        {/* Duration skeleton */}
        <div className="flex justify-center">
          <div className="h-4 w-8 bg-gradient-to-r from-white/8 via-white/15 to-white/8 backdrop-blur-md border border-white/15 rounded-md relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -skew-x-12 animate-shimmer"></div>
          </div>
        </div>

        {/* Menu button skeleton */}
        <div className="flex justify-center">
          <div className="w-4 h-4 sm:w-5 sm:h-5 bg-gradient-to-r from-white/10 via-white/20 to-white/10 backdrop-blur-md border border-white/20 rounded-sm relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-shimmer-delayed"></div>
          </div>
        </div>
      </div>
    );
  }

  // Main track component render
  return (
    <div
      className="grid grid-cols-[50px_1.47fr_1fr_0.1fr_0.1fr_40px] gap-2 sm:gap-4 items-center px-2 sm:px-4 hover:bg-white/5 rounded-lg transition-colors duration-200 group cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={playTrackWithContext}
      role="listitem"
      aria-label={`${track.name} by ${
        typeof track.artist === "string" ? track.artist : track.artist?.name
      }`}
    >
      {/* Track number */}
      <div
        className={`text-lg sm:text-2xl text-center transition-colors duration-200 ${
          isThisTrackPlaying ? "text-white" : "text-white/50"
        }`}
        aria-label={`Track ${index + 1}`}
      >
        {index + 1}
      </div>

      {/* Track information and cover */}
      <div className="flex items-center gap-2 sm:gap-4 min-w-0">
        <div className="w-[50px] h-[50px] sm:w-[65px] sm:h-[65px] rounded-lg flex items-center justify-center relative overflow-hidden group/cover">
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
          <h3 className="text-sm sm:text-lg font-medium truncate transition-colors text-white group-hover:text-white/90">
            {track.name}
          </h3>
          <p className="text-sm sm:text-lg text-white/60 truncate">
            {typeof track.artist === "string"
              ? track.artist
              : track.artist?.name}
          </p>
        </div>
      </div>

      {/* Listen count */}
      <div className="text-sm sm:text-lg text-white/60 truncate text-center">
        {track.listenCount?.toLocaleString() || "0"}
      </div>

      {/* Like button */}
      <div
        className="flex justify-center transition-opacity duration-300"
        style={{ opacity: isHovered || isLiked ? 1 : 0 }}
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
                  fontSize: "16px",
                }}
              />
            ) : (
              <HeartOutlined
                style={{
                  color: isLikeHovered ? "#D3D3D3" : "rgba(255, 255, 255, 0.6)",
                  fontSize: "16px",
                }}
              />
            )}
          </button>
        )}
      </div>

      {/* Duration */}
      <div className="text-sm sm:text-lg text-white/60 text-center">
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
              fontSize: "16px",
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
