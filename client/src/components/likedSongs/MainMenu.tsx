import {
  CaretRightOutlined,
  ClockCircleOutlined,
  PauseOutlined,
  SwapOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import type { Track } from "../../types/TrackData";
import { useState, useMemo, type FC, useCallback } from "react";
import TrackTemplate from "./components/TrackTemplate";
import { playTrackAndQueue, toggleShuffle } from "../../state/Queue.slice";
import { setIsPlaying } from "../../state/CurrentTrack.slice";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, AppState } from "../../store";

interface MainMenuProps {
  tracks: Track[];
  isLoading?: boolean;
}

/**
 * Track skeleton component for loading state
 */
const TrackSkeleton = () => {
  return (
    <>
      <div className="hidden xl:block">
        <div className="grid grid-cols-[50px_1.47fr_1.57fr_0.8fr_50px_80px_50px] gap-4 items-center px-4 py-3 hover:bg-white/5 transition-colors duration-200 rounded-lg group animate-pulse">
          <div className="text-center">
            <div className="w-6 h-4 bg-gradient-to-br from-white/10 via-white/20 to-white/5 rounded" />
          </div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-white/10 via-white/20 to-white/5 rounded-lg flex-shrink-0" />
            <div className="flex flex-col gap-2 flex-1 min-w-0">
              <div className="h-4 bg-gradient-to-br from-white/10 via-white/20 to-white/5 rounded w-3/4" />
              <div className="h-3 bg-gradient-to-br from-white/10 via-white/20 to-white/5 rounded w-1/2" />
            </div>
          </div>
          <div className="text-center">
            <div className="h-4 bg-gradient-to-br from-white/10 via-white/20 to-white/5 rounded w-2/3 mx-auto" />
          </div>
          <div className="text-center">
            <div className="h-4 bg-gradient-to-br from-white/10 via-white/20 to-white/5 rounded w-16 mx-auto" />
          </div>
          <div className="text-center">
            <div className="w-6 h-6 bg-gradient-to-br from-white/10 via-white/20 to-white/5 rounded-full mx-auto" />
          </div>
          <div className="text-center">
            <div className="h-4 bg-gradient-to-br from-white/10 via-white/20 to-white/5 rounded w-12 mx-auto" />
          </div>
          <div className="text-center">
            <div className="w-6 h-6 bg-gradient-to-br from-white/10 via-white/20 to-white/5 rounded-full mx-auto" />
          </div>
        </div>
      </div>

      <div className="block xl:hidden">
        <div className="flex items-center justify-between px-3 py-3 hover:bg-white/5 transition-colors duration-200 rounded-lg relative overflow-hidden animate-pulse">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-12 h-12 bg-gradient-to-br from-white/10 via-white/20 to-white/5 rounded-lg flex-shrink-0" />
            <div className="flex flex-col gap-2 flex-1 min-w-0">
              <div className="h-4 bg-gradient-to-br from-white/10 via-white/20 to-white/5 rounded w-3/4" />
              <div className="h-3 bg-gradient-to-br from-white/10 via-white/20 to-white/5 rounded w-1/2" />
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="h-3 bg-gradient-to-br from-white/10 via-white/20 to-white/5 rounded w-10" />
            <div className="w-6 h-6 bg-gradient-to-br from-white/10 via-white/20 to-white/5 rounded-full" />
          </div>
          <div className="absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
        </div>
      </div>
    </>
  );
};

const TracksListSkeleton: FC = () => {
  return (
    <div className="space-y-1">
      {Array.from({ length: 8 }).map((_, index) => (
        <TrackSkeleton key={index} />
      ))}
    </div>
  );
};

/**
 * Main component for liked tracks list
 * Features: search, playback controls, shuffle, responsive design
 */
