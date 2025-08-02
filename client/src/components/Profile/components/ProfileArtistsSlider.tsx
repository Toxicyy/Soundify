// ProfileArtistsSlider.tsx - Enhanced responsive design
import { useState, useRef, type FC, useEffect, useCallback, memo } from "react";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";
import { useUserLikedArtists } from "../../../hooks/useUserLikedArtists";
import ProfileArtistTemplate from "./ProfileArtistTemplate";

/**
 * Profile Artists Slider - Enhanced responsive design
 *
 * RESPONSIVE IMPROVEMENTS:
 * - Adaptive card spacing for different screen sizes
 * - Mobile-optimized scroll behavior and touch interactions
 * - Responsive arrow positioning and sizing
 * - Better overflow handling on small screens
 *
 * PERFORMANCE OPTIMIZATIONS:
 * - Memoized scroll calculations to prevent excessive re-renders
 * - Efficient event listener management with cleanup
 * - Optimized resize handling for responsive behavior
 * - Smart loading states with proper skeleton UI
 *
 * ACCESSIBILITY FEATURES:
 * - Comprehensive ARIA labels and roles
 * - Keyboard navigation support
 * - Screen reader friendly content announcements
 * - High contrast focus indicators
 */

interface ProfileArtistsSliderProps {
  userId: string;
  isLoading?: boolean;
}

const ProfileArtistsSlider: FC<ProfileArtistsSliderProps> = ({
  userId,
  isLoading = false,
}) => {
  // State management
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  // Refs
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Hook for data fetching
  const {
    artists,
    isLoading: isDataLoading,
    error,
    refetch,
    pagination,
  } = useUserLikedArtists(userId, {
    limit: 12,
  });

  const hasContent = artists.length > 0;
  const isCurrentLoading = isLoading || isDataLoading;

  /**
   * Handle scroll event with improved performance
   */
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    const maxScrollLeft = scrollWidth - clientWidth;
    const canScroll = maxScrollLeft > 10; // Minimum scroll threshold

    setShowLeftArrow(canScroll && scrollLeft > 10);
    setShowRightArrow(canScroll && scrollLeft < maxScrollLeft - 10);
  }, []);

  /**
   * Get responsive scroll distance based on screen size
   */
  const getScrollDistance = useCallback(() => {
    const width = window.innerWidth;
    if (width < 640) return 180; // Mobile - smaller cards
    if (width < 1024) return 240; // Tablet
    return 320; // Desktop
  }, []);

  /**
   * Scroll functions with responsive behavior
   */
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

  // Effects with cleanup
  useEffect(() => {
    handleScroll();

    const handleResize = () => handleScroll();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [artists, handleScroll]);

  // Loading state with responsive skeletons
  if (isCurrentLoading) {
    return (
      <div className="overflow-hidden">
        {/* Title skeleton */}
        <div className="h-6 sm:h-8 w-40 sm:w-48 bg-gradient-to-r from-white/15 via-white/25 to-white/15 rounded-lg mb-6 animate-pulse" />

        {/* Content skeletons with responsive layout */}
        <div className="flex gap-2 sm:gap-3 lg:gap-5 overflow-x-auto pb-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="flex-shrink-0">
              <ProfileArtistTemplate artist={{} as any} isLoading={true} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const totalArtists = pagination?.totalArtists || artists.length;

  return (
    <section
      className="overflow-hidden"
      aria-labelledby="artists-section-title"
    >
      {/* Header with responsive layout */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h2
          id="artists-section-title"
          className="text-white text-xl sm:text-2xl lg:text-3xl font-bold"
        >
          Following Artists ({totalArtists})
        </h2>

        {/* View All button with responsive positioning */}
        {hasContent && totalArtists > 12 && (
          <Link
            to={`/profile/${userId}/artists`}
            className="text-white/70 hover:text-white text-sm sm:text-base transition-colors duration-200 hover:underline self-start sm:self-auto"
          >
            View All
          </Link>
        )}
      </div>

      {/* Error state with responsive design */}
      {error && (
        <div className="bg-red-50/10 border border-red-200/20 rounded-lg p-4 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-start gap-3">
            <svg
              className="h-5 w-5 text-red-400 flex-shrink-0 self-start sm:mt-0.5"
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
              <p className="text-red-300 text-sm">{error}</p>
              <button
                onClick={refetch}
                className="mt-2 bg-red-100/20 hover:bg-red-100/30 text-red-300 px-3 py-1 rounded text-sm transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content area with responsive scrolling */}
      <div className="relative group">
        {/* Navigation arrows with responsive positioning */}
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

        {/* Scrollable content container with responsive gaps */}
        <div
          ref={scrollContainerRef}
          className="albums-scroll-light overflow-x-auto pb-4 scroll-smooth"
          onScroll={handleScroll}
          role="region"
          aria-label="User's liked artists"
        >
          <div className="flex gap-2 sm:gap-3 lg:gap-5 min-w-max px-1 sm:px-2">
            {hasContent ? (
              artists.map((artist, index) => (
                <div key={artist._id || index} className="flex-shrink-0">
                  <ProfileArtistTemplate artist={artist} />
                </div>
              ))
            ) : (
              <div className="text-white/60 text-sm sm:text-base lg:text-lg py-8 px-4 text-center w-full">
                No artists followed yet
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default memo(ProfileArtistsSlider);
