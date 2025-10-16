import { type FC, memo, useMemo } from "react";
import type { Track } from "../../../types/TrackData";
import TrackTemplate from "./TrackTemplate";

interface TracksListProps {
  isLoading?: boolean;
  tracks?: Track[];
  tracksError?: string | null;
}

/**
 * Artist tracks list component displaying popular tracks
 * Sorted by listen count with loading and error states
 */
const TracksList: FC<TracksListProps> = ({
  isLoading = false,
  tracks = [],
  tracksError = null,
}) => {
  const hasData = tracks.length > 0;

  const sortedTracks = useMemo(
    () => [...tracks].sort((a, b) => b.listenCount - a.listenCount),
    [tracks]
  );

  const renderSkeletons = () =>
    Array.from({ length: 8 }).map((_, index) => (
      <div key={`skeleton-${index}`} className="animate-pulse">
        <TrackTemplate
          track={{} as Track}
          isLoading={true}
          allTracks={[]}
          index={index}
        />
      </div>
    ));

  const renderError = () => (
    <div className="text-center py-8" role="alert">
      <div className="w-16 h-16 mx-auto rounded-full bg-red-500/20 flex items-center justify-center mb-3">
        <svg
          className="w-8 h-8 text-red-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <h3 className="text-white font-semibold mb-2">Failed to load tracks</h3>
      <p className="text-white/70 text-sm mb-4">{tracksError}</p>
      <button
        onClick={() => window.location.reload()}
        className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white/20"
        aria-label="Retry loading tracks"
      >
        Try again
      </button>
    </div>
  );

  const renderEmptyState = () => (
    <div className="text-center py-8" role="status">
      <div className="w-16 h-16 mx-auto rounded-full bg-white/10 flex items-center justify-center mb-3">
        <svg
          className="w-8 h-8 text-white/60"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
          />
        </svg>
      </div>
      <h3 className="text-white/80 font-medium mb-2">No tracks found</h3>
      <p className="text-white/60 text-sm">
        This artist doesn't have any tracks yet
      </p>
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      {isLoading ? (
        <div className="mb-6 flex-shrink-0">
          <div className="h-6 sm:h-8 w-48 sm:w-64 bg-gradient-to-r from-white/15 via-white/25 to-white/15  border border-white/25 rounded-lg relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/35 to-transparent -skew-x-12 animate-shimmer"></div>
          </div>
        </div>
      ) : (
        <h2 className="text-white text-2xl sm:text-3xl font-bold mb-6 flex-shrink-0">
          Popular Tracks
        </h2>
      )}

      <div className="flex-1 overflow-hidden">
        <div className="h-full tracks-scroll-light pr-2">
          <div className="h-[2px] w-full bg-white/20 mb-2"></div>

          <div className="space-y-2">
            {isLoading
              ? renderSkeletons()
              : tracksError
              ? renderError()
              : !hasData
              ? renderEmptyState()
              : sortedTracks.map((track, index) => (
                  <TrackTemplate
                    key={track._id}
                    track={track}
                    isLoading={false}
                    allTracks={tracks}
                    index={index}
                  />
                ))}
          </div>

          <div className="h-[2px] w-full bg-white/20 mt-2"></div>
        </div>
      </div>

      {!isLoading && hasData && (
        <div className="sr-only">
          <p>
            Showing {tracks.length} {tracks.length === 1 ? "track" : "tracks"}
            from this artist's most popular songs
          </p>
        </div>
      )}
    </div>
  );
};

export default memo(TracksList);
