import { useState, useRef, type FC, useEffect, useCallback, memo } from "react";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";
import { useUserLikedArtists } from "../../../hooks/useUserLikedArtists";
import ProfileArtistTemplate from "./ProfileArtistTemplate";

interface ProfileArtistsSliderProps {
  userId: string;
  isLoading?: boolean;
}

/**
 * Profile artists slider displaying user's liked artists
 * Features horizontal scrolling with navigation arrows and responsive design
 */
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
  const { artists, isLoading: isDataLoading, error, refetch, pagination } = useUserLikedArtists(userId, {
    limit: 12,
  });

  const hasContent = artists.length > 0;
  const isCurrentLoading = isLoading || isDataLoading;

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

  // Effects
  useEffect(() => {
    handleScroll();
  }, [artists, handleScroll]);

  // Show loading state
  if (isCurrentLoading) {
    return (
      <div className="overflow-hidden">
        <div className="h-8 w-32 bg-gradient-to-r from-white/15 via-white/25 to-white/15 backdrop-blur-md border border-white/25 rounded-lg relative overflow-hidden mb-6">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/35 to-transparent -skew-x-12 animate-shimmer"></div>
        </div>

        {/* Content skeletons */}
        <div className="flex gap-5 px-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex-shrink-0">
              <ProfileArtistTemplate
                artist={{} as any}
                isLoading={true}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const totalArtists = pagination?.totalArtists || artists.length;

  return (
    <section className="overflow-hidden" aria-labelledby="artists-section-title">
      <div className="flex items-center justify-between mb-6">
        <h2
          id="artists-section-title"
          className="text-white text-2xl sm:text-3xl font-bold"
        >
          Following Artists ({totalArtists})
        </h2>
        
        {/* View All button */}
        {hasContent && totalArtists > 12 && (
          <Link
            to={`/profile/${userId}/artists`}
            className="text-white/70 hover:text-white text-sm sm:text-base transition-colors duration-200 hover:underline"
          >
            View All
          </Link>
        )}
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-50/10 border border-red-200/20 rounded-lg p-4 mb-4">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-red-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="text-red-300 text-sm">{error}</p>
          </div>
          <button
            onClick={refetch}
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
          role="region"
          aria-label="User's liked artists"
        >
          <div className="flex gap-3 sm:gap-5 min-w-max px-2">
            {hasContent ? (
              artists.map((artist, index) => (
                <div
                  key={artist._id || index}
                  className="flex-shrink-0 scroll-snap-align-start"
                >
                  <ProfileArtistTemplate 
                    artist={artist} 
                  />
                </div>
              ))
            ) : (
              <div className="text-white/60 text-base sm:text-lg py-8 px-4 text-center w-full">
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