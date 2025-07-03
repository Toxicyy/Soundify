import { useState, useRef, type FC, useEffect, useCallback, memo } from "react";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import type { Track } from "../../../types/TrackData";
import type { Album } from "../../../types/AlbumData";
import SingleTemplate from "./SingleTemplate";
import AlbumTemplate from "./AlbumTemplate";

interface MusicListProps {
  tracks: Track[];
  albums?: Album[];
  isLoading?: boolean;
}

type TabType = "singles" | "albums";

/**
 * Music list component displaying singles and albums in tabbed interface
 * Features horizontal scrolling with navigation arrows and responsive design
 */
const MusicList: FC<MusicListProps> = ({
  tracks,
  albums = [],
  isLoading = false,
}) => {
  // State management
  const [currentTab, setCurrentTab] = useState<TabType>("singles");
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  // Refs
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Computed values
  const currentItems = currentTab === "singles" ? tracks : albums;
  const hasContent = currentItems.length > 0;

  /**
   * Handle scroll event to update arrow visibility
   * Shows/hides navigation arrows based on scroll position
   */
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    const maxScrollLeft = scrollWidth - clientWidth;

    // Show arrows only if content overflows and scrolling is possible
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
    // Reset scroll position when changing tabs
    scrollContainerRef.current?.scrollTo({ left: 0, behavior: "smooth" });
  }, []);

  // Effects
  useEffect(() => {
    handleScroll();
  }, [currentItems, handleScroll]);

  // Show loading state
  if (isLoading) {
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
              className="h-10 w-28 bg-gradient-to-r from-white/10 via-white/20 to-white/10 backdrop-blur-md border border-white/20 rounded-full relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-shimmer-delayed"></div>
            </div>
          ))}
        </div>

        {/* Content skeletons */}
        <div className="flex gap-5 px-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex-shrink-0">
              <div className="w-[160px] h-[160px] bg-gradient-to-br from-white/10 via-white/20 to-white/5 backdrop-blur-md border border-white/20 rounded-lg relative overflow-hidden mb-2">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-shimmer"></div>
              </div>
              <div className="h-4 w-32 bg-gradient-to-r from-white/8 via-white/15 to-white/8 backdrop-blur-md border border-white/15 rounded-md relative overflow-hidden mb-1">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -skew-x-12 animate-shimmer-delayed"></div>
              </div>
              <div className="h-3 w-20 bg-gradient-to-r from-white/5 via-white/10 to-white/5 backdrop-blur-md border border-white/10 rounded-md relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 animate-shimmer-delayed-2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <section className="overflow-hidden" aria-labelledby="music-section-title">
      <h2
        id="music-section-title"
        className="text-white text-2xl sm:text-3xl font-bold mb-4"
      >
        Music
      </h2>

      {/* Tab navigation */}
      <div className="flex gap-3 mb-6 px-2 flex-wrap" role="tablist">
        <button
          role="tab"
          aria-selected={currentTab === "singles"}
          aria-controls="singles-panel"
          className={`${
            currentTab === "singles"
              ? "text-black bg-white"
              : "text-white bg-transparent"
          } text-base sm:text-xl px-4 sm:px-5 py-1 border-2 border-white/70 rounded-full cursor-pointer hover:scale-110 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white/20`}
          onClick={() => handleTabChange("singles")}
        >
          Singles ({tracks.length})
        </button>

        <button
          role="tab"
          aria-selected={currentTab === "albums"}
          aria-controls="albums-panel"
          className={`${
            currentTab === "albums"
              ? "text-black bg-white"
              : "text-white bg-transparent"
          } text-base sm:text-xl px-4 sm:px-5 py-1 border-2 border-white/70 rounded-full cursor-pointer hover:scale-110 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white/20`}
          onClick={() => handleTabChange("albums")}
        >
          Albums ({albums.length})
        </button>
      </div>

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
              currentTab === "singles" ? (
                tracks.map((item, index) => (
                  <div
                    key={item._id || index}
                    className="flex-shrink-0 scroll-snap-align-start"
                  >
                    <SingleTemplate track={item} index={index} />
                  </div>
                ))
              ) : (
                albums.map((item, index) => (
                  <div
                    key={item._id || index}
                    className="flex-shrink-0 scroll-snap-align-start"
                  >
                    <AlbumTemplate album={item} index={index} />
                  </div>
                ))
              )
            ) : (
              <div className="text-white/60 text-base sm:text-lg py-8 px-4 text-center w-full">
                {currentTab === "singles"
                  ? "No singles found"
                  : "No albums found"}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default memo(MusicList);
