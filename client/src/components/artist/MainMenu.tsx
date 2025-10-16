import { type FC, memo, useCallback, useMemo } from "react";
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
  isFollowingLoading?: boolean;
}

/**
 * Artist main menu component with tracks, albums, and artist info
 * Features playback controls, shuffle, and follow functionality
 */
const ArtistMainMenu: FC<ArtistMainMenuProps> = ({
  isLoading = false,
  tracks = [],
  tracksError = null,
  artist,
  albums,
  isFollowing,
  toggleFollow,
  isFollowingLoading = false,
}) => {
  const { shuffle } = useSelector((state: AppState) => state.queue);
  const dispatch = useDispatch<AppDispatch>();

  const singleTracks = useMemo(
    () => tracks.filter((track) => track.album === "single"),
    [tracks]
  );

  const handleShuffle = useCallback(() => {
    dispatch(toggleShuffle());
  }, [dispatch]);

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

  const handleFollowArtist = useCallback(() => {
    toggleFollow();
  }, [toggleFollow]);

  const renderControlPanel = () => (
    <div className="pt-3 px-3 flex-shrink-0">
      <div className="flex items-center justify-between mb-5 px-3 gap-4 flex-row">
        <div className="flex items-center gap-4 order-2 sm:order-1">
          {isLoading ? (
            <div className="w-[65px] h-[65px] rounded-full bg-gradient-to-br from-white/15 via-white/25 to-white/10 border border-white/25 relative overflow-hidden">
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

          {isLoading ? (
            <div className="w-[42px] h-[42px] bg-gradient-to-r from-white/10 via-white/20 to-white/10  border border-white/20 rounded-lg relative overflow-hidden">
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

          {isLoading ? (
            <div className="h-10 w-28 sm:w-32 bg-gradient-to-r from-white/10 via-white/20 to-white/10  border border-white/20 rounded-full relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-shimmer-delayed-2"></div>
            </div>
          ) : (
            <button
              className={`bg-transparent border-2 border-white/60 rounded-full px-4 py-2 text-white hover:scale-105 hover:bg-white/10 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/20 disabled:opacity-50 disabled:cursor-not-allowed`}
              onClick={handleFollowArtist}
              disabled={isFollowingLoading}
              aria-label={isFollowing ? "Unfollow artist" : "Follow artist"}
            >
              {isFollowingLoading
                ? "Wait..."
                : isFollowing
                ? "Following"
                : "Follow"}
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <main className="bg-white/10 border border-white/20 rounded-3xl shadow-2xl w-full h-full flex flex-col">
      {renderControlPanel()}

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

      <section className="px-3 sm:px-6 py-3" aria-labelledby="liked-tracks">
        <LikedTracksInfo artist={artist} isLoading={isLoading} />
      </section>

      <section className="px-3 sm:px-6 py-5" aria-labelledby="music-collection">
        <MusicList
          tracks={singleTracks}
          albums={albums}
          isLoading={isLoading}
        />
      </section>

      <section className="px-3 sm:px-6 py-5 mb-5" aria-labelledby="artist-info">
        <ArtistInfo artist={artist} isLoading={isLoading} />
      </section>

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
