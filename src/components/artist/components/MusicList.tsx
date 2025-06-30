import { useState, useRef, type FC } from "react";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import type { Track } from "../../../types/TrackData";
import SingleTemplate from "./SingleTemplate";

interface MusicListProps {
  tracks: Track[];
  albums?: Track[];
}

const MusicList: FC<MusicListProps> = ({ tracks, albums = [] }) => {
  const [currentTab, setCurrentTab] = useState<"singles" | "albums">("singles");
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const currentItems = currentTab === "singles" ? tracks : albums;

  // Прокрутка влево
  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: -300,
        behavior: "smooth",
      });
    }
  };

  // Прокрутка вправо
  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: 300,
        behavior: "smooth",
      });
    }
  };

  // Обработка события скролла для показа/скрытия стрелок
  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } =
        scrollContainerRef.current;

      setShowLeftArrow(scrollLeft > 10);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  return (
    <div className="overflow-hidden">
      <h1 className="text-white text-3xl font-bold mb-4">Music</h1>

      {/* Табы */}
      <div className="flex gap-3 mb-6">
        <button
          className={`${
            currentTab === "singles"
              ? "text-black bg-white"
              : "text-white bg-transparent"
          } text-xl px-5 py-1 border-2 border-white/70 rounded-full cursor-pointer hover:scale-110 transition-all duration-300`}
          onClick={() => setCurrentTab("singles")}
        >
          Singles ({tracks.length})
        </button>
        <button
          className={`${
            currentTab === "albums"
              ? "text-black bg-white"
              : "text-white bg-transparent"
          } text-xl px-5 py-1 border-2 border-white/70 rounded-full cursor-pointer hover:scale-110 transition-all duration-300`}
          onClick={() => setCurrentTab("albums")}
        >
          Albums ({albums.length})
        </button>
      </div>

      {/* Горизонтальная скроллируемая область с навигацией */}
      <div className="relative group">
        {/* Левая стрелка */}
        {showLeftArrow && currentItems.length > 0 && (
          <button
            onClick={scrollLeft}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-black/50 hover:bg-black/70 backdrop-blur-sm border border-white/20 rounded-full flex items-center justify-center text-white transition-all duration-200 opacity-0 group-hover:opacity-100"
          >
            <LeftOutlined />
          </button>
        )}

        {/* Правая стрелка */}
        {showRightArrow && currentItems.length > 0 && (
          <button
            onClick={scrollRight}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-black/50 hover:bg-black/70 backdrop-blur-sm border border-white/20 rounded-full flex items-center justify-center text-white transition-all duration-200 opacity-0 group-hover:opacity-100"
          >
            <RightOutlined />
          </button>
        )}

        {/* Скроллируемый контейнер */}
        <div
          ref={scrollContainerRef}
          className="albums-scroll-light overflow-x-auto pb-4"
          onScroll={handleScroll}
        >
          <div className="flex gap-5 min-w-max px-2">
            {currentItems.length > 0 ? (
              currentItems.map((item: Track, index) => (
                <div
                  key={item._id || index}
                  className="flex-shrink-0 scroll-snap-align-start"
                >
                  <SingleTemplate track={item} index={index} />
                </div>
              ))
            ) : (
              <div className="text-white/60 text-lg py-8 px-4">
                {currentTab === "singles"
                  ? "Синглы не найдены"
                  : "Альбомы не найдены"}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default MusicList;
