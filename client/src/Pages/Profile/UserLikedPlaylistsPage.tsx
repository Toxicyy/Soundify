import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { useUserLikedPlaylists } from "../../hooks/useUserLikedPlaylists";
import { useUserData } from "../../hooks/useUserData";
import { useGetUserQuery } from "../../state/UserApi.slice";
import ProfilePlaylistTemplate from "../../components/Profile/components/ProfilePlaylistTemplate";

const UserLikedPlaylistsPage = () => {
  const location = useLocation();
  const userId = location.pathname.split("/")[2];
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 20;

  // Get current user for access control
  const { data: currentUser } = useGetUserQuery();
  const hasAccess =
    userId === currentUser?._id || currentUser?.status === "ADMIN";

  // Get user data for header info
  const { data: userData, isLoading: userLoading } = useUserData(userId || "");

  // Get liked playlists with pagination
  const { playlists, isLoading, error, pagination, refetch, hasData } =
    useUserLikedPlaylists(userId || "", {
      page: currentPage,
      limit,
    });

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Redirect if no access to liked playlists
  useEffect(() => {
    if (!hasAccess && userData && !userLoading) {
      navigate(`/profile/${userId}`);
    }
  }, [hasAccess, userData, userLoading, navigate, userId]);

  // Error state
  if (error && !isLoading) {
    return (
      <div className="h-screen w-full mainMenu pl-[22vw] pr-[2vw] flex items-center justify-center">
        <div className="bg-red-50/10 border border-red-200/20 rounded-lg p-6 max-w-md text-center">
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
            Error Loading Liked Playlists
          </h2>
          <p className="text-red-300 mb-4">{error}</p>
          <button
            onClick={refetch}
            className="bg-red-100/20 hover:bg-red-100/30 text-red-300 px-4 py-2 rounded transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Don't render if no access (will redirect)
  if (!hasAccess) {
    return null;
  }

  return (
    <div className="h-screen w-full mainMenu pl-[22vw] pr-[2vw] flex flex-col">
      <div className="flex-1 overflow-y-auto py-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => navigate(`/profile/${userId}`)}
              className="w-10 h-10 bg-black/30 hover:bg-black/50 backdrop-blur-sm border border-white/20 rounded-full flex items-center justify-center text-white transition-all duration-200 hover:scale-105"
              aria-label="Back to profile"
            >
              <ArrowLeftOutlined />
            </button>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white">
                Liked Playlists
              </h1>
              <p className="text-white/60 mt-1">
                {pagination?.totalPlaylists || 0} liked playlists
              </p>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {(isLoading || userLoading) && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {Array.from({ length: 12 }).map((_, index) => (
              <ProfilePlaylistTemplate
                key={index}
                playlist={{} as any}
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
                {/* Playlists Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 mb-8">
                  {playlists.map((playlist) => (
                    <ProfilePlaylistTemplate
                      key={playlist._id}
                      playlist={playlist}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-8">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={!pagination.hasPreviousPage}
                      className="px-4 py-2 bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:text-white/30 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>

                    <div className="flex gap-1">
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
                              className={`w-10 h-10 rounded-lg transition-colors ${
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

                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={!pagination.hasNextPage}
                      className="px-4 py-2 bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:text-white/30 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            ) : (
              /* Empty State */
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6">
                  <svg
                    className="w-12 h-12 text-white/40"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  No liked playlists yet
                </h3>
                <p className="text-white/60 mb-6 max-w-md">
                  Start exploring and liking playlists to see them here.
                </p>
                <Link
                  to="/playlists"
                  className="bg-white text-black px-6 py-3 rounded-full font-medium hover:bg-white/90 transition-colors"
                >
                  Discover Playlists
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default UserLikedPlaylistsPage;
