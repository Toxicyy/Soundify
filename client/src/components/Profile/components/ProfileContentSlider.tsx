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
 * Tabbed horizontal scrollable list of user's playlists
 * Includes owned playlists and liked playlists tabs
 */
const ProfileContentSlider: FC<ProfileContentSliderProps> = ({
  userId,
  isLoading = false,
  hasAccess = false,
}) => {
  const [currentTab, setCurrentTab] = useState<TabType>("playlists");
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const userPlaylistsResult = useUserPlaylists(userId, {
    limit: 12,
    autoFetch: currentTab === "playlists",
    privacy: hasAccess ? undefined : "public",
  });

  const likedPlaylistsResult = useUserLikedPlaylists(userId, {
    limit: 12,
    autoFetch: currentTab === "liked-playlists",
  });

  const currentResult =
    currentTab === "playlists" ? userPlaylistsResult : likedPlaylistsResult;
  const currentItems = currentResult.playlists;
  const hasContent = currentItems.length > 0;
  const isCurrentLoading = currentResult.isLoading;
  const currentError = currentResult.error;

  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    const maxScrollLeft = scrollWidth - clientWidth;
    const canScroll = maxScrollLeft > 0;

    setShowLeftArrow(canScroll && scrollLeft > 10);
    setShowRightArrow(canScroll && scrollLeft < maxScrollLeft - 10);
  }, []);

  const getScrollDistance = useCallback(() => {
    const width = window.innerWidth;
    if (width < 640) return 200;
    if (width < 1024) return 300;
    return 400;
  }, []);

  const scrollLeft = useCallback(() => {
    scrollContainerRef.current?.scrollBy({
      left: -getScrollDistance(),
      behavior: "smooth",
    });
  }, [getScrollDistance]);

  const scrollRight = useCallback(() => {
    scrollContainerRef.current?.scrollBy({
      left: getScrollDistance(),
      behavior: "smooth",
    });
  }, [getScrollDistance]);

  const handleTabChange = useCallback((tab: TabType) => {
    setCurrentTab(tab);
    scrollContainerRef.current?.scrollTo({ left: 0, behavior: "smooth" });
  }, []);

  useEffect(() => {
    handleScroll();
    window.addEventListener("resize", handleScroll);
    return () => window.removeEventListener("resize", handleScroll);
  }, [currentItems, handleScroll]);

  if (isLoading || isCurrentLoading) {
    return (
      <div className="overflow-hidden">
        <div className="h-6 sm:h-8 w-32 sm:w-40 bg-gradient-to-r from-white/15 via-white/25 to-white/15 rounded-lg mb-4 animate-pulse" />

        <div className="flex gap-2 sm:gap-3 mb-6 overflow-x-auto pb-2">
          {Array.from({ length: 2 }).map((_, index) => (
            <div
              key={index}
              className="h-8 sm:h-10 w-32 sm:w-40 bg-gradient-to-r from-white/10 via-white/20 to-white/10 rounded-full flex-shrink-0 animate-pulse"
            />
          ))}
        </div>

        <div className="flex gap-3 sm:gap-5 overflow-x-auto pb-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex-shrink-0">
              <ProfilePlaylistTemplate playlist={{} as any} isLoading={true} />
            </div>
          ))}
        </div>
      </div>
    );
  }

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <h2
          id="playlists-section-title"
          className="text-white text-xl sm:text-2xl lg:text-3xl font-bold"
        >
          Playlists
        </h2>

        {hasContent && (
          <Link
            to={`/profile/${userId}/${currentTab}`}
            className="text-white/70 hover:text-white text-sm sm:text-base transition-colors duration-200 hover:underline self-start sm:self-auto"
          >
            View All
          </Link>
        )}
      </div>

      <div className="overflow-x-auto pb-2 mb-6" role="tablist">
        <div className="flex gap-2 sm:gap-3 min-w-max">
          <button
            role="tab"
            aria-selected={currentTab === "playlists"}
            aria-controls="playlists-panel"
            className={`${
              currentTab === "playlists"
                ? "text-black bg-white"
                : "text-white bg-transparent"
            } text-sm sm:text-base lg:text-lg px-3 sm:px-4 lg:px-5 py-2 border-2 border-white/70 rounded-full cursor-pointer hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white/20 whitespace-nowrap`}
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
            } text-sm sm:text-base lg:text-lg px-3 sm:px-4 lg:px-5 py-2 border-2 border-white/70 rounded-full cursor-pointer hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white/20 whitespace-nowrap`}
            onClick={() => handleTabChange("liked-playlists")}
          >
            Liked Playlists ({likedPlaylistsCount})
          </button>
        </div>
      </div>

      {currentError && (
        <div className="bg-red-50/10 border border-red-200/20 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-3">
            <svg
              className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <div className="flex-1">
              <p className="text-red-300 text-sm">{currentError}</p>
              <button
                onClick={currentResult.refetch}
                className="mt-2 bg-red-100/20 hover:bg-red-100/30 text-red-300 px-3 py-1 rounded text-sm transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="relative group">
        {showLeftArrow && hasContent && (
          <button
            onClick={scrollLeft}
            className="absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 sm:w-10 sm:h-10 bg-black/50 hover:bg-black/70 backdrop-blur-sm border border-white/20 rounded-full flex items-center justify-center text-white transition-all duration-200 opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-white/20"
            aria-label="Scroll left"
          >
            <LeftOutlined className="text-xs sm:text-sm" />
          </button>
        )}

        {showRightArrow && hasContent && (
          <button
            onClick={scrollRight}
            className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 sm:w-10 sm:h-10 bg-black/50 hover:bg-black/70 backdrop-blur-sm border border-white/20 rounded-full flex items-center justify-center text-white transition-all duration-200 opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-white/20"
            aria-label="Scroll right"
          >
            <RightOutlined className="text-xs sm:text-sm" />
          </button>
        )}

        <div
          ref={scrollContainerRef}
          className="albums-scroll-light overflow-x-auto pb-4 scroll-smooth"
          onScroll={handleScroll}
          role="tabpanel"
          id={`${currentTab}-panel`}
          aria-labelledby={`${currentTab}-tab`}
        >
          <div className="flex gap-3 sm:gap-4 lg:gap-5 min-w-max px-1 sm:px-2">
            {hasContent ? (
              currentItems.map((playlist, index) => (
                <div key={playlist._id || index} className="flex-shrink-0">
                  <ProfilePlaylistTemplate playlist={playlist} />
                </div>
              ))
            ) : (
              <div className="text-white/60 text-sm sm:text-base lg:text-lg py-8 px-4 text-center w-full">
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
