import { useCallback, useMemo, useState, type FC, memo } from "react";
import type { Track } from "../../../types/TrackData";
import TrackTemplate from "../../artist/components/TrackTemplate";
import {
  CaretRightOutlined,
  PauseOutlined,
  SearchOutlined,
  SwapOutlined,
} from "@ant-design/icons";
import type { AppDispatch, AppState } from "../../../store";
import { useDispatch, useSelector } from "react-redux";
import { playTrackAndQueue, toggleShuffle } from "../../../state/Queue.slice";
import { setIsPlaying } from "../../../state/CurrentTrack.slice";

interface TracksListProps {
  /** Loading state indicator */
  isLoading?: boolean;
  /** Array of tracks to display */
  tracks?: Track[];
  /** Error message if track loading failed */
  tracksError?: string | null;
}

/**
 * Album tracks list component with search, playback controls, and track management
 * Provides comprehensive track interaction and playback functionality
 */
const TracksList: FC<TracksListProps> = ({
  isLoading = false,
  tracks = [],
  tracksError = null,
}) => {
  // Local state for search functionality
  const [searchQuery, setSearchQuery] = useState("");

  // Redux state selectors
  const currentTrackState = useSelector(
    (state: AppState) => state.currentTrack
  );
  const { shuffle } = useSelector((state: AppState) => state.queue);
  const dispatch = useDispatch<AppDispatch>();

  // Computed values
  const hasData = tracks.length > 0;

  /**
   * Check if current playing track belongs to this tracklist
   */
  const isCurrentTrackFromThisPlaylist = useMemo(() => {
    if (!currentTrackState.currentTrack) return false;

    return tracks.some(
      (track) => track._id === currentTrackState.currentTrack?._id
    );
  }, [currentTrackState.currentTrack, tracks]);

  /**
   * Determine if this playlist is currently playing
   */
  const isPlaylistPlaying = useMemo(() => {
    return isCurrentTrackFromThisPlaylist && currentTrackState.isPlaying;
  }, [isCurrentTrackFromThisPlaylist, currentTrackState.isPlaying]);

  /**
   * Filter tracks based on search query
   * Searches through track name and artist name
   */
  const filteredTracks = useMemo(() => {
    if (!searchQuery.trim()) {
      return tracks;
    }

    const query = searchQuery.toLowerCase();
    return tracks.filter((track) => {
      const trackName = track.name?.toLowerCase() || "";
      const artistName = track.artist?.name?.toLowerCase() || "";

      return trackName.includes(query) || artistName.includes(query);
    });
  }, [tracks, searchQuery]);

  // Event handlers
  /**
   * Toggle shuffle mode
   */
  const handleShuffle = useCallback(() => {
    dispatch(toggleShuffle());
  }, [dispatch]);

  /**
   * Handle playlist play/pause with smart context switching
   * If current track is from this playlist - toggle play/pause
   * Otherwise start playlist from beginning
   */
  const handlePlaylistPlayPause = useCallback(() => {
    if (isLoading || filteredTracks.length === 0) return;

    if (isCurrentTrackFromThisPlaylist) {
      dispatch(setIsPlaying(!currentTrackState.isPlaying));
    } else {
      dispatch(
        playTrackAndQueue({
          contextTracks: filteredTracks,
          startIndex: 0,
        })
      );
    }
  }, [
    isLoading,
    filteredTracks,
    isCurrentTrackFromThisPlaylist,
    currentTrackState.isPlaying,
    dispatch,
  ]);

  /**
   * Clear search query
   */
  const handleClearSearch = useCallback(() => {
    setSearchQuery("");
  }, []);

  // Render functions
  /**
   * Render skeleton loaders for loading state
   */
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

  /**
   * Render error state with retry option
   */
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

  /**
   * Render empty state with different messages for search vs no data
   */
  const renderEmptyState = () => {
    const isSearchEmpty = searchQuery.trim() && filteredTracks.length === 0;

    return (
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
              d={
                isSearchEmpty
                  ? "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  : "M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
              }
            />
          </svg>
        </div>
        <h3 className="text-white/80 font-medium mb-2">
          {isSearchEmpty ? "No results found" : "No tracks found"}
        </h3>
        <p className="text-white/60 text-sm">
          {isSearchEmpty
            ? `No tracks match "${searchQuery}"`
            : "This album doesn't have any tracks yet"}
        </p>
        {isSearchEmpty && (
          <button
            onClick={handleClearSearch}
            className="mt-3 px-4 py-2 bg-white/10 hover:bg-white/20 text-white/80 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white/20"
            aria-label="Clear search"
          >
            Clear search
          </button>
        )}
      </div>
    );
  };

  /**
   * Render control panel with play/pause, shuffle, and search
   */
  const renderControlPanel = () => (
    <div className="pt-3 px-3 flex-shrink-0">
      <div className="flex items-center justify-between mb-5 px-3 gap-4 flex-row">
        {/* Left side - Playback controls */}
        <div className="flex items-center gap-4">
          {/* Play/Pause button */}
          <button
            className="bg-white/40 rounded-full w-[65px] h-[65px] flex items-center justify-center cursor-pointer hover:scale-110 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 focus:outline-none focus:ring-2 focus:ring-white/20"
            onClick={handlePlaylistPlayPause}
            disabled={isLoading || (!hasData && !filteredTracks.length)}
            aria-label={isPlaylistPlaying ? "Pause" : "Play"}
          >
            {isLoading ? (
              <div
                className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"
                aria-hidden="true"
              />
            ) : isPlaylistPlaying ? (
              <PauseOutlined style={{ fontSize: "40px", color: "white" }} />
            ) : (
              <CaretRightOutlined
                style={{ fontSize: "42px", color: "white" }}
                className="ml-[4px]"
              />
            )}
          </button>

          {/* Shuffle button */}
          <button
            className="cursor-pointer hover:scale-110 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 focus:outline-none focus:ring-2 focus:ring-white/20 rounded-full p-1"
            onClick={handleShuffle}
            disabled={isLoading || filteredTracks.length === 0}
            aria-label={shuffle ? "Disable shuffle" : "Enable shuffle"}
          >
            <SwapOutlined
              style={{
                color: shuffle ? "white" : "rgba(255, 255, 255, 0.3)",
                fontSize: "42px",
              }}
            />
          </button>
        </div>

        {/* Right side - Search */}
        <div className="relative order-1 sm:order-2 w-full sm:w-auto">
          <div className="relative flex items-center">
            <SearchOutlined
              className="absolute left-3 text-lg z-10"
              style={{ color: "white" }}
              aria-hidden="true"
            />
            <input
              type="text"
              placeholder="Search tracks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="
                bg-white/10 
                backdrop-blur-md 
                border 
                border-white/20 
                rounded-full 
                px-10 
                py-2 
                text-white 
                placeholder-white/40 
                focus:outline-none 
                focus:border-white/40 
                focus:bg-white/15 
                transition-all 
                duration-200
                w-full sm:w-[300px]
                md:text-base
                text-sm
              "
              aria-label="Search tracks"
            />
            {searchQuery && (
              <button
                onClick={handleClearSearch}
                className="absolute right-3 text-white/40 hover:text-white/60 transition-colors text-xl focus:outline-none"
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  /**
   * Render tracks list with proper loading/error/empty states
   */
  const renderTracksList = () => (
    <div className="space-y-2 mt-2">
      {isLoading
        ? renderSkeletons()
        : tracksError
        ? renderError()
        : filteredTracks.length === 0
        ? renderEmptyState()
        : filteredTracks.map((track, index) => (
            <TrackTemplate
              key={track._id}
              track={track}
              isLoading={false}
              allTracks={filteredTracks}
              index={index}
            />
          ))}
    </div>
  );

  return (
    <div className="flex flex-col pb-10">
      {renderControlPanel()}
      <div>{renderTracksList()}</div>
    </div>
  );
};

export default memo(TracksList);
