// ProfilePlaylistTemplate.tsx - Enhanced responsive design
import { type FC, memo, useCallback } from "react";
import type { Playlist } from "../../../types/Playlist";
import { Link } from "react-router-dom";
import PlayListDefaultImage from "../../../images/Playlist/playlistDef.png";

/**
 * Playlist Card Template - Responsive design with enhanced UX
 *
 * RESPONSIVE FEATURES:
 * - Adaptive card sizes for different screen breakpoints
 * - Mobile-optimized layout with proper touch targets
 * - Responsive typography and spacing
 * - Flexible image containers with aspect ratio preservation
 *
 * DESIGN IMPROVEMENTS:
 * - Enhanced hover states with smooth animations
 * - Better loading states with realistic skeletons
 * - Improved accessibility with comprehensive labels
 * - Optimized image handling with fallbacks
 *
 * PERFORMANCE OPTIMIZATIONS:
 * - Memoized data calculations for efficiency
 * - Lazy loading with proper error handling
 * - Efficient DOM updates with minimal re-renders
 * - Smart content formatting with caching
 */

interface ProfilePlaylistTemplateProps {
  playlist: Playlist;
  isLoading?: boolean;
}

const ProfilePlaylistTemplate: FC<ProfilePlaylistTemplateProps> = ({
  playlist,
  isLoading = false,
}) => {
  /**
   * Memoized playlist info calculation
   */
  const getPlaylistInfo = useCallback(() => {
    const trackCount = playlist.trackCount || playlist.tracks?.length || 0;
    const privacy = playlist.privacy || "public";

    const formatTracks = (count: number) => {
      return count === 1 ? "1 track" : `${count.toLocaleString()} tracks`;
    };

    return {
      trackCount: formatTracks(trackCount),
      privacy: privacy.charAt(0).toUpperCase() + privacy.slice(1),
    };
  }, [playlist.trackCount, playlist.tracks, playlist.privacy]);

  /**
   * Handle image loading errors with fallback
   */
  const handleImageError = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const target = e.currentTarget;
      target.style.display = "none";

      // Show fallback container
      const fallback = target.nextElementSibling as HTMLElement;
      if (fallback) {
        fallback.style.display = "flex";
      }
    },
    []
  );

  // Loading state with responsive skeleton
  if (isLoading) {
    return (
      <div
        className="w-28 sm:w-32 md:w-36 lg:w-40 animate-pulse"
        role="listitem"
        aria-label="Loading playlist"
      >
        {/* Cover skeleton */}
        <div className="w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36 lg:w-40 lg:h-40 bg-gradient-to-br from-white/10 via-white/20 to-white/5 rounded-lg relative overflow-hidden mb-3">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-shimmer" />
        </div>

        {/* Title skeleton */}
        <div className="h-4 sm:h-5 w-20 sm:w-24 mx-auto bg-gradient-to-r from-white/10 via-white/20 to-white/10 rounded-md relative overflow-hidden mb-2">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-shimmer-delayed" />
        </div>

        {/* Metadata skeleton */}
        <div className="h-3 w-16 sm:w-20 mx-auto bg-gradient-to-r from-white/8 via-white/15 to-white/8 rounded-md relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -skew-x-12 animate-shimmer-delayed-2" />
        </div>
      </div>
    );
  }

  const playlistInfo = getPlaylistInfo();

  return (
    <article
      className="w-28 sm:w-32 md:w-36 lg:w-40 hover:scale-105 transition-all duration-300 group"
      role="listitem"
    >
      {/* Playlist cover with responsive sizing */}
      <Link
        to={`/playlist/${playlist._id}`}
        className="block focus:outline-none focus:ring-2 focus:ring-white/20 rounded-lg mb-3"
        aria-label={`View playlist ${playlist.name}`}
      >
        <div className="relative overflow-hidden rounded-lg">
          {playlist.coverUrl ? (
            <>
              <img
                src={playlist.coverUrl}
                alt={`${playlist.name} playlist cover`}
                className="w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36 lg:w-40 lg:h-40 rounded-lg object-cover transition-transform duration-300 group-hover:scale-105"
                onError={handleImageError}
                loading="lazy"
              />
              {/* Fallback default image (hidden by default) */}
              <div className="w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36 lg:w-40 lg:h-40 rounded-lg bg-gradient-to-br from-gray-600 to-gray-800 items-center justify-center hidden absolute inset-0">
                <img
                  src={PlayListDefaultImage}
                  alt="Default playlist cover"
                  className="w-full h-full rounded-lg object-cover"
                  loading="lazy"
                />
              </div>
            </>
          ) : (
            <div className="w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36 lg:w-40 lg:h-40 rounded-lg bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center">
              <img
                src={PlayListDefaultImage}
                alt="Default playlist cover"
                className="w-full h-full rounded-lg object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
            </div>
          )}

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 rounded-lg" />
        </div>
      </Link>

      {/* Playlist title */}
      <Link
        to={`/playlist/${playlist._id}`}
        className="block focus:outline-none focus:ring-2 focus:ring-white/20 rounded mb-2"
      >
        <h3 className="text-xs sm:text-sm lg:text-base text-white truncate hover:underline transition-colors duration-200 text-center font-medium">
          {playlist.name || "Unknown Playlist"}
        </h3>
      </Link>

      {/* Playlist metadata */}
      <div className="flex flex-col items-center text-white/60 text-xs sm:text-sm space-y-1">
        <span className="truncate text-center w-full">
          {playlistInfo.trackCount}
        </span>

        <div className="flex items-center gap-1">
          <div
            className="w-1 h-1 bg-white/70 rounded-full flex-shrink-0"
            aria-hidden="true"
          />
          <span className="text-center">{playlistInfo.privacy}</span>
        </div>
      </div>

      {/* Screen reader content */}
      <div className="sr-only">
        {playlist.owner && (
          <span>
            by{" "}
            {typeof playlist.owner === "string"
              ? playlist.owner
              : playlist.owner.name || playlist.owner.username}
          </span>
        )}
        {playlist.description && (
          <span>, Description: {playlist.description}</span>
        )}
        {playlist.category && <span>, Category: {playlist.category}</span>}
      </div>
    </article>
  );
};

export default memo(ProfilePlaylistTemplate);
