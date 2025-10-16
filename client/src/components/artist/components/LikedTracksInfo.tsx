import { type FC, memo, useCallback } from "react";
import type { Artist } from "../../../types/ArtistData";
import { Link } from "react-router-dom";
import { useArtistLikedTracksCount } from "../../../hooks/useArtistLikedTracksCount";

interface LikedTracksInfoProps {
  artist: Artist;
  isLoading?: boolean;
}

/**
 * Liked tracks info showing count of user's liked tracks by specific artist
 * Links to liked tracks page
 */
const LikedTracksInfo: FC<LikedTracksInfoProps> = ({
  artist,
  isLoading = false,
}) => {
  const { count } = useArtistLikedTracksCount(artist._id);

  const handleImageError = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      e.currentTarget.style.display = "none";
    },
    []
  );

  const getLikedTracksText = useCallback((count: number) => {
    return `You liked ${count} ${count === 1 ? "track" : "tracks"}`;
  }, []);

  if (isLoading) {
    return (
      <section
        className="flex flex-col h-full animate-pulse"
        aria-labelledby="liked-tracks-title"
      >
        <div className="h-8 sm:h-9 w-40 sm:w-48 bg-gradient-to-r from-white/15 via-white/25 to-white/15 border border-white/25 rounded-lg relative overflow-hidden mb-3">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/35 to-transparent -skew-x-12 animate-shimmer"></div>
        </div>

        <div className="flex gap-3 sm:gap-5 items-center">
          <div className="w-[80px] h-[80px] sm:w-[100px] sm:h-[100px] bg-gradient-to-br from-white/10 via-white/20 to-white/5 border border-white/20 rounded-full relative overflow-hidden flex-shrink-0">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-shimmer"></div>
          </div>

          <div className="flex flex-col justify-center space-y-2 flex-1">
            <div className="h-5 sm:h-6 w-32 sm:w-40 bg-gradient-to-r from-white/10 via-white/20 to-white/10 border border-white/20 rounded-md relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-shimmer-delayed"></div>
            </div>
            <div className="h-5 sm:h-6 w-24 sm:w-32 bg-gradient-to-r from-white/8 via-white/15 to-white/8 border border-white/15 rounded-md relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -skew-x-12 animate-shimmer-delayed-2"></div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className="flex flex-col h-full"
      aria-labelledby="liked-tracks-title"
    >
      <h2
        id="liked-tracks-title"
        className="text-white text-2xl sm:text-3xl font-bold mb-3"
      >
        Liked Tracks
      </h2>

      <div className="flex hover:scale-[1.005] transition-all duration-300 gap-3 sm:gap-5 items-center p-2 rounded-lg hover:bg-white/5">
        <Link
          to="/liked"
          className="flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-white/20 rounded-full"
          aria-label="View liked tracks"
        >
          <div className="relative">
            <img
              src={artist?.avatar}
              alt={`${artist?.name} avatar`}
              className="w-[80px] h-[80px] sm:w-[100px] sm:h-[100px] rounded-full cursor-pointer object-cover transition-transform duration-200 hover:scale-105"
              onError={handleImageError}
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors duration-300 rounded-full" />
          </div>
        </Link>

        <div className="flex flex-col justify-center flex-1 min-w-0">
          <Link
            to="/liked"
            className="focus:outline-none focus:ring-2 focus:ring-white/20 rounded"
          >
            <h3 className="text-white text-lg sm:text-xl hover:underline cursor-pointer transition-colors duration-200 mb-1">
              {getLikedTracksText(count)}
            </h3>
          </Link>

          <p className="text-lg sm:text-xl text-white/80">
            from: <span className="font-medium">{artist?.name}</span>
          </p>
        </div>
      </div>

      <div className="sr-only">
        <p>
          Navigate to your liked tracks page to see all {count} tracks you've
          liked from {artist?.name}
        </p>
      </div>
    </section>
  );
};

export default memo(LikedTracksInfo);
