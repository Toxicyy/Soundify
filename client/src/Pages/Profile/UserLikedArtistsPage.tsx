// UserLikedArtistsPage.tsx - Responsive with authentication
import { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { useUserLikedArtists } from "../../hooks/useUserLikedArtists";
import { useUserData } from "../../hooks/useUserData";
import { useGetUserQuery } from "../../state/UserApi.slice";
import ProfileArtistTemplate from "../../components/Profile/components/ProfileArtistTemplate";

/**
 * User Liked Artists Page - Responsive design with authentication
 *
 * RESPONSIVE DESIGN:
 * - Adaptive padding: pl-4 (mobile) to pl-[22vw] (desktop with player)
 * - Responsive grid: 2 cols (mobile) to 6 cols (xl desktop)
 * - Mobile-optimized pagination with proper touch targets
 * - Flexible header layout that works on all screen sizes
 *
 * AUTHENTICATION & ACCESS CONTROL:
 * - Checks user authentication before allowing access
 * - Shows auth warning for unauthenticated users
 * - Different content visibility based on user permissions
 * - Proper error handling with retry functionality
 *
 * LAYOUT BREAKPOINTS:
 * - Mobile (< 640px): 2 columns, compact spacing
 * - Tablet (640px - 768px): 3 columns
 * - Medium (768px - 1024px): 4 columns
 * - Large (1024px - 1280px): 5 columns
 * - XL (>= 1280px): 6 columns with full sidebar
 *
 * PERFORMANCE FEATURES:
 * - Efficient pagination with smooth scrolling
 * - Optimized loading states with skeleton UI
 * - Smart error handling with user-friendly messages
 * - Responsive image loading with proper fallbacks
 */

/**
 * Authentication Warning Component
 */
const AuthenticationWarning = () => (
  <div className="min-h-screen w-full flex items-center justify-center p-4">
    <div className="max-w-md w-full bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl border border-white/10 rounded-2xl p-8 text-center shadow-2xl">
      <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center">
        <svg
          className="w-8 h-8 text-blue-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-white mb-4">
        Authentication Required
      </h1>
      <p className="text-white/70 mb-6">
        You need to be logged in to view user profiles and liked artists.
      </p>
      <div className="space-y-3">
        <button
          onClick={() => (window.location.href = "/login")}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200"
        >
          Sign In
        </button>
        <button
          onClick={() => (window.location.href = "/register")}
          className="w-full bg-transparent border border-white/20 hover:border-white/40 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200"
        >
          Create Account
        </button>
      </div>
    </div>
  </div>
);

/**
 * Error Display Component
 */
const ErrorDisplay = ({
  error,
  onRetry,
}: {
  error: string;
  onRetry: () => void;
}) => (
  <div className="min-h-screen w-full flex items-center justify-center p-4">
    <div className="max-w-md w-full bg-red-50/10 border border-red-200/20 rounded-2xl p-6 text-center">
      <svg
        className="h-12 w-12 text-red-400 mx-auto mb-4"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
          clipRule="evenodd"
        />
      </svg>
      <h2 className="text-xl font-semibold text-white mb-2">
        Error Loading Artists
      </h2>
      <p className="text-red-300 mb-4">{error}</p>
      <button
        onClick={onRetry}
        className="bg-red-100/20 hover:bg-red-100/30 text-red-300 px-4 py-2 rounded-xl transition-colors duration-200"
      >
        Try Again
      </button>
    </div>
  </div>
);

const UserLikedArtistsPage = () => {
  const location = useLocation();
  const userId = location.pathname.split("/")[2];
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 20;

  // Authentication check
  const { data: currentUser, isLoading: isCurrentUserLoading } =
    useGetUserQuery();
  const isAuthenticated = !!currentUser && !isCurrentUserLoading;

  // Access control
  const hasAccess =
    isAuthenticated &&
    (userId === currentUser?._id || currentUser?.status === "ADMIN");

  // Data fetching
  const { data: userData, isLoading: userLoading } = useUserData(userId || "");
  const { artists, isLoading, error, pagination, refetch, hasData } =
    useUserLikedArtists(userId || "", {
      page: currentPage,
      limit,
    });

  // Handle page changes with smooth scrolling
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Show authentication warning for unauthenticated users
  if (!isAuthenticated && !isCurrentUserLoading) {
    return <AuthenticationWarning />;
  }

  // Show error state
  if (error && !isLoading) {
    return <ErrorDisplay error={error} onRetry={refetch} />;
  }

  return (
    <div className="min-h-screen w-full flex flex-col mb-35 xl:mb-0">
      {/* 
        Responsive container with adaptive padding:
        - Mobile: pl-4 pr-4 (no sidebar)
        - Tablet: pl-6 pr-6 (partial sidebar)
        - Desktop: pl-[22vw] pr-[2vw] (full sidebar with player)
      */}
      <div className="flex-1 pl-4 pr-4 md:pl-6 md:pr-6 xl:pl-[22vw] xl:pr-[2vw] py-4 sm:py-6 transition-all duration-300 ">
        <div className="max-w-7xl mx-auto">
          {/* Responsive Header */}
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
              <button
                onClick={() => navigate(`/profile/${userId}`)}
                className="w-10 h-10 sm:w-12 sm:h-12 bg-black/30 hover:bg-black/50 backdrop-blur-sm border border-white/20 rounded-full flex items-center justify-center text-white transition-all duration-200 hover:scale-105 self-start"
                aria-label="Back to profile"
              >
                <ArrowLeftOutlined className="text-sm sm:text-base" />
              </button>
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">
                  {hasAccess
                    ? "Following Artists"
                    : `${userData?.username || "User"} is Following`}
                </h1>
                <p className="text-white/60 mt-1 text-sm sm:text-base">
                  {pagination?.totalArtists || 0} artists
                </p>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {(isLoading || userLoading) && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-6">
              {Array.from({ length: 12 }).map((_, index) => (
                <ProfileArtistTemplate
                  key={index}
                  artist={{} as any}
                  isLoading={true}
                />
              ))}
            </div>
          )}

          {/* Content */}
          {!isLoading && !userLoading && (
            <>
              {hasData ? (
                <>
                  {/* Responsive Artists Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-6 mb-8">
                    {artists.map((artist) => (
                      <ProfileArtistTemplate key={artist._id} artist={artist} />
                    ))}
                  </div>

                  {/* Responsive Pagination */}
                  {pagination && pagination.totalPages > 1 && (
                    <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-8">
                      {/* Previous Button */}
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={!pagination.hasPreviousPage}
                        className="w-full sm:w-auto px-4 py-2 bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:text-white/30 text-white rounded-lg transition-colors disabled:cursor-not-allowed text-sm sm:text-base"
                      >
                        Previous
                      </button>

                      {/* Page Numbers */}
                      <div className="flex gap-1 overflow-x-auto pb-2 sm:pb-0">
                        {Array.from(
                          { length: Math.min(5, pagination.totalPages) },
                          (_, i) => {
                            const pageNum =
                              Math.max(
                                1,
                                Math.min(
                                  pagination.totalPages - 4,
                                  Math.max(1, currentPage - 2)
                                )
                              ) + i;
                            if (pageNum > pagination.totalPages) return null;

                            return (
                              <button
                                key={pageNum}
                                onClick={() => handlePageChange(pageNum)}
                                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg transition-colors text-sm sm:text-base ${
                                  pageNum === currentPage
                                    ? "bg-white text-black"
                                    : "bg-white/10 hover:bg-white/20 text-white"
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          }
                        )}
                      </div>

                      {/* Next Button */}
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={!pagination.hasNextPage}
                        className="w-full sm:w-auto px-4 py-2 bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:text-white/30 text-white rounded-lg transition-colors disabled:cursor-not-allowed text-sm sm:text-base"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              ) : (
                /* Responsive Empty State */
                <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-center px-4">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white/5 rounded-full flex items-center justify-center mb-6">
                    <svg
                      className="w-10 h-10 sm:w-12 sm:h-12 text-white/40"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">
                    {hasAccess
                      ? "No artists followed yet"
                      : "Not following any artists"}
                  </h3>
                  <p className="text-white/60 mb-6 max-w-md text-sm sm:text-base">
                    {hasAccess
                      ? "Discover and follow your favorite artists to see them here."
                      : "This user hasn't followed any artists yet."}
                  </p>
                  {hasAccess && (
                    <Link
                      to="/artists"
                      className="bg-white text-black px-6 py-3 rounded-full font-medium hover:bg-white/90 transition-colors text-sm sm:text-base"
                    >
                      Discover Artists
                    </Link>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserLikedArtistsPage;
