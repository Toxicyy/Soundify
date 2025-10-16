import { useCallback, useMemo, type FC, memo } from "react";
import type { Track } from "../../types/TrackData";
import TrackTemplate from "../artist/components/TrackTemplate";
import {
  CaretRightOutlined,
  PauseOutlined,
  SwapOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, AppState } from "../../store";
import { toggleShuffle } from "../../state/Queue.slice";
import { setIsPlaying } from "../../state/CurrentTrack.slice";

interface SingleMainMenuProps {
  track: Track;
  isLoading: boolean;
}

/**
 * Main menu for single track page
 * Handles playback controls and track display
 */
const SingleMainMenu: FC<SingleMainMenuProps> = ({ track, isLoading }) => {
  const { shuffle } = useSelector((state: AppState) => state.queue);
  const currentTrackState = useSelector(
    (state: AppState) => state.currentTrack
  );
  const dispatch = useDispatch<AppDispatch>();

  const isCurrentTrackPlaying = useMemo(() => {
    return (
      track._id === currentTrackState.currentTrack?._id &&
      currentTrackState.isPlaying
    );
  }, [
    track._id,
    currentTrackState.currentTrack?._id,
    currentTrackState.isPlaying,
  ]);

  const handleShuffle = useCallback(() => {
    dispatch(toggleShuffle());
  }, [dispatch]);

  const handlePlaylistPlayPause = useCallback(() => {
    if (isLoading) return;
    dispatch(setIsPlaying(!currentTrackState.isPlaying));
  }, [isLoading, currentTrackState.isPlaying, dispatch]);

  /**
   * Renders control panel with play/pause and shuffle buttons
   */
  const renderControlPanel = () => (
    <div className="pt-3 px-3 flex-shrink-0">
      <div className="flex items-center justify-between mb-5 px-3">
        <div className="flex items-center gap-4">
          {isLoading ? (
            <div className="w-[65px] h-[65px] rounded-full bg-gradient-to-br from-white/15 via-white/25 to-white/10 backdrop-blur-md border border-white/25 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-shimmer"></div>
            </div>
          ) : (
            <button
              className="bg-white/40 rounded-full w-[65px] h-[65px] flex items-center justify-center cursor-pointer hover:scale-110 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/20"
              onClick={handlePlaylistPlayPause}
              aria-label={isCurrentTrackPlaying ? "Pause track" : "Play track"}
            >
              {isCurrentTrackPlaying ? (
                <PauseOutlined style={{ fontSize: "40px", color: "white" }} />
              ) : (
                <CaretRightOutlined
                  style={{ fontSize: "42px", color: "white" }}
                  className="ml-[4px]"
                />
              )}
            </button>
          )}

          {isLoading ? (
            <div className="w-[42px] h-[42px] bg-gradient-to-r from-white/10 via-white/20 to-white/10 backdrop-blur-md border border-white/20 rounded-lg relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-shimmer-delayed"></div>
            </div>
          ) : (
            <button
              className="cursor-pointer hover:scale-110 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/20 rounded-full p-2"
              onClick={handleShuffle}
              aria-label={shuffle ? "Disable shuffle" : "Enable shuffle"}
            >
              <SwapOutlined
                style={{
                  color: shuffle ? "white" : "rgba(255, 255, 255, 0.3)",
                  fontSize: "42px",
                }}
              />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <main className="pb-8 w-full bg-white/10 rounded-3xl border border-white/20">
      {renderControlPanel()}

      <div className="px-3">
        <TrackTemplate
          index={0}
          track={track}
          isLoading={isLoading}
          allTracks={track ? [track] : []}
        />
      </div>

      {!isLoading && track && (
        <div className="sr-only">
          <h2>Now playing: {track.name}</h2>
          {track.artist && (
            <p>
              by{" "}
              {typeof track.artist === "string"
                ? track.artist
                : track.artist.name}
            </p>
          )}
          {track.duration && (
            <p>
              Duration: {Math.floor(track.duration / 60)}:
              {String(track.duration % 60).padStart(2, "0")}
            </p>
          )}
        </div>
      )}
    </main>
  );
};

export default memo(SingleMainMenu);
