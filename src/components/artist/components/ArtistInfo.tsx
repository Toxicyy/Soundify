import { type FC, memo, useCallback } from "react";
import type { Artist } from "../../../types/ArtistData";

interface ArtistInfoProps {
  artist: Artist;
  isLoading?: boolean;
}

/**
 * Artist information component displaying avatar, bio, and follower count
 * Features responsive design, loading states, and accessibility support
 */
const ArtistInfo: FC<ArtistInfoProps> = ({ artist, isLoading = false }) => {
  /**
   * Format follower count with proper localization
   */
  const formatFollowerCount = useCallback((count: number) => {
    return count?.toLocaleString() || "0";
  }, []);

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
      <section className="animate-pulse" aria-labelledby="artist-info-title">
        {/* Title skeleton */}
        <div className="h-8 sm:h-9 w-40 sm:w-48 bg-gradient-to-r from-white/15 via-white/25 to-white/15 backdrop-blur-md border border-white/25 rounded-lg relative overflow-hidden mb-3">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/35 to-transparent -skew-x-12 animate-shimmer"></div>
        </div>

        {/* Content skeleton */}
        <div className="flex bg-white/10 rounded-2xl p-3 sm:p-4 lg:p-6 gap-3 sm:gap-5">
          {/* Avatar skeleton */}
          <div className="flex-shrink-0">
            <div className="w-[180px] h-[180px] sm:w-[200px] sm:h-[200px] lg:w-[230px] lg:h-[230px] bg-gradient-to-br from-white/10 via-white/20 to-white/5 backdrop-blur-md border border-white/20 rounded-full relative overflow-hidden mb-2">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-shimmer"></div>
            </div>
            <div className="h-5 w-24 bg-gradient-to-r from-white/8 via-white/15 to-white/8 backdrop-blur-md border border-white/15 rounded-md relative overflow-hidden mx-auto">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -skew-x-12 animate-shimmer-delayed"></div>
            </div>
          </div>

          {/* Bio skeleton */}
          <div className="flex-1 space-y-3">
            <div className="h-6 w-16 bg-gradient-to-r from-white/10 via-white/20 to-white/10 backdrop-blur-md border border-white/20 rounded-md relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-shimmer-delayed-2"></div>
            </div>
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className={`h-4 bg-gradient-to-r from-white/8 via-white/15 to-white/8 backdrop-blur-md border border-white/15 rounded-md relative overflow-hidden ${
                  index === 3 ? "w-3/4" : "w-full"
                }`}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -skew-x-12 animate-shimmer"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby="artist-info-title">
      <h2
        id="artist-info-title"
        className="text-2xl sm:text-3xl font-bold text-white mb-3"
      >
        About artist
      </h2>

      <div className="flex bg-white/10 rounded-2xl hover:bg-white/20 hover:scale-[1.01] transition-all duration-300 p-3 sm:p-4 lg:p-6 gap-3 sm:gap-5 flex-col sm:flex-row">
        {/* Artist avatar and follower count */}
        <div className="flex-shrink-0 text-center sm:text-left">
          <div className="relative inline-block">
            <img
              src={artist.avatar}
              alt={`${artist.name} avatar`}
              className="w-[180px] h-[180px] sm:w-[200px] sm:h-[200px] lg:w-[230px] lg:h-[230px] rounded-full mb-2 object-cover mx-auto sm:mx-0"
              onError={handleImageError}
              loading="lazy"
            />
            {/* Hover overlay for better interaction feedback */}
            <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors duration-300 rounded-full" />
          </div>

          <p className="text-white text-lg sm:text-xl">
            <span className="font-medium">
              {formatFollowerCount(artist.followerCount)}
            </span>{" "}
            <span className="text-white/80">
              {artist.followerCount === 1 ? "follower" : "followers"}
            </span>
          </p>
        </div>

        {/* Artist bio */}
        <div className="flex-1 min-w-0">
          <div className="text-sm sm:text-base lg:text-lg text-white leading-relaxed">
            <span className="font-semibold text-lg sm:text-xl text-white/90 block sm:inline">
              Bio:{" "}
            </span>
            <span className="text-white/80">
              {artist.bio || "No biography available for this artist."}
            </span>
          </div>

          {/* Additional artist metadata */}
          {artist.genres && artist.genres.length > 0 && (
            <div className="mt-4 pt-4 border-t border-white/10">
              <span className="font-semibold text-white/90 block sm:inline">
                Genres:{" "}
              </span>
              <span className="text-white/70">{artist.genres.join(", ")}</span>
            </div>
          )}

          {/* Social links if available */}
          {artist.socialLinks &&
            Object.values(artist.socialLinks).some((link) => link) && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <span className="font-semibold text-white/90 block mb-2">
                  Social Links:
                </span>
                <div className="flex gap-3 flex-wrap">
                  {artist.socialLinks.spotify && (
                    <a
                      href={artist.socialLinks.spotify}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-400 hover:text-green-300 transition-colors duration-200 underline focus:outline-none focus:ring-2 focus:ring-green-400/20 rounded"
                    >
                      Spotify
                    </a>
                  )}
                  {artist.socialLinks.instagram && (
                    <a
                      href={artist.socialLinks.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-pink-400 hover:text-pink-300 transition-colors duration-200 underline focus:outline-none focus:ring-2 focus:ring-pink-400/20 rounded"
                    >
                      Instagram
                    </a>
                  )}
                  {artist.socialLinks.twitter && (
                    <a
                      href={artist.socialLinks.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 transition-colors duration-200 underline focus:outline-none focus:ring-2 focus:ring-blue-400/20 rounded"
                    >
                      Twitter
                    </a>
                  )}
                </div>
              </div>
            )}
        </div>
      </div>
    </section>
  );
};

export default memo(ArtistInfo);
