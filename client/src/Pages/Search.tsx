import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useDebounce } from "../hooks/useDebounce";
import { useGlobalSearch } from "../hooks/useGlobalSearch";
import { useDispatch } from "react-redux";
import { type AppDispatch } from "../store";
import { setCurrentTrack, setIsPlaying } from "../state/CurrentTrack.slice";
import type { Track } from "../types/TrackData";
import {
  SearchOutlined,
  ArrowLeftOutlined,
  PlayCircleOutlined,
  UserOutlined,
  PicRightOutlined,
  UnorderedListOutlined,
  LoadingOutlined,
} from "@ant-design/icons";

/**
 * Search page with responsive design
 * Features: real-time search, multi-type results (tracks/artists/albums), playback
 */

interface SearchItemProps {
  item: any;
  type: string;
  onClick: () => void;
}

const SearchItem: React.FC<SearchItemProps> = ({ item, type, onClick }) => {
  const getIcon = useCallback(() => {
    const iconSize = window.innerWidth < 640 ? "12px" : "14px";
    const iconProps = {
      className: "text-white/70 flex-shrink-0",
      style: { fontSize: iconSize },
    };

    switch (type) {
      case "track":
        return <PlayCircleOutlined {...iconProps} />;
      case "artist":
        return <UserOutlined {...iconProps} />;
      case "album":
        return <PicRightOutlined {...iconProps} />;
      case "playlist":
        return <UnorderedListOutlined {...iconProps} />;
      default:
        return null;
    }
  }, [type]);

  const getSecondaryText = useCallback(() => {
    switch (type) {
      case "track":
        return item.artist?.name || "Unknown artist";
      case "artist":
        return `${item.followerCount || 0} followers`;
      case "album":
        return item.artist?.name || "Unknown artist";
      case "playlist":
        return item.owner?.name || "Unknown user";
      default:
        return "";
    }
  }, [type, item]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.005 }}
      whileTap={{ scale: 0.995 }}
      onClick={onClick}
      className="p-2 sm:p-3 rounded-lg sm:rounded-xl cursor-pointer transition-all duration-200 flex items-center gap-2 sm:gap-3 hover:bg-white/5 bg-white/2 border border-white/5 group"
    >
      <div className="relative flex-shrink-0">
        {item.coverUrl || item.avatar ? (
          <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-md sm:rounded-lg overflow-hidden bg-white/10">
            <img
              src={item.coverUrl || item.avatar}
              alt={item.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = "none";
                target.nextElementSibling?.classList.remove("hidden");
              }}
            />
            <div className="w-full h-full bg-white/10 flex items-center justify-center">
              {getIcon()}
            </div>
          </div>
        ) : (
          <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-md sm:rounded-lg bg-white/10 flex items-center justify-center">
            {getIcon()}
          </div>
        )}

        {type === "track" && (
          <div className="absolute inset-0 bg-black/50 rounded-md sm:rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <PlayCircleOutlined
              className="text-white"
              style={{ fontSize: window.innerWidth < 640 ? "14px" : "16px" }}
            />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0 overflow-hidden">
        <h3 className="font-semibold text-white text-xs sm:text-sm md:text-base truncate mb-0.5 sm:mb-1 leading-tight">
          {item.name}
        </h3>
        <p className="text-white/60 text-[10px] sm:text-xs md:text-sm truncate leading-tight">
          {getSecondaryText()}
        </p>
        {type === "track" && item.duration && (
          <p className="text-white/40 text-[8px] sm:text-[10px] md:text-xs mt-0.5 sm:mt-1">
            {Math.floor(item.duration / 60)}:
            {(item.duration % 60).toString().padStart(2, "0")}
          </p>
        )}
      </div>

      <div className="flex-shrink-0">
        <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-white/10 rounded-md sm:rounded-lg text-white/60 text-[8px] sm:text-[10px] md:text-xs uppercase font-medium">
          {type}
        </span>
      </div>
    </motion.div>
  );
};

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [activeTab, setActiveTab] = useState<string>("all");

  const debouncedQuery = useDebounce(query, 300);
  const { searchResults, isLoading, searchGlobal } = useGlobalSearch();

  const tabs = useMemo(
    () => [
      { id: "all", label: "All", count: searchResults?.totalResults || 0 },
      {
        id: "tracks",
        label: "Songs",
        count: searchResults?.tracks?.length || 0,
      },
      {
        id: "artists",
        label: "Artists",
        count: searchResults?.artists?.length || 0,
      },
      {
        id: "albums",
        label: "Albums",
        count: searchResults?.albums?.length || 0,
      },
    ],
    [searchResults]
  );

  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      searchGlobal(debouncedQuery, { limit: 50 });
      setSearchParams({ q: debouncedQuery });
    }
  }, [debouncedQuery, searchGlobal, setSearchParams]);

  const togglePlayPause = useCallback(
    (item: Track) => {
      dispatch(setCurrentTrack(item));
      setTimeout(() => {
        dispatch(setIsPlaying(true));
      }, 50);
    },
    [dispatch]
  );

  const handleItemClick = useCallback(
    (item: any, type: string) => {
      switch (type) {
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
    },
    [togglePlayPause, navigate]
  );

  const renderItems = useCallback(
    (items: any[], type: string) => (
      <div className="grid gap-1 sm:gap-2">
        {items.map((item) => (
          <SearchItem
            key={item._id}
            item={item}
            type={type}
            onClick={() => handleItemClick(item, type)}
          />
        ))}
      </div>
    ),
    [handleItemClick]
  );

  const renderContent = useCallback(() => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-12 sm:py-16">
          <LoadingOutlined
            className="text-2xl sm:text-3xl text-white/70 mb-2 sm:mb-3"
            spin
          />
          <p className="text-white/70 text-sm sm:text-base">Searching...</p>
        </div>
      );
    }

    if (!searchResults || searchResults.totalResults === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 sm:py-16 px-4">
          <SearchOutlined className="text-2xl sm:text-3xl text-white/30 mb-2 sm:mb-3" />
          <h3 className="text-white/70 text-base sm:text-lg mb-2 text-center">
            No results found
          </h3>
          <p className="text-white/50 text-center text-xs sm:text-sm max-w-xs sm:max-w-md leading-relaxed">
            {query.length >= 2
              ? `We couldn't find anything for "${query}". Try different keywords.`
              : "Enter at least 2 characters to start searching."}
          </p>
        </div>
      );
    }

    switch (activeTab) {
      case "tracks":
        return searchResults.tracks && searchResults.tracks.length > 0 ? (
          renderItems(searchResults.tracks, "track")
        ) : (
          <div className="flex flex-col items-center justify-center py-12 sm:py-16 px-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-blue-500/20 to-blue-500/5 flex items-center justify-center mb-3 sm:mb-4">
              <PlayCircleOutlined
                style={{
                  color: "#3b82f6",
                  fontSize: window.innerWidth < 640 ? "20px" : "24px",
                }}
              />
            </div>
            <h3 className="text-white/70 text-base sm:text-lg font-semibold mb-2">
              No songs found
            </h3>
            <p className="text-white/50 text-center text-xs sm:text-sm max-w-xs sm:max-w-md leading-relaxed">
              We couldn't find any songs matching "{query}". Try searching for
              different track names or artists.
            </p>
          </div>
        );
      case "artists":
        return searchResults.artists && searchResults.artists.length > 0 ? (
          renderItems(searchResults.artists, "artist")
        ) : (
          <div className="flex flex-col items-center justify-center py-12 sm:py-16 px-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-amber-500/20 to-amber-500/5 flex items-center justify-center mb-3 sm:mb-4">
              <UserOutlined
                style={{
                  color: "#f59e0b",
                  fontSize: window.innerWidth < 640 ? "20px" : "24px",
                }}
              />
            </div>
            <h3 className="text-white/70 text-base sm:text-lg font-semibold mb-2">
              No artists found
            </h3>
            <p className="text-white/50 text-center text-xs sm:text-sm max-w-xs sm:max-w-md leading-relaxed">
              We couldn't find any artists matching "{query}". Try searching for
              different artist names or variations.
            </p>
          </div>
        );
      case "albums":
        return searchResults.albums && searchResults.albums.length > 0 ? (
          renderItems(searchResults.albums, "album")
        ) : (
          <div className="flex flex-col items-center justify-center py-12 sm:py-16 px-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-purple-500/20 to-purple-500/5 flex items-center justify-center mb-3 sm:mb-4">
              <PicRightOutlined
                style={{
                  color: "#8b5cf6",
                  fontSize: window.innerWidth < 640 ? "20px" : "24px",
                }}
              />
            </div>
            <h3 className="text-white/70 text-base sm:text-lg font-semibold mb-2">
              No albums found
            </h3>
            <p className="text-white/50 text-center text-xs sm:text-sm max-w-xs sm:max-w-md leading-relaxed">
              We couldn't find any albums matching "{query}". Try searching for
              different album titles or artist names.
            </p>
          </div>
        );
      default:
        return (
          <div className="space-y-4 sm:space-y-6">
            {searchResults.tracks && searchResults.tracks.length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <h2 className="text-white text-base sm:text-lg font-semibold mb-2 sm:mb-3 px-1">
                  Top Result
                </h2>
                <div className="bg-white/5 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 max-w-xs sm:max-w-sm border border-white/10">
                  <SearchItem
                    item={searchResults.tracks[0]}
                    type="track"
                    onClick={() =>
                      handleItemClick(searchResults.tracks[0], "track")
                    }
                  />
                </div>
              </motion.section>
            )}

            {searchResults.tracks && searchResults.tracks.length > 1 && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h2 className="text-white text-base sm:text-lg font-semibold mb-2 sm:mb-3 px-1">
                  Songs ({searchResults.tracks.length})
                </h2>
                <div className="space-y-1 sm:space-y-2">
                  {renderItems(searchResults.tracks.slice(1, 6), "track")}
                </div>
                {searchResults.tracks.length > 6 && (
                  <button
                    onClick={() => setActiveTab("tracks")}
                    className="mt-2 sm:mt-3 text-white/70 hover:text-white text-xs sm:text-sm px-1 underline"
                  >
                    Show all songs
                  </button>
                )}
              </motion.section>
            )}

            {searchResults.artists && searchResults.artists.length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <h2 className="text-white text-base sm:text-lg font-semibold mb-2 sm:mb-3 px-1">
                  Artists ({searchResults.artists.length})
                </h2>
                <div className="space-y-1 sm:space-y-2">
                  {renderItems(searchResults.artists.slice(0, 5), "artist")}
                </div>
                {searchResults.artists.length > 5 && (
                  <button
                    onClick={() => setActiveTab("artists")}
                    className="mt-2 sm:mt-3 text-white/70 hover:text-white text-xs sm:text-sm px-1 underline"
                  >
                    Show all artists
                  </button>
                )}
              </motion.section>
            )}

            {searchResults.albums && searchResults.albums.length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <h2 className="text-white text-base sm:text-lg font-semibold mb-2 sm:mb-3 px-1">
                  Albums ({searchResults.albums.length})
                </h2>
                <div className="space-y-1 sm:space-y-2">
                  {renderItems(searchResults.albums.slice(0, 5), "album")}
                </div>
                {searchResults.albums.length > 5 && (
                  <button
                    onClick={() => setActiveTab("albums")}
                    className="mt-2 sm:mt-3 text-white/70 hover:text-white text-xs sm:text-sm px-1 underline"
                  >
                    Show all albums
                  </button>
                )}
              </motion.section>
            )}
          </div>
        );
    }
  }, [
    isLoading,
    searchResults,
    activeTab,
    query,
    renderItems,
    handleItemClick,
  ]);

  return (
    <motion.main
      className="w-full min-h-screen pl-2 pr-2 sm:pl-3 sm:pr-3 md:pl-8 md:pr-8 xl:pl-[22vw] xl:pr-[2vw] flex flex-col gap-3 sm:gap-4 mb-28 sm:mb-32 xl:mb-6 py-3 sm:py-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <motion.div
        className="flex items-center gap-2 sm:gap-3"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <motion.button
          onClick={() => navigate("/")}
          className="p-2.5 sm:p-3 bg-white/10 hover:bg-white/20 backdrop-blur-lg rounded-lg sm:rounded-xl transition-all duration-200 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-white/20 flex-shrink-0"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Go back to home"
        >
          <ArrowLeftOutlined
            className="text-white"
            style={{ fontSize: window.innerWidth < 640 ? "16px" : "18px" }}
          />
        </motion.button>

        <div className="flex-1 min-w-0 overflow-hidden">
          <h1 className="text-white text-xl sm:text-2xl font-bold mb-0.5 sm:mb-1 truncate">
            Search
          </h1>
          {query && (
            <p className="text-white/70 text-sm sm:text-base truncate">
              Results for "{query}"
            </p>
          )}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <div className="flex items-center w-full max-w-2xl bg-white/10 backdrop-blur-lg rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 border border-white/20">
          <SearchOutlined
            className="text-white/70 mr-2 sm:mr-3 flex-shrink-0"
            style={{ fontSize: window.innerWidth < 640 ? "16px" : "18px" }}
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="What do you want to listen to?"
            className="bg-transparent outline-none w-full text-white placeholder-white/50 text-sm sm:text-base min-w-0"
            autoFocus
          />
        </div>
      </motion.div>

      {searchResults && searchResults.totalResults > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <div className="grid grid-cols-2 sm:flex sm:gap-2 gap-1 border-b border-white/10 pb-2 sm:pb-3 overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-md sm:rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap flex-shrink-0 flex items-center justify-center gap-1 sm:gap-2 ${
                  activeTab === tab.id
                    ? "bg-white/20 text-white"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="truncate">{tab.label}</span>
                {tab.count > 0 && (
                  <span className="px-1.5 sm:px-2 py-0.5 bg-white/20 rounded-full text-[10px] sm:text-xs flex-shrink-0">
                    {tab.count}
                  </span>
                )}
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        className="flex-1"
      >
        <AnimatePresence mode="wait">{renderContent()}</AnimatePresence>
      </motion.div>
    </motion.main>
  );
};

export default Search;
