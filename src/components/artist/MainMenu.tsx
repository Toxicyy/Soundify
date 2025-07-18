import { type FC, memo, useCallback } from "react";
import type { Track } from "../../types/TrackData";
import type { Artist } from "../../types/ArtistData";
import type { Album } from "../../types/AlbumData";
import { CaretRightOutlined, SwapOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, AppState } from "../../store";
import { playTrackAndQueue, toggleShuffle } from "../../state/Queue.slice";
import TracksList from "./components/TrackList";
import LikedTracksInfo from "./components/LikedTracksInfo";
import MusicList from "./components/MusicList";
import ArtistInfo from "./components/ArtistInfo";

interface ArtistMainMenuProps {
  isLoading?: boolean;
  tracks?: Track[];
  tracksError?: string | null;
  artist: Artist;
  albums: Album[];
  isFollowing: boolean;
  toggleFollow: () => Promise<void>;
}

/**
 * Artist main menu component with comprehensive artist profile display
 * Features tracks list, liked tracks info, music collection, and artist bio
 * Includes responsive design and comprehensive loading states
 */
const ArtistMainMenu: FC<ArtistMainMenuProps> = ({
  isLoading = false,
  tracks = [],
  tracksError = null,
  artist,
  albums,
  isFollowing,
  toggleFollow,
}) => {
  // Redux state
  const { shuffle } = useSelector((state: AppState) => state.queue);
  const dispatch = useDispatch<AppDispatch>();

  /**
   * Handle shuffle toggle
   */
  const handleShuffle = useCallback(() => {
    dispatch(toggleShuffle());
  }, [dispatch]);

  /**
   * Handle play all tracks from artist
   */
  const handlePlayAllTracks = useCallback(() => {
    if (tracks.length > 0) {
      dispatch(
        playTrackAndQueue({
          contextTracks: tracks,
          startIndex: 0,
        })
      );
    }
  }, [tracks, dispatch]);

  /**
   * Handle follow/unfollow artist (placeholder for future implementation)
   */
  const handleFollowArtist = useCallback(() => {
    toggleFollow();
  }, []);

  /**
   * Render control panel with play, shuffle, and follow buttons
   */
  const renderControlPanel = () => (
    <div className="pt-3 px-3 flex-shrink-0">
      <div className="flex items-center justify-between mb-5 px-3 gap-4 flex-row">
        {/* Left side - Playback controls */}
        <div className="flex items-center gap-4 order-2 sm:order-1">
          {/* Play all button */}
          {isLoading ? (
            <div className="w-[65px] h-[65px] rounded-full bg-gradient-to-br from-white/15 via-white/25 to-white/10 backdrop-blur-md border border-white/25 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-shimmer"></div>
            </div>
          ) : (
            <button
              className="bg-white/40 rounded-full w-[65px] h-[65px] flex items-center justify-center cursor-pointer hover:scale-110 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-white/20"
              onClick={handlePlayAllTracks}
              disabled={tracks.length === 0}
              aria-label="Play all tracks"
            >
              <CaretRightOutlined
                style={{ fontSize: "42px", color: "white" }}
                className="ml-[4px]"
              />
            </button>
          )}

          {/* Shuffle button */}
          {isLoading ? (
            <div className="w-[42px] h-[42px] bg-gradient-to-r from-white/10 via-white/20 to-white/10 backdrop-blur-md border border-white/20 rounded-lg relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-shimmer-delayed"></div>
            </div>
          ) : (
            <button
              className="cursor-pointer hover:scale-110 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-white/20 rounded-full p-2"
              onClick={handleShuffle}
              disabled={tracks.length === 0}
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

          {/* Follow button */}
          {isLoading ? (
            <div className="h-10 w-28 sm:w-32 bg-gradient-to-r from-white/10 via-white/20 to-white/10 backdrop-blur-md border border-white/20 rounded-full relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-shimmer-delayed-2"></div>
            </div>
          ) : (
            <button
              className={`bg-transparent border-2 border-white/60 rounded-full px-4 py-2 text-white hover:scale-105 hover:bg-white/10 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/20`}
              onClick={handleFollowArtist}
              aria-label="Follow artist"
            >
              {isFollowing ? "Following" : "Follow"}
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <main className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl shadow-2xl w-full h-full flex flex-col">
      {renderControlPanel()}

      {/* Tracks section with constrained height */}
      <section
        className="px-3 sm:px-6 py-1 flex-1 min-h-0"
        aria-labelledby="popular-tracks"
      >
        <TracksList
          isLoading={isLoading}
          tracks={tracks}
          tracksError={tracksError}
        />
      </section>

      {/* Liked tracks info section */}
      <section className="px-3 sm:px-6 py-3" aria-labelledby="liked-tracks">
        <LikedTracksInfo artist={artist} isLoading={isLoading} />
      </section>

      {/* Music collection section */}
      <section className="px-3 sm:px-6 py-5" aria-labelledby="music-collection">
        <MusicList
          tracks={tracks.filter((track) => track.album === "single")}
          albums={albums}
          isLoading={isLoading}
        />
      </section>

      {/* Artist information section */}
      <section className="px-3 sm:px-6 py-5 mb-5" aria-labelledby="artist-info">
        <ArtistInfo artist={artist} isLoading={isLoading} />
      </section>

      {/* Additional context for screen readers */}
      {!isLoading && (
        <div className="sr-only">
          <h2>Artist profile for {artist.name}</h2>
          <p>
            This page contains {tracks.length} tracks, {albums.length} albums,
            and detailed information about {artist.name}
          </p>
          <p>
            Use the navigation controls to play all tracks, enable shuffle, or
            follow the artist
          </p>
        </div>
      )}
    </main>
  );
};

export default memo(ArtistMainMenu);
