import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useDebounce } from "../../../../hooks/useDebounce";
import { useGlobalSearch } from "../../../../hooks/useGlobalSearch";
import SearchResultItem from "./SearchResultItem";
import { useDispatch } from "react-redux";
import { type AppDispatch } from "../../../../store";
import {
  setCurrentTrack,
  setIsPlaying,
} from "../../../../state/CurrentTrack.slice";
import type { Track } from "../../../../types/TrackData";
import { SearchOutlined } from "@ant-design/icons";

const SearchInput = () => {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

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
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const togglePlayPause = (item: Track) => {
    dispatch(setCurrentTrack(item));
    setTimeout(() => {
      dispatch(setIsPlaying(true));
    }, 50);
  };

  const handleItemClick = (item: any) => {
    setQuery(item.name);
    setIsOpen(false);

    switch (item.type) {
      case "track":
        togglePlayPause(item);
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
    navigate(`/search?q=${encodeURIComponent(query)}`);
  };

  const renderResults = () => {
    if (isLoading) {
      return (
        <div className="px-4 py-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
          <p className="text-white/70 mt-2">Поиск...</p>
        </div>
      );
    }

    if (!searchResults || searchResults.totalResults === 0) {
      return (
        <div className="px-4 py-6 text-center">
          <p className="text-white/70">
            {query.length >= 2
              ? "Ничего не найдено"
              : "Введите запрос для поиска"}
          </p>
        </div>
      );
    }

    const MAX_ITEMS = 5;

    const allResults = [
      ...searchResults.tracks
        .slice(0, 3)
        .map((track) => ({ ...track, type: "track" })),
      ...searchResults.artists
        .slice(0, 2)
        .map((artist) => ({ ...artist, type: "artist" })),
      ...searchResults.albums
        .slice(0, 2)
        .map((album) => ({ ...album, type: "album" })),
    ].slice(0, MAX_ITEMS);

    const hasMoreResults = searchResults.totalResults > MAX_ITEMS;

    return (
      <div className="max-h-120 overflow-hidden">
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
            className="border-t border-white/10 px-4 py-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <button
              onClick={handleShowMore}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-white/10 hover:bg-white/20 rounded-lg transition-all duration-200 text-white/80 hover:text-white"
            >
              <SearchOutlined className="text-sm" />
              <span className="text-sm font-medium">
                Show all results ({searchResults.totalResults})
              </span>
            </button>
          </motion.div>
        )}
      </div>
    );
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center w-[20vw] max-w-md bg-white/70 backdrop-blur-sm rounded-full px-9 py-2 shadow-lg gap-2 transition-all duration-300 hover:bg-white/80 focus-within:bg-white/90">
        <svg
          className="w-5 h-5 text-gray-700 mr-2 flex-shrink-0"
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
          onFocus={() => setIsOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && query.length >= 2) {
              handleShowMore();
            }
          }}
          placeholder="Search Soundify"
          className="bg-transparent outline-none w-full pt-1 text-gray-700 placeholder-gray-600 font-medium"
        />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 mt-2 bg-black/50 rounded-2xl shadow-2xl border backdrop-blur-sm border-white/20 z-50 overflow-hidden"
          >
            {renderResults()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchInput;
