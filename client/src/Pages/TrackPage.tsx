import { useEffect, memo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTrackPage } from "../hooks/useTrackPage";
import TrackPageContent from "../components/TrackPage/TrackPageContent";

/**
 * Track page component displaying detailed track information
 */
const TrackPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const trackId = location.pathname.split("/track/")[1];
  const { track, loading, error, refetch } = useTrackPage(trackId);

  useEffect(() => {
    if (track) {
      const artistName =
        typeof track.artist === "string" ? track.artist : track.artist?.name;
      document.title = `${track.name} - ${artistName} | Soundify`;
    } else {
      document.title = "Track Details | Soundify";
    }

    return () => {
      document.title = "Soundify";
    };
  }, [track]);

  if (loading) {
    return (
      <div className="w-full min-h-screen pl-4 pr-4 sm:pl-8 sm:pr-8 xl:pl-[22vw] xl:pr-[2vw] flex flex-col gap-8 mb-45 xl:mb-5">
        <div className="mt-12 bg-white/10 rounded-2xl p-6 sm:p-8 border border-white/20">
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
            <div className="w-full max-w-[250px] sm:max-w-[300px] mx-auto lg:mx-0">
              <div className="aspect-square bg-gradient-to-br from-white/10 via-white/20 to-white/5 border border-white/20 rounded-lg relative overflow-hidden shadow-lg">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-shimmer"></div>
              </div>
            </div>

            <div className="flex-1 flex flex-col gap-6 w-full">
              <div className="space-y-4">
                <div className="h-8 sm:h-12 w-3/4 bg-gradient-to-r from-white/10 via-white/20 to-white/10 border border-white/20 rounded-md relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-shimmer"></div>
                </div>
                <div className="h-6 sm:h-8 w-1/2 bg-gradient-to-r from-white/8 via-white/15 to-white/8 border border-white/15 rounded-md relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -skew-x-12 animate-shimmer-delayed"></div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-r from-white/10 via-white/20 to-white/10 border border-white/20 rounded-full relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-shimmer"></div>
                </div>
                <div className="w-8 h-8 bg-gradient-to-r from-white/8 via-white/15 to-white/8 border border-white/15 rounded-full relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -skew-x-12 animate-shimmer-delayed"></div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {[...Array(6)].map((_, index) => (
                  <div key={index} className="space-y-2">
                    <div className="h-3 w-16 bg-gradient-to-r from-white/8 via-white/15 to-white/8 border border-white/15 rounded-md relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -skew-x-12 animate-shimmer"></div>
                    </div>
                    <div className="h-5 w-24 bg-gradient-to-r from-white/10 via-white/20 to-white/10 border border-white/20 rounded-md relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-shimmer-delayed"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full min-h-screen pl-4 pr-4 sm:pl-8 sm:pr-8 xl:pl-[22vw] xl:pr-[2vw] flex items-center justify-center">
        <div className="mt-12 bg-white/10 rounded-2xl p-8 border border-white/20 max-w-md w-full">
          <div className="flex flex-col items-center gap-6 text-center">
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
                  ? "Track not found"
                  : "Loading error"}
              </h2>
              <p className="text-white/70 text-sm mb-1">
                {error.includes("not found")
                  ? `Track with ID "${trackId}" doesn't exist or has been removed`
                  : error}
              </p>
              <p className="text-white/50 text-xs">
                Please check the URL or try searching for the track
              </p>
            </div>

            <div className="flex gap-3 flex-wrap justify-center">
              <button
                onClick={refetch}
                className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors duration-200 flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-white/20"
                aria-label="Retry loading track"
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
                onClick={() => navigate(-1)}
                className="px-6 py-2 bg-white/5 hover:bg-white/10 text-white/70 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white/20"
                aria-label="Go back to previous page"
              >
                Go back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!track) {
    return (
      <div className="w-full min-h-screen pl-4 pr-4 sm:pl-8 sm:pr-8 xl:pl-[22vw] xl:pr-[2vw] flex items-center justify-center">
        <div className="mt-12 bg-white/10 rounded-2xl p-8 border border-white/20">
          <div className="flex flex-col items-center gap-4">
            <div className="text-white/60 text-lg">Track data unavailable</div>
            <button
              onClick={refetch}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white/20"
              aria-label="Refresh track data"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="w-full min-h-screen pl-4 pr-4 sm:pl-8 sm:pr-8 xl:pl-[22vw] xl:pr-[2vw] flex flex-col gap-8 mb-45 xl:mb-5">
      <div className="mt-12">
        <TrackPageContent track={track} />
      </div>
    </main>
  );
};

export default memo(TrackPage);