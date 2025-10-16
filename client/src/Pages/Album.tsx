import { useLocation } from "react-router-dom";
import { memo, useMemo } from "react";
import Header from "../components/Album/Header";
import MainMenu from "../components/Album/MainMenu";
import { useAlbumTracks } from "../hooks/useAlbumTracks";
import { useImagePreloader } from "../hooks/useImagePreloader";

/**
 * Album page component
 * Displays album information and tracks with loading/error states
 */
const Album = () => {
  const location = useLocation();
  const albumId = location.pathname.split("/album/")[1];

  const { album, tracks, isLoading, error } = useAlbumTracks(albumId, {
    limit: 30,
  });

  const imagesToPreload = useMemo(
    () =>
      [album?.coverUrl, ...tracks.map((track) => track.coverUrl)].filter(
        Boolean
      ) as string[],
    [album?.coverUrl, tracks]
  );

  const { allImagesLoaded } = useImagePreloader(imagesToPreload);

  const isOverallLoading = useMemo(
    () => isLoading || (!allImagesLoaded && imagesToPreload.length > 0),
    [isLoading, allImagesLoaded, imagesToPreload.length]
  );

  if (isOverallLoading) {
    return (
      <div className="w-full min-h-screen pl-4 pr-4 sm:pl-8 sm:pr-8 xl:pl-[22vw] xl:pr-[2vw] flex flex-col gap-5 mb-45 xl:mb-5">
        <Header tracks={[]} album={{} as any} isLoading={true} />
        <MainMenu tracks={[]} isLoading={true} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full min-h-screen pl-4 pr-4 sm:pl-8 sm:pr-8 xl:pl-[22vw] xl:pr-[2vw] flex items-center justify-center mb-45 xl:mb-5">
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
              {error.includes("not found")
                ? "Album not found"
                : "Loading error"}
            </h2>
            <p className="text-white/70 text-sm mb-1">
              {error.includes("not found")
                ? `Album with ID "${albumId}" doesn't exist or has been removed`
                : error}
            </p>
            <p className="text-white/50 text-xs">
              Please check the URL or try searching for the album
            </p>
          </div>

          <div className="flex gap-3 flex-wrap justify-center">
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors duration-200 flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-white/20"
              aria-label="Retry loading album"
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

  if (!album || !album.name) {
    return (
      <div className="w-full min-h-screen pl-4 pr-4 sm:pl-8 sm:pr-8 xl:pl-[22vw] xl:pr-[2vw] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="text-white/60 text-lg">Album data unavailable</div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white/20"
            aria-label="Refresh page"
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="w-full min-h-screen pl-4 pr-4 sm:pl-8 sm:pr-8 xl:pl-[22vw] xl:pr-[2vw] flex flex-col gap-5 mb-45 xl:mb-5">
      <Header tracks={tracks} album={album} isLoading={false} />
      <MainMenu tracks={tracks} isLoading={false} />
    </main>
  );
};

export default memo(Album);
