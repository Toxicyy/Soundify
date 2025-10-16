import { type FC, memo, useCallback, useMemo } from "react";
import type { Artist } from "../../../types/ArtistData";
import { Link } from "react-router-dom";

interface ProfileArtistTemplateProps {
  artist: Artist;
  isLoading?: boolean;
}

/**
 * Artist card component
 * Displays artist avatar, name, follower count, and genres
 */
const ProfileArtistTemplate: FC<ProfileArtistTemplateProps> = ({
  artist,
  isLoading = false,
}) => {
  const artistInfo = useMemo(() => {
    const followerCount = artist.followerCount || 0;
    const isVerified = artist.isVerified || false;

    const formatFollowers = (count: number) => {
      if (count >= 1000000) {
        return `${(count / 1000000).toFixed(1)}M followers`;
      }
      if (count >= 1000) {
        return `${(count / 1000).toFixed(1)}K followers`;
      }
      return count === 1 ? "1 follower" : `${count.toLocaleString()} followers`;
    };

    return {
      followers: formatFollowers(followerCount),
      isVerified,
    };
  }, [artist.followerCount, artist.isVerified]);

  const handleImageError = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const target = e.currentTarget;
      target.style.display = "none";

      const fallback = target.nextElementSibling as HTMLElement;
      if (fallback) {
        fallback.style.display = "flex";
      }
    },
    []
  );

  if (isLoading) {
    return (
      <div
        className="w-28 sm:w-32 md:w-36 lg:w-40 animate-pulse"
        role="listitem"
        aria-label="Loading artist"
      >
        <div className="w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36 lg:w-40 lg:h-40 bg-gradient-to-br from-white/10 via-white/20 to-white/5 rounded-full relative overflow-hidden mb-3">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-shimmer" />
        </div>

        <div className="h-4 sm:h-5 w-20 sm:w-24 mx-auto bg-gradient-to-r from-white/10 via-white/20 to-white/10 rounded-md relative overflow-hidden mb-2">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-shimmer-delayed" />
        </div>

        <div className="h-3 w-16 sm:w-20 mx-auto bg-gradient-to-r from-white/8 via-white/15 to-white/8 rounded-md relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -skew-x-12 animate-shimmer-delayed-2" />
        </div>
      </div>
    );
  }

  return (
    <article
      className="w-28 sm:w-32 md:w-36 lg:w-40 hover:scale-105 transition-all duration-300 group"
      role="listitem"
    >
      <Link
        to={`/artist/${artist._id}`}
        className="block focus:outline-none focus:ring-2 focus:ring-white/20 rounded-full mb-3"
        aria-label={`View artist ${artist.name}`}
      >
        <div className="relative overflow-hidden rounded-full">
          {artist.avatar ? (
            <>
              <img
                src={artist.avatar}
                alt={`${artist.name} avatar`}
                className="w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36 lg:w-40 lg:h-40 rounded-full object-cover transition-transform duration-300 group-hover:scale-105"
                onError={handleImageError}
                loading="lazy"
              />
              <div className="w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36 lg:w-40 lg:h-40 rounded-full bg-gradient-to-br from-gray-600 to-gray-800 items-center justify-center hidden absolute inset-0">
                <svg
                  className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400"
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
            </>
          ) : (
            <div className="w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36 lg:w-40 lg:h-40 rounded-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center">
              <svg
                className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400"
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

          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 rounded-full" />
        </div>
      </Link>

      <Link
        to={`/artist/${artist._id}`}
        className="block focus:outline-none focus:ring-2 focus:ring-white/20 rounded mb-2"
      >
        <div className="flex items-center justify-center gap-1">
          <h3 className="text-xs sm:text-sm lg:text-base text-white truncate hover:underline transition-colors duration-200 text-center font-medium">
            {artist.name || "Unknown Artist"}
          </h3>
          {artistInfo.isVerified && (
            <svg
              className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-label="Verified artist"
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

      <div className="flex flex-col items-center text-white/60 text-xs sm:text-sm space-y-1">
        <span className="truncate text-center w-full">
          {artistInfo.followers}
        </span>

        {artist.genres && artist.genres.length > 0 && (
          <div className="flex items-center gap-1">
            <div
              className="w-1 h-1 bg-white/70 rounded-full flex-shrink-0"
              aria-hidden="true"
            />
            <span className="truncate text-center">{artist.genres[0]}</span>
          </div>
        )}
      </div>

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
