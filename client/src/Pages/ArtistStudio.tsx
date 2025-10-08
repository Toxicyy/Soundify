import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import ArtistStudioHeader from "../components/ArtistStudio/ArtistStudioHeader";
import { useArtistData } from "../hooks/useArtistData";
import { useGetUserQuery } from "../state/UserApi.slice";
import { useNotification } from "../hooks/useNotification";
import { type Artist } from "../types/ArtistData";
import { api } from "../shared/api";

/**
 * Artist Studio - main page for artists
 * Complex parts: Access control, stats loading, error handling, responsive layout
 */

interface DashboardStats {
  totalTracks: number;
  totalFollowers: number;
  isVerified: boolean;
  monthlyListeners?: number;
  totalPlays?: number;
}

interface ArtistStudioError {
  type: "access_denied" | "artist_not_found" | "network_error" | "unknown";
  message: string;
  canRetry: boolean;
}

export default function ArtistStudio() {
  const navigate = useNavigate();
  const { showWarning, showError } = useNotification();
  const {
    data: user,
    isLoading: isUserLoading,
    error: userError,
  } = useGetUserQuery();

  // State management
  const [artistData, setArtistData] = useState<Artist | null>(null);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalTracks: 0,
    totalFollowers: 0,
    isVerified: false,
  });
  const [error, setError] = useState<ArtistStudioError | null>(null);
  const [isStatsLoading, setIsStatsLoading] = useState(false);

  // Get artist data based on user's artistProfile
  const {
    data: artist,
    loading: artistLoading,
    error: artistError,
    refetch: refetchArtist,
  } = useArtistData(user?.artistProfile || "");

  // Memoized access check
  const hasArtistAccess = useMemo(() => {
    return !isUserLoading && user && user.artistProfile;
  }, [isUserLoading, user]);

  // Error handling with typing
  const handleError = useCallback(
    (
      errorType: ArtistStudioError["type"],
      message: string,
      canRetry: boolean = true
    ) => {
      const errorObj: ArtistStudioError = {
        type: errorType,
        message,
        canRetry,
      };
      setError(errorObj);

      if (errorType === "access_denied") {
        showWarning(
          "You need to become an artist first to access Artist Studio"
        );
      } else {
        showError(message);
      }
    },
    [showWarning, showError]
  );

  // Access check - only artists can visit this page
  useEffect(() => {
    if (!isUserLoading && user && !user.artistProfile) {
      handleError(
        "access_denied",
        "Access denied: Artist profile required",
        false
      );
      navigate("/become-an-artist");
      return;
    }

    if (userError) {
      handleError("network_error", "Failed to load user data");
    }
  }, [user, isUserLoading, userError, navigate, handleError]);

  // Load artist stats
  const loadArtistStats = useCallback(
    async (artistId: string) => {
      if (!artistId || isStatsLoading) return;

      setIsStatsLoading(true);
      try {
        const [tracksResponse] = await Promise.allSettled([
          api.artist.getArtistTracks(artistId, 1),
        ]);

        let tracksCount = 0;
        let additionalStats = {};

        if (tracksResponse.status === "fulfilled" && tracksResponse.value.ok) {
          const tracksData = await tracksResponse.value.json();
          tracksCount = tracksData.total || tracksData.data?.length || 0;
        }

        setDashboardStats((prev) => ({
          ...prev,
          totalTracks: tracksCount,
          ...additionalStats,
        }));
      } catch (error) {
        console.error("Error loading artist stats:", error);
      } finally {
        setIsStatsLoading(false);
      }
    },
    [isStatsLoading]
  );

  // Update local artist data when receiving data from server
  useEffect(() => {
    if (artist && artist._id) {
      const hasArtistChanged = !artistData || artistData._id !== artist._id;

      setArtistData(artist);
      setDashboardStats((prev) => ({
        ...prev,
        totalFollowers: artist.followerCount || 0,
        isVerified: artist.isVerified || false,
      }));

      if (hasArtistChanged) {
        loadArtistStats(artist._id);
      }

      setError(null);
    }

    if (artistError) {
      handleError("artist_not_found", artistError, true);
    }
  }, [artist, artistError, loadArtistStats, artistData]);

  // Artist update handler
  const handleArtistUpdate = useCallback((updatedFields: Partial<Artist>) => {
    setArtistData((prev) => (prev ? { ...prev, ...updatedFields } : null));
  }, []);

  // Retry function
  const handleRetry = useCallback(() => {
    setError(null);
    refetchArtist();
  }, [refetchArtist]);

  // Error component
  const ErrorComponent = useMemo(() => {
    if (!error) return null;

    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 flex items-center justify-center px-4 xl:pl-[22vw] xl:pr-[2vw]">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-6 text-center max-w-md mx-auto"
        >
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
              Artist Studio Error
            </h2>
            <p className="text-white/70 text-sm mb-1">{error.message}</p>
            <p className="text-white/50 text-xs">
              {error.canRetry
                ? "Please try refreshing the page or contact support"
                : "Please check your permissions and try again"}
            </p>
          </div>

          <div className="flex gap-3 flex-wrap justify-center">
            {error.canRetry && (
              <button
                onClick={handleRetry}
                className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors duration-200 flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-white/20"
                aria-label="Retry loading artist data"
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
            )}

            {error.type === "access_denied" && (
              <button
                onClick={() => navigate("/become-an-artist")}
                className="px-6 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-400/20"
                aria-label="Become an artist"
              >
                Become an Artist
              </button>
            )}
          </div>
        </motion.div>
      </div>
    );
  }, [error, handleRetry, navigate]);

  // Loading component
  const LoadingComponent = useMemo(
    () => (
      <div className="min-h-screen w-full bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900">
        {/* Header */}
        <div className="w-full px-4 xl:px-0 xl:pl-[22vw] xl:pr-[2vw] py-5">
          <ArtistStudioHeader
            artist={{
              _id: "",
              name: "",
              bio: "",
              avatar: "",
              albums: [],
              genres: [],
              slug: "",
              isVerified: false,
              followerCount: 0,
              socialLinks: null,
              createdAt: "",
              updatedAt: "",
            }}
            tracksCount={0}
            isLoading={true}
          />
        </div>

        {/* Content */}
        <div className="w-full px-4 xl:px-0 xl:pl-[22vw] xl:pr-[2vw] pb-36 xl:pb-8">
          <div className="space-y-6">
            {/* Dashboard Overview Skeleton */}
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6">
              <div className="space-y-4">
                <div className="h-6 bg-white/20 rounded-lg w-48 animate-pulse"></div>
                <div className="h-4 bg-white/15 rounded w-full animate-pulse"></div>
                <div className="h-4 bg-white/15 rounded w-3/4 animate-pulse"></div>
              </div>
            </div>

            {/* Stats Grid Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4"
                >
                  <div className="h-6 bg-white/20 rounded-lg w-32 mb-4 animate-pulse"></div>
                  <div className="space-y-3">
                    <div className="h-8 bg-white/15 rounded w-16 animate-pulse"></div>
                    <div className="h-4 bg-white/15 rounded w-24 animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Activity Sections Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6"
                >
                  <div className="h-6 bg-white/20 rounded-lg w-32 mb-4 animate-pulse"></div>
                  <div className="space-y-3">
                    <div className="h-4 bg-white/15 rounded w-full animate-pulse"></div>
                    <div className="h-4 bg-white/15 rounded w-5/6 animate-pulse"></div>
                    <div className="h-4 bg-white/15 rounded w-4/6 animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    ),
    []
  );

  // Dashboard content
  const DashboardContent = useMemo(() => {
    if (!artistData) return null;

    const formatNumber = (num: number): string => {
      if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
      if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
      return num.toString();
    };

    return (
      <div className="space-y-6">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-2 h-8 bg-gradient-to-b from-[#1db954] to-[#1ed760] rounded-full"></div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              Dashboard Overview
            </h2>
          </div>
          <p className="text-white/70 text-sm sm:text-base mb-6">
            Welcome to your Artist Studio! Here you can manage your tracks, view
            analytics, and update your profile.
          </p>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Total Tracks */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-white/20 transition-all duration-200"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-white font-semibold text-sm">
                  Total Tracks
                </h3>
                <svg
                  className="w-4 h-4 text-blue-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v6.114a4 4 0 10.994 7.886c.065 0 .131-.006.196-.018l10-2A1 1 0 0018 16V3z" />
                </svg>
              </div>
              <p className="text-2xl font-bold text-blue-400 mb-1">
                {dashboardStats.totalTracks}
              </p>
              <p className="text-xs text-white/50">Tracks uploaded</p>
            </motion.div>

            {/* Followers */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-white/20 transition-all duration-200"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-white font-semibold text-sm">Followers</h3>
                <svg
                  className="w-4 h-4 text-purple-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
              </div>
              <p className="text-2xl font-bold text-purple-400 mb-1">
                {formatNumber(dashboardStats.totalFollowers)}
              </p>
              <p className="text-xs text-white/50">People following you</p>
            </motion.div>

            {/* Status */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-white/20 transition-all duration-200"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-white font-semibold text-sm">Status</h3>
                {dashboardStats.isVerified ? (
                  <svg
                    className="w-4 h-4 text-green-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-4 h-4 text-yellow-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
              <p
                className={`text-2xl font-bold mb-1 ${
                  dashboardStats.isVerified
                    ? "text-green-400"
                    : "text-yellow-400"
                }`}
              >
                {dashboardStats.isVerified ? "Verified" : "Pending"}
              </p>
              <p className="text-xs text-white/50">Account verification</p>
            </motion.div>
          </div>
        </motion.div>

        {/* Activity Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <h3 className="text-xl font-bold text-white">Recent Activity</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-blue-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-white text-sm font-medium">
                    Profile Updated
                  </p>
                  <p className="text-white/60 text-xs">
                    Your artist profile was updated
                  </p>
                </div>
                <span className="text-white/50 text-xs">2 hours ago</span>
              </div>

              <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-green-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v6.114a4 4 0 10.994 7.886c.065 0 .131-.006.196-.018l10-2A1 1 0 0018 16V3z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-white text-sm font-medium">
                    New Track Uploaded
                  </p>
                  <p className="text-white/60 text-xs">
                    Track processing completed
                  </p>
                </div>
                <span className="text-white/50 text-xs">1 day ago</span>
              </div>

              <div className="text-center py-2">
                <button className="text-green-400 hover:text-green-300 text-sm font-medium transition-colors">
                  View All Activity
                </button>
              </div>
            </div>
          </motion.div>

          {/* Quick Stats */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
              <h3 className="text-xl font-bold text-white">Quick Stats</h3>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-white/70 text-sm">
                  This Month's Plays
                </span>
                <span className="text-white font-semibold">N/A</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/70 text-sm">Total Plays</span>
                <span className="text-white font-semibold">N/A</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/70 text-sm">Completion Rate</span>
                <span className="text-green-400 font-semibold">85%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/70 text-sm">Account Status</span>
                <span
                  className={`font-semibold ${
                    dashboardStats.isVerified
                      ? "text-green-400"
                      : "text-yellow-400"
                  }`}
                >
                  {dashboardStats.isVerified ? "Active" : "Under Review"}
                </span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-white/10">
              <button className="text-purple-400 hover:text-purple-300 text-sm font-medium transition-colors">
                View Detailed Analytics
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }, [artistData, dashboardStats]);

  // Handle loading and error states
  if (error) return ErrorComponent;
  if (isUserLoading || artistLoading || !artistData) return LoadingComponent;
  if (!hasArtistAccess) return null;

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900">
      <div className="w-full px-4 xl:px-0 xl:pl-[22vw] xl:pr-[2vw] py-5">
        <ArtistStudioHeader
          artist={artistData}
          tracksCount={dashboardStats.totalTracks}
          isLoading={false}
          onArtistUpdate={handleArtistUpdate}
        />
      </div>

      {/* Main content */}
      <div className="w-full px-4 xl:px-0 xl:pl-[22vw] xl:pr-[2vw] pb-36 xl:pb-8">
        <AnimatePresence mode="wait">{DashboardContent}</AnimatePresence>
      </div>
    </div>
  );
}