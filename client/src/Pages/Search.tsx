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
        return <PlayCircleOutlined className="text-lg text-white/70" />;
      case "artist":
        return <UserOutlined className="text-lg text-white/70" />;
      case "album":
        return <PicRightOutlined className="text-lg text-white/70" />;
      case "playlist":
        return <UnorderedListOutlined className="text-lg text-white/70" />;
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
      whileHover={{ scale: 1.02, backgroundColor: "rgba(255, 255, 255, 0.1)" }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="p-4 rounded-xl cursor-pointer transition-all duration-200 flex items-center gap-4 hover:bg-white/5"
    >
      {/* Image/Icon */}
      <div className="relative flex-shrink-0">
        {item.coverUrl || item.avatar ? (
          <div className="w-16 h-16 rounded-lg overflow-hidden bg-white/10">
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
          <div className="w-16 h-16 rounded-lg bg-white/10 flex items-center justify-center">
            {getIcon()}
          </div>
        )}

        {/* Play button overlay for tracks */}
        {type === "track" && (
          <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <PlayCircleOutlined className="text-2xl text-white" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-white text-lg truncate mb-1">
          {item.name}
        </h3>
        <p className="text-white/60 text-sm truncate">{getSecondaryText()}</p>
        {type === "track" && item.duration && (
          <p className="text-white/40 text-xs mt-1">
            {Math.floor(item.duration / 60)}:
            {(item.duration % 60).toString().padStart(2, "0")}
          </p>
        )}
      </div>

      {/* Type badge */}
      <div className="flex-shrink-0">
        <span className="px-2 py-1 bg-white/10 rounded-lg text-white/60 text-xs uppercase">
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
        <div className="flex flex-col items-center justify-center py-20">
          <LoadingOutlined className="text-4xl text-white/70 mb-4" spin />
          <p className="text-white/70 text-lg">Searching...</p>
        </div>
      );
    }

    if (!searchResults || searchResults.totalResults === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-20">
          <SearchOutlined className="text-4xl text-white/30 mb-4" />
          <h3 className="text-white/70 text-xl mb-2">No results found</h3>
          <p className="text-white/50 text-center max-w-md">
            {query.length >= 2
              ? `We couldn't find anything for "${query}". Try different keywords.`
              : "Enter at least 2 characters to start searching."}
          </p>
        </div>
      );
    }

    const renderItems = (items: any[], type: string) => (
      <div className="grid gap-2">
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
          <div className="space-y-8">
            {/* Top Results */}
            {searchResults.tracks && searchResults.tracks.length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <h2 className="text-white text-xl font-semibold mb-4">
                  Top Result
                </h2>
                <div className="bg-white/5 rounded-xl p-6 max-w-sm">
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
                <h2 className="text-white text-xl font-semibold mb-4">
                  Tracks ({searchResults.tracks.length})
                </h2>
                {renderItems(searchResults.tracks.slice(1, 6), "track")}
                {searchResults.tracks.length > 6 && (
                  <button
                    onClick={() => setActiveTab("tracks")}
                    className="mt-4 text-white/70 hover:text-white text-sm"
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
                <h2 className="text-white text-xl font-semibold mb-4">
                  Artists ({searchResults.artists.length})
                </h2>
                {renderItems(searchResults.artists.slice(0, 5), "artist")}
                {searchResults.artists.length > 5 && (
                  <button
                    onClick={() => setActiveTab("artists")}
                    className="mt-4 text-white/70 hover:text-white text-sm"
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
                <h2 className="text-white text-xl font-semibold mb-4">
                  Albums ({searchResults.albums.length})
                </h2>
                {renderItems(searchResults.albums.slice(0, 5), "album")}
                {searchResults.albums.length > 5 && (
                  <button
                    onClick={() => setActiveTab("albums")}
                    className="mt-4 text-white/70 hover:text-white text-sm"
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
      className="w-full min-h-screen pl-4 pr-4 sm:pl-8 sm:pr-8 xl:pl-[22vw] xl:pr-[2vw] flex flex-col gap-6 mb-45 xl:mb-6 py-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header */}
      <motion.div
        className="flex items-center gap-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <motion.button
          onClick={() => navigate("/")}
          className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-lg rounded-xl transition-all duration-200 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-white/20"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <ArrowLeftOutlined className="text-white text-xl" />
        </motion.button>

        <div className="flex-1">
          <h1 className="text-white text-3xl font-bold mb-2">Search</h1>
          {query && (
            <p className="text-white/70 text-lg">Results for "{query}"</p>
          )}
        </div>
      </motion.div>

      {/* Search Input */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <div className="flex items-center max-w-2xl bg-white/10 backdrop-blur-lg rounded-xl px-4 py-3 border border-white/20">
          <SearchOutlined className="text-white/70 text-xl mr-3" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="What do you want to listen to?"
            className="bg-transparent outline-none w-full text-white placeholder-white/50 text-lg"
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
          <div className="flex gap-2 border-b border-white/10 pb-4">
            {tabs.map((tab) => (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? "bg-white/20 text-white"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs">
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
