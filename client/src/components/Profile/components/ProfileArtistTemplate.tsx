import { type FC, memo, useCallback } from "react";
import type { Artist } from "../../../types/ArtistData";
import { Link } from "react-router-dom";

interface ProfileArtistTemplateProps {
  artist: Artist;
  isLoading?: boolean;
}

/**
 * Artist card component for profile page
 * Features responsive design, loading states, and accessibility support
 */
const ProfileArtistTemplate: FC<ProfileArtistTemplateProps> = ({
  artist,
  isLoading = false,
}) => {
  /**
   * Get display text for artist metadata
   */
  const getArtistInfo = useCallback(() => {
    const followerCount = artist.followerCount || 0;
    const isVerified = artist.isVerified || false;

    return {
      followers:
        followerCount === 1
          ? "1 follower"
          : `${followerCount.toLocaleString()} followers`,
      isVerified,
    };
  }, [artist]);

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
        {/* Artist avatar skeleton */}
        <div className="w-[140px] h-[140px] sm:w-[160px] sm:h-[160px] bg-gradient-to-br from-white/10 via-white/20 to-white/5 backdrop-blur-md border border-white/20 rounded-full relative overflow-hidden mb-2">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-shimmer"></div>
        </div>

        {/* Name skeleton */}
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

  const artistInfo = getArtistInfo();

  return (
    <article
      className="max-w-[140px] sm:max-w-[165px] hover:scale-105 transition-all duration-300 group"
      role="listitem"
    >
      {/* Artist avatar with link */}
      <Link
        to={`/artist/${artist._id}`}
        className="block focus:outline-none focus:ring-2 focus:ring-white/20 rounded-full"
        aria-label={`View artist ${artist.name}`}
      >
        <div className="relative overflow-hidden rounded-full">
          {artist.avatar ? (
            <img
              src={artist.avatar}
              alt={`${artist.name} avatar`}
              className="w-[140px] h-[140px] sm:w-[160px] sm:h-[160px] mb-1 rounded-full cursor-pointer object-cover transition-transform duration-300 group-hover:scale-105"
              onError={handleImageError}
              loading="lazy"
            />
          ) : (
            <div className="w-[140px] h-[140px] sm:w-[160px] sm:h-[160px] mb-1 rounded-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center">
              <svg
                className="w-12 h-12 text-gray-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          )}

          {/* Overlay for better accessibility */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 rounded-full" />
        </div>
      </Link>

      {/* Artist name with verification badge */}
      <Link
        to={`/artist/${artist._id}`}
        className="block focus:outline-none focus:ring-2 focus:ring-white/20 rounded"
      >
        <div className="flex items-center justify-center gap-1 mb-1">
          <h3 className="text-sm sm:text-lg text-white truncate cursor-pointer hover:underline transition-colors duration-200 text-center">
            {artist.name || "Unknown Artist"}
          </h3>
          {artistInfo.isVerified && (
            <svg
              className="w-4 h-4 text-blue-400 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </div>
      </Link>

      {/* Artist metadata */}
      <div className="flex items-center justify-center text-white/60 gap-2 text-xs sm:text-sm">
        <span className="truncate text-center">{artistInfo.followers}</span>

        {artist.genres && artist.genres.length > 0 && (
          <>
            <div
              className="w-[4px] h-[4px] sm:w-[5px] sm:h-[5px] bg-white/70 rounded-full flex-shrink-0"
              aria-hidden="true"
            />
            <span className="flex-shrink-0 truncate">{artist.genres[0]}</span>
          </>
        )}
      </div>

      {/* Additional metadata for screen readers */}
      <div className="sr-only">
        {artist.bio && <span>Bio: {artist.bio}</span>}
        {artist.genres && artist.genres.length > 0 && (
          <span>, Genres: {artist.genres.join(", ")}</span>
        )}
        {artistInfo.isVerified && <span>, Verified artist</span>}
      </div>
    </article>
  );
};

export default memo(ProfileArtistTemplate);
