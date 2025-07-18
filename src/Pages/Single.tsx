import { useLocation } from "react-router-dom";
import { useEffect, useState, useCallback, memo } from "react";
import type { Track } from "../types/TrackData";
import Header from "../components/Single/Header";
import MainMenu from "../components/Single/MainMenu";

/**
 * Single track page component displaying individual track information and controls
 * Handles track data fetching, loading states, and error management
 */
const Single = () => {
  const location = useLocation();

  // Extract track ID from URL path
  const trackId = location.pathname.split("/single/")[1];

  // Local state management
  const [isLoading, setIsLoading] = useState(false);
  const [track, setTrack] = useState<Track>({} as Track);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch track data from API with comprehensive error handling
   */
  const loadTrack = useCallback(async () => {
    if (!trackId) {
      setError("Invalid track ID");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `http://localhost:5000/api/tracks/${encodeURIComponent(trackId)}`,
        {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message ||
            errorData.error ||
            `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const contentType = response.headers.get("content-type");
      if (!contentType?.includes("application/json")) {
        throw new Error("Invalid response format - expected JSON");
      }

      const data = await response.json();

      // Validate response structure
      if (!data || typeof data !== "object") {
        throw new Error("Invalid response format");
      }

      setTrack(data.data || data);
    } catch (error) {
      let errorMessage = "Unknown error occurred";

      if (error instanceof Error) {
        errorMessage = error.message;
      }

      // Provide user-friendly error messages
      if (
        errorMessage.includes("Failed to fetch") ||
        errorMessage.includes("NetworkError")
      ) {
        errorMessage = "Network connection error";
      } else if (errorMessage.includes("HTTP 404")) {
        errorMessage = "Track not found";
      } else if (errorMessage.includes("HTTP 500")) {
        errorMessage = "Server error";
      }

      console.error("Track loading error:", error);
      setError(errorMessage);
      setTrack({} as Track);
    } finally {
      setIsLoading(false);
    }
  }, [trackId]);

  // Load track data on component mount and when trackId changes
  useEffect(() => {
    loadTrack();
  }, [loadTrack]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="w-full min-h-screen pl-4 pr-4 sm:pl-8 sm:pr-8 xl:pl-[22vw] xl:pr-[2vw] flex flex-col gap-5">
        <Header track={{} as Track} isLoading={true} />
        <MainMenu track={{} as Track} isLoading={true} />
      </div>
    );
  }

  // Show error state
  if (error) {
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
              onClick={loadTrack}
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

  // Show message if no track data available
  if (!track || !track.name) {
    return (
      <div className="w-full min-h-screen pl-4 pr-4 sm:pl-8 sm:pr-8 xl:pl-[22vw] xl:pr-[2vw] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="text-white/60 text-lg">Track data unavailable</div>
          <button
            onClick={loadTrack}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white/20"
            aria-label="Reload track data"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }

  // Main content render - track data loaded successfully
  return (
    <main className="w-full min-h-screen pl-4 pr-4 sm:pl-8 sm:pr-8 xl:pl-[22vw] xl:pr-[2vw] flex flex-col gap-5">
      <Header track={track} isLoading={false} />
      <MainMenu track={track} isLoading={false} />
    </main>
  );
};

export default memo(Single);
