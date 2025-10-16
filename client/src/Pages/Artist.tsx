import { useLocation } from "react-router-dom";
import { memo, useMemo } from "react";
import Header from "../components/artist/Header";
import MainMenu from "../components/artist/MainMenu";
import type { Artist } from "../types/ArtistData";
import { useArtistData } from "../hooks/useArtistData";
import { useArtistTracks } from "../hooks/useArtistTracks";
import { useArtistAlbums } from "../hooks/useArtistAlbums";
import { useImagePreloader } from "../hooks/useImagePreloader";
import { useFollowArtist } from "../hooks/useFollowArtist";

/**
 * Artist page component
 * Displays artist information, tracks, and albums with loading/error states
 */
const Artist = () => {
  const location = useLocation();
  const artistId = location.pathname.split("/artist/")[1];

  const {
    data: artist,
    loading: artistLoading,
    error: artistError,
    refetch: refetchArtist,
  } = useArtistData(artistId || "");

  const {
    tracks,
    loading: tracksLoading,
    error: tracksError,
  } = useArtistTracks(artist?._id || "");

  const {
    isFollowing,
    isLoading: isFollowingLoading,
    toggleFollow,
  } = useFollowArtist(artist?._id || "");

  const { albums, isLoading: albumsLoading } = useArtistAlbums(
    artist?._id || "",
    {
      page: 1,
      limit: 20,
    }
  );

  const imagesToPreload = useMemo(
    () =>
      [
        artist?.avatar,
        ...tracks.map((track) => track.coverUrl),
        ...albums.map((album) => album.coverUrl),
      ].filter(Boolean) as string[],
    [artist?.avatar, tracks, albums]
  );

  const { allImagesLoaded } = useImagePreloader(imagesToPreload);

  const isDataLoading = artistLoading || tracksLoading || albumsLoading;
  const isImagesLoading = !allImagesLoaded && imagesToPreload.length > 0;
  const isOverallLoading = isDataLoading || isImagesLoading;

  const isDataError = artistError || tracksError;
  const isImageError = !allImagesLoaded && imagesToPreload.length === 0;
  const isOverallError = isDataError || isImageError;

  if (isOverallLoading) {
    return (
      <div className="w-full min-h-screen pl-4 pr-4 sm:pl-8 sm:pr-8 xl:pl-[22vw] xl:pr-[2vw] flex flex-col gap-5 mb-45 xl:mb-5">
        <Header artist={{} as Artist} isLoading={true} />
        <MainMenu
          isLoading={true}
          artist={{} as Artist}
          albums={[]}
          tracks={[]}
          tracksError={null}
          isFollowing={false}
          toggleFollow={() => Promise.resolve()}
        />
      </div>
    );
  }

  if (isOverallError) {
    return (
      <div className="w-full min-h-screen pl-4 pr-4 sm:pl-8 sm:pr-8 lg:pl-[22vw] lg:pr-[2vw] flex items-center justify-center">
        <div className="flex flex-col items-center gap-6 text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
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

          <div>
            <h2 className="text-white text-xl font-semibold mb-2">
              {artistError?.includes("not found")
                ? "Artist not found"
                : "Loading error"}
            </h2>
            <p className="text-white/70 text-sm mb-1">
              {artistError?.includes("not found")
                ? `Artist with ID "${artistId}" doesn't exist or has been removed`
                : artistError}
            </p>
            <p className="text-white/50 text-xs">
              Please check the URL or try searching for the artist
            </p>
          </div>

          <div className="flex gap-3 flex-wrap justify-center">
            <button
              onClick={refetchArtist}
              className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors duration-200 flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-white/20"
              aria-label="Retry loading artist"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Try again
            </button>

            <button
              onClick={() => window.history.back()}
              className="px-6 py-2 bg-white/5 hover:bg-white/10 text-white/70 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white/20"
              aria-label="Go back to previous page"
            >
              Go back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="w-full min-h-screen pl-4 pr-4 sm:pl-8 sm:pr-8 xl:pl-[22vw] xl:pr-[2vw] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="text-white/60 text-lg">Artist data unavailable</div>
          <button
            onClick={refetchArtist}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white/20"
            aria-label="Refresh artist data"
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="w-full min-h-screen pl-4 pr-4 sm:pl-8 sm:pr-8 xl:pl-[22vw] xl:pr-[2vw] flex flex-col gap-5 mb-45 xl:mb-5">
      <Header artist={artist} isLoading={false} />
      <MainMenu
        isLoading={false}
        tracks={tracks}
        tracksError={tracksError}
        artist={artist}
        albums={albums}
        isFollowing={isFollowing}
        isFollowingLoading={isFollowingLoading}
        toggleFollow={toggleFollow}
      />
    </main>
  );
};

export default memo(Artist);
