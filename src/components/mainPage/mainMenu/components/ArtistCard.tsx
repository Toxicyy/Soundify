import TrackLayout from "./TrackLayout";
import type { Artist } from "../../../../types/ArtistData";
import type { Track } from "../../../../types/TrackData";

interface ArtistCardProps {
  artist: { artist: Artist; tracks: Track[] } | null;
  isLoading?: boolean;
}

export default function ArtistCard({
  artist,
  isLoading = false,
}: ArtistCardProps) {
  return (
    <div
      className={`flex justify-between gap-[20px] ${
        isLoading ? "pointer-events-none" : ""
      }`}
    >
      <div className="flex flex-col items-center gap-2">
        <div className="w-[140px] h-[140px] rounded-[45px] relative overflow-hidden">
          {isLoading ? (
            <div className="w-full h-full bg-gradient-to-br from-white/10 via-white/20 to-white/5 backdrop-blur-md border border-white/20 rounded-[45px] relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-shimmer"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-white/40 text-5xl">👤</div>
              </div>
            </div>
          ) : (
            <img
              src={artist?.artist.avatar}
              alt="Artist image"
              className="w-[140px] h-[140px] rounded-[45px] object-cover"
            />
          )}
        </div>

        {isLoading ? (
          <div className="h-6 w-28 bg-gradient-to-r from-white/10 via-white/20 to-white/10 backdrop-blur-md border border-white/20 rounded-md relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-shimmer-delayed"></div>
          </div>
        ) : (
          <h1 className="text-black text-lg font-bold tracking-wider">
            {artist?.artist.name}
          </h1>
        )}
      </div>

      <div className="flex flex-col gap-[10px]">
        <TrackLayout
          track={isLoading ? undefined : artist?.tracks[0]}
          isLoading={isLoading}
        />
        <TrackLayout
          track={isLoading ? undefined : artist?.tracks[1]}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
