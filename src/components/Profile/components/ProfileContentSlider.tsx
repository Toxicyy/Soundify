import { useState, useRef, type FC, useEffect, useCallback, memo } from "react";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";
import { useUserPlaylists } from "../../../hooks/useUserPlaylists";
import { useUserLikedPlaylists } from "../../../hooks/useUserLikedPlaylists";
import ProfilePlaylistTemplate from "./ProfilePlaylistTemplate";

interface ProfileContentSliderProps {
  userId: string;
  isLoading?: boolean;
  hasAccess?: boolean;
}

type TabType = "playlists" | "liked-playlists";

/**
 * Profile content slider displaying user's playlists and liked playlists
 * Features horizontal scrolling with navigation arrows and responsive design
 */
const ProfileContentSlider: FC<ProfileContentSliderProps> = ({
  userId,
  isLoading = false,
  hasAccess = false,
}) => {
  // State management
  const [currentTab, setCurrentTab] = useState<TabType>("playlists");
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  // Refs
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Hooks for data fetching
  const userPlaylistsResult = useUserPlaylists(userId, {
    limit: 12,
    autoFetch: currentTab === "playlists",
    // Don't filter by privacy for hasAccess users - they see all playlists
    privacy: hasAccess ? undefined : "public",
  });

  const likedPlaylistsResult = useUserLikedPlaylists(userId, {
    limit: 12,
    autoFetch: currentTab === "liked-playlists",
  });

  // Choose current data based on active tab
  const currentResult =
    currentTab === "playlists" ? userPlaylistsResult : likedPlaylistsResult;
  const currentItems = currentResult.playlists;
  const hasContent = currentItems.length > 0;
  const isCurrentLoading = currentResult.isLoading;
  const currentError = currentResult.error;

  /**
   * Handle scroll event to update arrow visibility
   */
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    const maxScrollLeft = scrollWidth - clientWidth;

    const canScroll = maxScrollLeft > 0;
    setShowLeftArrow(canScroll && scrollLeft > 10);
    setShowRightArrow(canScroll && scrollLeft < maxScrollLeft - 10);
  }, []);

  /**
   * Scroll container to the left
   */
  const scrollLeft = useCallback(() => {
    scrollContainerRef.current?.scrollBy({
      left: -300,
      behavior: "smooth",
    });
  }, []);

  /**
   * Scroll container to the right
   */
  const scrollRight = useCallback(() => {
    scrollContainerRef.current?.scrollBy({
      left: 300,
      behavior: "smooth",
    });
  }, []);

  /**
   * Handle tab change with accessibility
   */
  const handleTabChange = useCallback((tab: TabType) => {
    setCurrentTab(tab);
    scrollContainerRef.current?.scrollTo({ left: 0, behavior: "smooth" });
  }, []);

  // Effects
  useEffect(() => {
    handleScroll();
  }, [currentItems, handleScroll]);

  // Show loading state
  if (isLoading || isCurrentLoading) {
    return (
      <div className="overflow-hidden">
        <div className="h-8 w-32 bg-gradient-to-r from-white/15 via-white/25 to-white/15 backdrop-blur-md border border-white/25 rounded-lg relative overflow-hidden mb-4">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/35 to-transparent -skew-x-12 animate-shimmer"></div>
        </div>

        {/* Tab skeletons */}
        <div className="flex gap-3 mb-6 px-2">
          {Array.from({ length: 2 }).map((_, index) => (
            <div
              key={index}
              className="h-10 w-32 bg-gradient-to-r from-white/10 via-white/20 to-white/10 backdrop-blur-md border border-white/20 rounded-full relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-shimmer-delayed"></div>
            </div>
          ))}
        </div>

        {/* Content skeletons */}
        <div className="flex gap-5 px-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex-shrink-0">
              <ProfilePlaylistTemplate
                playlist={{} as any}
                isLoading={true}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Get counts for tab labels
  const playlistsCount =
    userPlaylistsResult.pagination?.totalPlaylists ||
    userPlaylistsResult.playlists.length;
  const likedPlaylistsCount =
    likedPlaylistsResult.pagination?.totalPlaylists ||
    likedPlaylistsResult.playlists.length;

  return (
    <section
      className="overflow-hidden"
      aria-labelledby="playlists-section-title"
    >
      <div className="flex items-center justify-between mb-4">
        <h2
          id="playlists-section-title"
          className="text-white text-2xl sm:text-3xl font-bold"
        >
          Playlists
        </h2>

        {/* View All button */}
        {hasContent && (
          <Link
            to={`/profile/${userId}/${currentTab}`}
            className="text-white/70 hover:text-white text-sm sm:text-base transition-colors duration-200 hover:underline"
          >
            View All
          </Link>
        )}
      </div>

      {/* Tab navigation */}
      <div className="flex gap-3 mb-6 px-2 flex-wrap" role="tablist">
        <button
          role="tab"
          aria-selected={currentTab === "playlists"}
          aria-controls="playlists-panel"
          className={`${
            currentTab === "playlists"
              ? "text-black bg-white"
              : "text-white bg-transparent"
          } text-base sm:text-xl px-4 sm:px-5 py-1 border-2 border-white/70 rounded-full cursor-pointer hover:scale-110 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white/20`}
          onClick={() => handleTabChange("playlists")}
        >
          Playlists ({playlistsCount})
        </button>

        <button
          role="tab"
          aria-selected={currentTab === "liked-playlists"}
          aria-controls="liked-playlists-panel"
          className={`${
            currentTab === "liked-playlists"
              ? "text-black bg-white"
              : "text-white bg-transparent"
          } text-base sm:text-xl px-4 sm:px-5 py-1 border-2 border-white/70 rounded-full cursor-pointer hover:scale-110 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white/20`}
          onClick={() => handleTabChange("liked-playlists")}
        >
          Liked Playlists ({likedPlaylistsCount})
        </button>
      </div>

      {/* Error state */}
      {currentError && (
        <div className="bg-red-50/10 border border-red-200/20 rounded-lg p-4 mb-4">
          <div className="flex items-center">
            <svg
              className="h-5 w-5 text-red-400 mr-2"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-red-300 text-sm">{currentError}</p>
          </div>
          <button
            onClick={currentResult.refetch}
            className="mt-2 bg-red-100/20 hover:bg-red-100/30 text-red-300 px-3 py-1 rounded text-sm transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Content area with horizontal scrolling */}
      <div className="relative group">
        {/* Left navigation arrow */}
        {showLeftArrow && hasContent && (
          <button
            onClick={scrollLeft}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 sm:w-10 sm:h-10 bg-black/50 hover:bg-black/70 backdrop-blur-sm border border-white/20 rounded-full flex items-center justify-center text-white transition-all duration-200 opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-white/20"
            aria-label="Scroll left"
          >
            <LeftOutlined />
          </button>
        )}

        {/* Right navigation arrow */}
        {showRightArrow && hasContent && (
          <button
            onClick={scrollRight}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 sm:w-10 sm:h-10 bg-black/50 hover:bg-black/70 backdrop-blur-sm border border-white/20 rounded-full flex items-center justify-center text-white transition-all duration-200 opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-white/20"
            aria-label="Scroll right"
          >
            <RightOutlined />
          </button>
        )}

        {/* Scrollable content container */}
        <div
          ref={scrollContainerRef}
          className="albums-scroll-light overflow-x-auto pb-4 py-2"
          onScroll={handleScroll}
          role="tabpanel"
          id={`${currentTab}-panel`}
          aria-labelledby={`${currentTab}-tab`}
        >
          <div className="flex gap-3 sm:gap-5 min-w-max px-2">
            {hasContent ? (
              currentItems.map((playlist, index) => (
                <div
                  key={playlist._id || index}
                  className="flex-shrink-0 scroll-snap-align-start"
                >
                  <ProfilePlaylistTemplate playlist={playlist} />
                </div>
              ))
            ) : (
              <div className="text-white/60 text-base sm:text-lg py-8 px-4 text-center w-full">
                {currentTab === "playlists"
                  ? hasAccess
                    ? "No playlists created yet"
                    : "No public playlists found"
                  : "No liked playlists found"}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default memo(ProfileContentSlider);
