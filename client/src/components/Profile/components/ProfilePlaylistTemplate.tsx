import { type FC, memo, useCallback } from "react";
import type { Playlist } from "../../../types/Playlist";
import { Link } from "react-router-dom";
import PlayListDefaultImage from "../../../images/Playlist/playlistDef.png";

interface ProfilePlaylistTemplateProps {
  playlist: Playlist;
  isLoading?: boolean;
}

/**
 * Playlist card component for profile page
 * Features responsive design, loading states, and accessibility support
 */
const ProfilePlaylistTemplate: FC<ProfilePlaylistTemplateProps> = ({
  playlist,
  isLoading = false,
}) => {
  /**
   * Get display text for playlist metadata
   */
  const getPlaylistInfo = useCallback(() => {
    const trackCount = playlist.trackCount || playlist.tracks?.length || 0;
    const privacy = playlist.privacy || "public";

    return {
      trackCount: trackCount === 1 ? "1 track" : `${trackCount} tracks`,
      privacy: privacy.charAt(0).toUpperCase() + privacy.slice(1),
    };
  }, [playlist]);

  /**
   * Handle image loading errors gracefully
   */
  const handleImageError = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      e.currentTarget.style.display = "none";
    },
    []
  );

  // Render loading state
  if (isLoading) {
    return (
      <div
        className="max-w-[140px] sm:max-w-[165px] animate-pulse"
        role="listitem"
      >
        {/* Playlist cover skeleton */}
        <div className="w-[140px] h-[140px] sm:w-[160px] sm:h-[160px] bg-gradient-to-br from-white/10 via-white/20 to-white/5 backdrop-blur-md border border-white/20 rounded-lg relative overflow-hidden mb-2">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-shimmer"></div>
        </div>

        {/* Title skeleton */}
        <div className="h-4 sm:h-5 w-24 sm:w-32 bg-gradient-to-r from-white/10 via-white/20 to-white/10 backdrop-blur-md border border-white/20 rounded-md relative overflow-hidden mb-1">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-shimmer-delayed"></div>
        </div>

        {/* Metadata skeleton */}
        <div className="h-3 w-20 bg-gradient-to-r from-white/8 via-white/15 to-white/8 backdrop-blur-md border border-white/15 rounded-md relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -skew-x-12 animate-shimmer-delayed-2"></div>
        </div>
      </div>
    );
  }

  const playlistInfo = getPlaylistInfo();

  return (
    <article
      className="max-w-[140px] sm:max-w-[165px] hover:scale-105 transition-all duration-300 group"
      role="listitem"
    >
      {/* Playlist cover with link */}
      <Link
        to={`/playlist/${playlist._id}`}
        className="block focus:outline-none focus:ring-2 focus:ring-white/20 rounded-lg"
        aria-label={`View playlist ${playlist.name}`}
      >
        <div className="relative overflow-hidden rounded-lg">
          {playlist.coverUrl ? (
            <img
              src={playlist.coverUrl}
              alt={`${playlist.name} playlist cover`}
              className="w-[140px] h-[140px] sm:w-[160px] sm:h-[160px] mb-1 rounded-lg cursor-pointer object-cover transition-transform duration-300 group-hover:scale-105"
              onError={handleImageError}
              loading="lazy"
            />
          ) : (
            <div className="w-[140px] h-[140px] sm:w-[160px] sm:h-[160px] mb-1 rounded-lg bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center">
              <img
                src={PlayListDefaultImage}
                alt="Default playlist cover"
                className="w-[140px] h-[140px] sm:w-[160px] sm:h-[160px] mb-1 rounded-lg cursor-pointer object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
            </div>
          )}

          {/* Overlay for better accessibility */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 rounded-lg" />
        </div>
      </Link>

      {/* Playlist title */}
      <Link
        to={`/playlist/${playlist._id}`}
        className="block focus:outline-none focus:ring-2 focus:ring-white/20 rounded"
      >
        <h3 className="text-sm sm:text-lg text-white truncate cursor-pointer hover:underline transition-colors duration-200 mb-1">
          {playlist.name || "Unknown Playlist"}
        </h3>
      </Link>

      {/* Playlist metadata */}
      <div className="flex items-center text-white/60 gap-2 text-xs sm:text-sm">
        <span className="truncate">{playlistInfo.trackCount}</span>

        <div
          className="w-[4px] h-[4px] sm:w-[5px] sm:h-[5px] bg-white/70 rounded-full flex-shrink-0"
          aria-hidden="true"
        />

        <span className="flex-shrink-0">{playlistInfo.privacy}</span>
      </div>

      {/* Additional metadata for screen readers */}
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
