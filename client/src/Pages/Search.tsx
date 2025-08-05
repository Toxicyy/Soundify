import React, { useState, useEffect } from "react";
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

interface SearchItemProps {
  item: any;
  type: string;
  onClick: () => void;
}

const SearchItem: React.FC<SearchItemProps> = ({ item, type, onClick }) => {
  const getIcon = () => {
    switch (type) {
      case "track":
        return (
          <PlayCircleOutlined className="text-sm xs:text-xs text-white/70 flex-shrink-0" />
        );
      case "artist":
        return (
          <UserOutlined className="text-sm xs:text-xs text-white/70 flex-shrink-0" />
        );
      case "album":
        return (
          <PicRightOutlined className="text-sm xs:text-xs text-white/70 flex-shrink-0" />
        );
      case "playlist":
        return (
          <UnorderedListOutlined className="text-sm xs:text-xs text-white/70 flex-shrink-0" />
        );
      default:
        return null;
    }
  };

  const getSecondaryText = () => {
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
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.005 }}
      whileTap={{ scale: 0.995 }}
      onClick={onClick}
      className="p-3 xs:p-2 rounded-xl xs:rounded-lg cursor-pointer transition-all duration-200 flex items-center gap-3 xs:gap-2 hover:bg-white/5 bg-white/2 border border-white/5"
    >
      {/* Image/Icon */}
      <div className="relative flex-shrink-0">
        {item.coverUrl || item.avatar ? (
          <div className="w-12 h-12 xs:w-10 xs:h-10 rounded-lg xs:rounded-md overflow-hidden bg-white/10">
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
          <div className="w-12 h-12 xs:w-10 xs:h-10 rounded-lg xs:rounded-md bg-white/10 flex items-center justify-center">
            {getIcon()}
          </div>
        )}

        {/* Play button overlay for tracks */}
        {type === "track" && (
          <div className="absolute inset-0 bg-black/50 rounded-lg xs:rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <PlayCircleOutlined className="text-lg xs:text-base text-white" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 overflow-hidden">
        <h3 className="font-semibold text-white text-sm xs:text-xs truncate mb-1 xs:mb-0.5 leading-tight">
          {item.name}
        </h3>
        <p className="text-white/60 text-xs xs:text-[10px] truncate leading-tight">
          {getSecondaryText()}
        </p>
        {type === "track" && item.duration && (
          <p className="text-white/40 text-[10px] xs:text-[8px] mt-1 xs:mt-0.5">
            {Math.floor(item.duration / 60)}:
            {(item.duration % 60).toString().padStart(2, "0")}
          </p>
        )}
      </div>

      {/* Type badge */}
      <div className="flex-shrink-0">
        <span className="px-2 xs:px-1.5 py-1 xs:py-0.5 bg-white/10 rounded-lg xs:rounded-md text-white/60 text-[10px] xs:text-[8px] uppercase font-medium">
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

  const tabs = [
    { id: "all", label: "All", count: searchResults?.totalResults || 0 },
    {
      id: "tracks",
      label: "Tracks",
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
  ];

  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      searchGlobal(debouncedQuery, { limit: 50 });
      setSearchParams({ q: debouncedQuery });
    }
  }, [debouncedQuery, searchGlobal, setSearchParams]);

  const togglePlayPause = (item: Track) => {
    dispatch(setCurrentTrack(item));
    setTimeout(() => {
      dispatch(setIsPlaying(true));
    }, 50);
  };

  const handleItemClick = (item: any, type: string) => {
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
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-16 xs:py-12">
          <LoadingOutlined
            className="text-3xl xs:text-2xl text-white/70 mb-3 xs:mb-2"
            spin
          />
          <p className="text-white/70 text-base xs:text-sm">Searching...</p>
        </div>
      );
    }

    if (!searchResults || searchResults.totalResults === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-16 xs:py-12 px-4">
          <SearchOutlined className="text-3xl xs:text-2xl text-white/30 mb-3 xs:mb-2" />
          <h3 className="text-white/70 text-lg xs:text-base mb-2 text-center">
            No results found
          </h3>
          <p className="text-white/50 text-center text-sm xs:text-xs max-w-md xs:max-w-xs leading-relaxed">
            {query.length >= 2
              ? `We couldn't find anything for "${query}". Try different keywords.`
              : "Enter at least 2 characters to start searching."}
          </p>
        </div>
      );
    }

    const renderItems = (items: any[], type: string) => (
      <div className="grid gap-2 xs:gap-1">
        {items.map((item) => (
          <SearchItem
            key={item._id}
            item={item}
            type={type}
            onClick={() => handleItemClick(item, type)}
          />
        ))}
      </div>
    );

    switch (activeTab) {
      case "tracks":
        return renderItems(searchResults.tracks || [], "track");
      case "artists":
        return renderItems(searchResults.artists || [], "artist");
      case "albums":
        return renderItems(searchResults.albums || [], "album");
      default:
        return (
          <div className="space-y-6 xs:space-y-4">
            {/* Top Results */}
            {searchResults.tracks && searchResults.tracks.length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <h2 className="text-white text-lg xs:text-base font-semibold mb-3 xs:mb-2 px-1">
                  Top Result
                </h2>
                <div className="bg-white/5 backdrop-blur-sm rounded-xl xs:rounded-lg p-4 xs:p-3 max-w-sm border border-white/10">
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

            {/* Tracks */}
            {searchResults.tracks && searchResults.tracks.length > 1 && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h2 className="text-white text-lg xs:text-base font-semibold mb-3 xs:mb-2 px-1">
                  Tracks ({searchResults.tracks.length})
                </h2>
                <div className="space-y-2 xs:space-y-1">
                  {renderItems(searchResults.tracks.slice(1, 6), "track")}
                </div>
                {searchResults.tracks.length > 6 && (
                  <button
                    onClick={() => setActiveTab("tracks")}
                    className="mt-3 xs:mt-2 text-white/70 hover:text-white text-sm xs:text-xs px-1 underline"
                  >
                    Show all tracks
                  </button>
                )}
              </motion.section>
            )}

            {/* Artists */}
            {searchResults.artists && searchResults.artists.length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <h2 className="text-white text-lg xs:text-base font-semibold mb-3 xs:mb-2 px-1">
                  Artists ({searchResults.artists.length})
                </h2>
                <div className="space-y-2 xs:space-y-1">
                  {renderItems(searchResults.artists.slice(0, 5), "artist")}
                </div>
                {searchResults.artists.length > 5 && (
                  <button
                    onClick={() => setActiveTab("artists")}
                    className="mt-3 xs:mt-2 text-white/70 hover:text-white text-sm xs:text-xs px-1 underline"
                  >
                    Show all artists
                  </button>
                )}
              </motion.section>
            )}

            {/* Albums */}
            {searchResults.albums && searchResults.albums.length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <h2 className="text-white text-lg xs:text-base font-semibold mb-3 xs:mb-2 px-1">
                  Albums ({searchResults.albums.length})
                </h2>
                <div className="space-y-2 xs:space-y-1">
                  {renderItems(searchResults.albums.slice(0, 5), "album")}
                </div>
                {searchResults.albums.length > 5 && (
                  <button
                    onClick={() => setActiveTab("albums")}
                    className="mt-3 xs:mt-2 text-white/70 hover:text-white text-sm xs:text-xs px-1 underline"
                  >
                    Show all albums
                  </button>
                )}
              </motion.section>
            )}
          </div>
        );
    }
  };

  return (
    <motion.main
      className="w-full min-h-screen pl-3 pr-3 xs:pl-2 xs:pr-2 sm:pl-8 sm:pr-8 xl:pl-[22vw] xl:pr-[2vw] flex flex-col gap-4 xs:gap-3 mb-32 xs:mb-28 xl:mb-6 py-4 xs:py-3"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header */}
      <motion.div
        className="flex items-center gap-3 xs:gap-2"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <motion.button
          onClick={() => navigate("/")}
          className="p-3 xs:p-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-lg rounded-xl xs:rounded-lg transition-all duration-200 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-white/20 flex-shrink-0"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <ArrowLeftOutlined className="text-white text-lg xs:text-base" />
        </motion.button>

        <div className="flex-1 min-w-0 overflow-hidden">
          <h1 className="text-white text-2xl xs:text-xl font-bold mb-1 xs:mb-0.5 truncate">
            Search
          </h1>
          {query && (
            <p className="text-white/70 text-base xs:text-sm truncate">
              Results for "{query}"
            </p>
          )}
        </div>
      </motion.div>

      {/* Search Input */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <div className="flex items-center w-full max-w-2xl bg-white/10 backdrop-blur-lg rounded-xl xs:rounded-lg px-4 xs:px-3 py-3 xs:py-2.5 border border-white/20">
          <SearchOutlined className="text-white/70 text-lg xs:text-base mr-3 xs:mr-2 flex-shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="What do you want to listen to?"
            className="bg-transparent outline-none w-full text-white placeholder-white/50 text-base xs:text-sm min-w-0"
            autoFocus
          />
        </div>
      </motion.div>

      {/* Tabs */}
      {searchResults && searchResults.totalResults > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <div className="flex gap-2 xs:gap-1 border-b border-white/10 pb-3 xs:pb-2 overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 xs:px-3 py-2 xs:py-1.5 rounded-lg xs:rounded-md text-sm xs:text-xs font-medium transition-all duration-200 whitespace-nowrap flex-shrink-0 ${
                  activeTab === tab.id
                    ? "bg-white/20 text-white"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className="ml-2 xs:ml-1.5 px-2 xs:px-1.5 py-0.5 bg-white/20 rounded-full text-xs xs:text-[10px]">
                    {tab.count}
                  </span>
                )}
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
      >
        <AnimatePresence mode="wait">{renderContent()}</AnimatePresence>
      </motion.div>
    </motion.main>
  );
};

export default Search;
