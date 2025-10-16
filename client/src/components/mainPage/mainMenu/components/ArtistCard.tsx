import { memo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import TrackLayout from "./TrackLayout";
import type { Artist } from "../../../../types/ArtistData";
import type { Track } from "../../../../types/TrackData";

interface ArtistCardProps {
  artist: { artist: Artist; tracks: Track[] } | null;
  isLoading?: boolean;
  isMobile?: boolean;
}

/**
 * Card component displaying artist info with two featured tracks
 * Supports mobile and desktop layouts
 */
const ArtistCard = ({
  artist,
  isLoading = false,
  isMobile = false,
}: ArtistCardProps) => {
  const MobileLayout = () => (
    <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-16 h-16 rounded-2xl relative overflow-hidden flex-shrink-0">
          {isLoading ? (
            <div className="w-full h-full bg-gradient-to-br from-white/10 via-white/20 to-white/5 xl:backdrop-blur-md border border-white/20 rounded-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-shimmer" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-white/40 text-2xl">👤</div>
              </div>
            </div>
          ) : (
            <img
              src={artist?.artist.avatar}
              alt="Artist"
              className="w-full h-full rounded-2xl object-cover"
            />
          )}
        </div>

        <div className="flex-1 min-w-0">
          {isLoading ? (
            <div className="h-5 w-24 bg-gradient-to-r from-white/10 via-white/20 to-white/10 xl:backdrop-blur-md border border-white/20 rounded-md relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-shimmer-delayed" />
            </div>
          ) : (
            <Link to={`/artist/${artist?.artist._id}`}>
              <h1 className="text-white text-lg font-bold tracking-wider hover:underline cursor-pointer truncate">
                {artist?.artist.name}
              </h1>
            </Link>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <TrackLayout
          track={isLoading ? undefined : artist?.tracks[0]}
          isLoading={isLoading}
          isMobile={true}
        />
        <TrackLayout
          track={isLoading ? undefined : artist?.tracks[1]}
          isLoading={isLoading}
          isMobile={true}
        />
      </div>
    </div>
  );

  const DesktopLayout = () => (
    <div
      className={`flex justify-between gap-4 md:gap-6 xl:gap-[20px] ${
        isLoading ? "pointer-events-none" : ""
      }`}
    >
      <div className="flex flex-col items-center gap-2">
        <div className="w-24 h-24 md:w-32 md:h-32 xl:w-[140px] xl:h-[140px] rounded-3xl xl:rounded-[45px] relative overflow-hidden">
          {isLoading ? (
            <div className="w-full h-full bg-gradient-to-br from-white/10 via-white/20 to-white/5 xl:backdrop-blur-md border border-white/20 rounded-3xl xl:rounded-[45px] relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-shimmer" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-white/40 text-3xl xl:text-5xl">👤</div>
              </div>
            </div>
          ) : (
            <img
              src={artist?.artist.avatar}
              alt="Artist"
              className="w-full h-full rounded-3xl xl:rounded-[45px] object-cover"
            />
          )}
        </div>

        {isLoading ? (
          <div className="h-5 xl:h-6 w-20 xl:w-28 bg-gradient-to-r from-white/10 via-white/20 to-white/10 xl:backdrop-blur-md border border-white/20 rounded-md relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-shimmer-delayed" />
          </div>
        ) : (
          <Link to={`/artist/${artist?.artist._id}`}>
            <h1 className="text-white/80 text-base md:text-lg font-bold tracking-wider hover:underline cursor-pointer text-center">
              {artist?.artist.name}
            </h1>
          </Link>
        )}
      </div>

      <div className="flex flex-col gap-2 xl:gap-[10px] flex-1 max-w-none">
        <TrackLayout
          track={isLoading ? undefined : artist?.tracks[0]}
          isLoading={isLoading}
          isMobile={false}
        />
        <TrackLayout
          track={isLoading ? undefined : artist?.tracks[1]}
          isLoading={isLoading}
          isMobile={false}
        />
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {isMobile ? <MobileLayout /> : <DesktopLayout />}
    </motion.div>
  );
};

export default memo(ArtistCard);