const MainMenu: FC<MainMenuProps> = ({ tracks, isLoading = false }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const { shuffle } = useSelector((state: AppState) => state.queue);
  const currentTrackState = useSelector(
    (state: AppState) => state.currentTrack
  );
  const dispatch = useDispatch<AppDispatch>();

  const isCurrentTrackFromThisPlaylist = useMemo(() => {
    if (!currentTrackState.currentTrack) return false;
    return tracks.some(
      (track) => track._id === currentTrackState.currentTrack?._id
    );
  }, [currentTrackState.currentTrack, tracks]);

  const isPlaylistPlaying = useMemo(() => {
    return isCurrentTrackFromThisPlaylist && currentTrackState.isPlaying;
  }, [isCurrentTrackFromThisPlaylist, currentTrackState.isPlaying]);

  const handleShuffle = useCallback(() => {
    dispatch(toggleShuffle());
  }, [dispatch]);

  const handlePlaylistPlayPause = useCallback(() => {
    if (isLoading || tracks.length === 0) return;

    if (isCurrentTrackFromThisPlaylist) {
      dispatch(setIsPlaying(!currentTrackState.isPlaying));
    } else {
      dispatch(
        playTrackAndQueue({
          contextTracks: tracks,
          startIndex: 0,
        })
      );
    }
  }, [
    isLoading,
    tracks.length,
    isCurrentTrackFromThisPlaylist,
    currentTrackState.isPlaying,
    tracks,
    dispatch,
  ]);

  const filteredTracks = useMemo(() => {
    if (!searchQuery.trim()) return tracks;

    const query = searchQuery.toLowerCase();
    return tracks.filter(
      (track) =>
        track.name.toLowerCase().includes(query) ||
        track.artist.name.toLowerCase().includes(query) ||
        (track.album !== "single" &&
          track.album.name.toLowerCase().includes(query))
    );
  }, [tracks, searchQuery]);

  const clearSearch = useCallback(() => {
    setSearchQuery("");
  }, []);

  const renderPlayButton = () => {
    if (isLoading) {
      return (
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white" />
      );
    }

    if (isPlaylistPlaying) {
      return (
        <PauseOutlined
          style={{
            fontSize: window.innerWidth < 768 ? "24px" : "40px",
            color: "white",
          }}
        />
      );
    }

    return (
      <CaretRightOutlined
        style={{
          fontSize: window.innerWidth < 768 ? "26px" : "42px",
          color: "white",
        }}
        className={window.innerWidth < 768 ? "ml-[2px]" : "ml-[4px]"}
      />
    );
  };

  const renderContent = () => {
    if (isLoading) return <TracksListSkeleton />;

    if (filteredTracks.length > 0) {
      return filteredTracks.map((track, index) => (
        <TrackTemplate
          key={track._id || index}
          track={track}
          index={index}
          isLoading={false}
          allTracks={filteredTracks}
        />
      ));
    }

    return (
      <div className="flex flex-col items-center justify-center h-40 text-white/60">
        <SearchOutlined className="text-3xl md:text-4xl mb-2" />
        <p className="text-base md:text-lg font-medium">No tracks found</p>
        <p className="text-xs md:text-sm mt-1">
          Try changing your search query
        </p>
      </div>
    );
  };

  return (
    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg md:rounded-xl shadow-2xl w-full h-full flex flex-col">
      <div className="pt-2 md:pt-3 px-2 md:px-3 flex-shrink-0">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-3 md:mb-5 px-2 md:px-3 gap-3 md:gap-4">
          <div className="flex items-center gap-2 md:gap-4 order-2 md:order-1">
            <button
              className={`bg-white/40 rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-all duration-200 ${
                window.innerWidth < 768 ? "w-12 h-12" : "w-[65px] h-[65px]"
              }`}
              onClick={handlePlaylistPlayPause}
              disabled={isLoading}
              aria-label={
                isPlaylistPlaying ? "Pause playlist" : "Play playlist"
              }
            >
              {renderPlayButton()}
            </button>

            <button
              onClick={handleShuffle}
              className="cursor-pointer hover:scale-110 transition-all duration-200"
              disabled={isLoading}
              aria-label={shuffle ? "Disable shuffle" : "Enable shuffle"}
            >
              <SwapOutlined
                style={{
                  color: shuffle ? "white" : "rgba(255, 255, 255, 0.3)",
                  fontSize: window.innerWidth < 768 ? "24px" : "42px",
                }}
              />
            </button>
          </div>

          <div className="relative order-1 md:order-2 w-full md:w-auto">
            <div className="relative flex items-center">
              <SearchOutlined
                className={`absolute left-3 z-10 ${
                  window.innerWidth < 768 ? "text-base" : "text-lg"
                }`}
                style={{ color: "white" }}
              />
              <input
                type="text"
                placeholder={
                  window.innerWidth < 768
                    ? "Search tracks..."
                    : "Search in liked tracks..."
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white/8 md:bg-white/10 md:backdrop-blur-md border border-white/20 rounded-full px-8 md:px-10 py-2 text-white placeholder-white/40 focus:outline-none focus:border-white/40 focus:bg-white/12 md:focus:bg-white/15 transition-all duration-200 w-full md:w-[300px] text-sm md:text-base"
                aria-label="Search tracks"
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 text-white/40 hover:text-white/60 transition-colors text-lg md:text-xl"
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="hidden xl:block">
          <div className="grid grid-cols-[50px_1.47fr_1.57fr_0.8fr_50px_80px_50px] gap-4 items-center px-4 mb-2">
            <h1 className="text-white/50 text-xl text-center">#</h1>
            <h1 className="text-white/50 text-xl">Title</h1>
            <h1 className="text-white/50 text-xl text-center">Album</h1>
            <h1 className="text-white/50 text-xl text-center">Date added</h1>
            <div
              className="text-white/50 text-xl text-center"
              aria-label="Like status"
            />
            <div
              className="text-white/50 text-xl text-center"
              aria-label="Duration"
            >
              <ClockCircleOutlined />
            </div>
            <div
              className="text-white/50 text-xl text-center"
              aria-label="More options"
            />
          </div>
          <div className="h-[2px] w-full bg-white/20" />
        </div>

        <div className="block xl:hidden">
          <div className="flex items-center justify-between px-3 mb-2 text-white/50">
            <span className="text-sm font-medium">Track</span>
            <span className="text-sm font-medium">Duration</span>
          </div>
          <div className="h-[1px] w-full bg-white/20" />
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <div
          className="h-full overflow-y-auto px-2 md:px-3 pb-2 scrollbar-thin scrollbar-track-white/5 scrollbar-thumb-white/20 hover:scrollbar-thumb-white/30 scrollbar-thumb-rounded-full scrollbar-track-rounded-full"
          style={{
            scrollbarWidth: "thin",
            scrollbarColor:
              "rgba(255, 255, 255, 0.2) rgba(255, 255, 255, 0.05)",
          }}
        >
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default MainMenu;
