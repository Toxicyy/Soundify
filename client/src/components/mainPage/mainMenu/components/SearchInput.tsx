import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useDebounce } from "../../../../hooks/useDebounce";
import { useGlobalSearch } from "../../../../hooks/useGlobalSearch";
import SearchResultItem from "./SearchResultItem";
import { useDispatch, useSelector } from "react-redux";
import { type AppDispatch, type AppState } from "../../../../store";
import {
  setCurrentTrack,
  setIsPlaying,
} from "../../../../state/CurrentTrack.slice";
import type { Track } from "../../../../types/TrackData";
import { SearchOutlined } from "@ant-design/icons";
import { clearQueue, setQueue } from "../../../../state/Queue.slice";
import { useGetUserQuery } from "../../../../state/UserApi.slice";

const SearchInput = () => {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const {data: user} = useGetUserQuery();

  const currentTrack = useSelector((state: AppState) => state.currentTrack);

  const debouncedQuery = useDebounce(query, 300);
  const { searchResults, isLoading, searchGlobal, getPopularContent } =
    useGlobalSearch();

  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      searchGlobal(debouncedQuery, { limit: 6 });
      setIsOpen(true);
    } else if (debouncedQuery.length === 0 && isOpen) {
      getPopularContent();
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [debouncedQuery, searchGlobal, getPopularContent, isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setIsFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const togglePlayPauseWithRecommendations = async (item: Track) => {
  // Если это текущий трек и он уже играет - просто ставим на паузу
  if (currentTrack?.currentTrack?._id === item._id && currentTrack.isPlaying) {
    dispatch(setIsPlaying(false));
    return;
  }

  try {
    // 1. Устанавливаем текущий трек
    dispatch(setCurrentTrack(item));

    const response = await fetch(`http://localhost:5000/api/recommendations?userId=${user?._id}`);
    const recommendations = await response.json()

    const filteredRecs = recommendations.filter(
      (track: Track) => track._id !== item._id
    );

    // 4. Обновляем очередь в Redux
    dispatch(setQueue({ 
      tracks: filteredRecs,
      startIndex: 0
    }));

    setTimeout(() => {
      dispatch(setIsPlaying(true));
    }, 50);

  } catch (error) {
    console.error("Ошибка при получении рекомендаций:", error);
    
    dispatch(setCurrentTrack(item));
    dispatch(clearQueue());
    setTimeout(() => {
      dispatch(setIsPlaying(true));
    }, 50);
  }
};

  const handleItemClick = (item: any) => {
    setQuery(item.name);
    setIsOpen(false);
    setIsFocused(false);

    switch (item.type) {
      case "track":
        togglePlayPauseWithRecommendations(item);
        break;
      case "artist":
        navigate(`/artist/${item._id}`);
        break;
      case "album":
        navigate(`/album/${item._id}`);
        break;
      case "playlist":
        navigate(`/playlist/${item._id}`);
        break;
    }
  };

  const handleShowMore = () => {
    setIsOpen(false);
    setIsFocused(false);
    navigate(`/search?q=${encodeURIComponent(query)}`);
  };

  const handleFocus = () => {
    setIsFocused(true);
    if (query.length === 0) {
      getPopularContent();
      setIsOpen(true);
    } else if (query.length >= 2) {
      setIsOpen(true);
    }
  };

  const renderResults = () => {
    if (isLoading) {
      return (
        <div className="px-4 py-6 md:py-8 text-center">
          <div className="animate-spin rounded-full h-6 w-6 md:h-8 md:w-8 border-b-2 border-white mx-auto"></div>
          <p className="text-white/70 mt-2 text-sm md:text-base">
            Searching...
          </p>
        </div>
      );
    }

    if (!searchResults || searchResults.totalResults === 0) {
      return (
        <div className="px-4 py-4 md:py-6 text-center">
          <p className="text-white/70 text-sm md:text-base">
            {query.length >= 2 ? "No results found" : "Type to search"}
          </p>
        </div>
      );
    }

    // Different limits for mobile vs desktop
    const isMobile = window.innerWidth < 768;
    const MAX_ITEMS = isMobile ? 3 : 5;
    const tracksLimit = isMobile ? 2 : 3;
    const artistsLimit = isMobile ? 1 : 2;
    const albumsLimit = isMobile ? 1 : 2;

    const allResults = [
      ...searchResults.tracks
        .slice(0, tracksLimit)
        .map((track) => ({ ...track, type: "track" })),
      ...searchResults.artists
        .slice(0, artistsLimit)
        .map((artist) => ({ ...artist, type: "artist" })),
      ...searchResults.albums
        .slice(0, albumsLimit)
        .map((album) => ({ ...album, type: "album" })),
    ].slice(0, MAX_ITEMS);

    const hasMoreResults = searchResults.totalResults > MAX_ITEMS;

    return (
      <div className="max-h-80 md:max-h-96 overflow-hidden">
        {allResults.map((item) => (
          <SearchResultItem
            key={item._id}
            item={item}
            onClick={() => handleItemClick(item)}
            showPlayButton={item.type === "track"}
          />
        ))}

        {hasMoreResults && query.length >= 2 && (
          <motion.div
            className="border-t border-white/10 px-3 md:px-4 py-2 md:py-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <button
              onClick={handleShowMore}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 md:px-4 bg-white/10 hover:bg-white/20 rounded-lg transition-all duration-200 text-white/80 hover:text-white"
            >
              <SearchOutlined className="text-xs md:text-sm" />
              <span className="text-xs md:text-sm font-medium">
                Show all results ({searchResults.totalResults})
              </span>
            </button>
          </motion.div>
        )}
      </div>
    );
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-md xl:max-w-lg">
      {/* Search Input */}
      <div
        className={`flex items-center w-full bg-white/70 backdrop-blur-sm rounded-full px-4 md:px-6 xl:px-9 py-2 md:py-2.5 shadow-lg gap-2 transition-all duration-300 hover:bg-white/80 ${
          isFocused ? "bg-white/90 ring-2 ring-white/30" : ""
        }`}
      >
        <svg
          className="w-4 h-4 md:w-5 md:h-5 text-gray-700 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <circle cx="11" cy="11" r="8" strokeWidth="2" />
          <line x1="16.5" y1="16.5" x2="24" y2="24" strokeWidth="2" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={handleFocus}
          onKeyDown={(e) => {
            if (e.key === "Enter" && query.length >= 2) {
              handleShowMore();
            }
          }}
          placeholder="Search Soundify"
          className="bg-transparent outline-none w-full pt-1 text-gray-700 placeholder-gray-600 font-medium text-sm md:text-base"
        />
      </div>

      {/* Search Results Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 mt-2 bg-black/50 rounded-xl md:rounded-2xl shadow-2xl border backdrop-blur-sm border-white/20 z-50 overflow-hidden"
          >
            {renderResults()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchInput;
