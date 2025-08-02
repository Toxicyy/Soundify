import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  SearchOutlined,
  CaretRightOutlined,
  HeartOutlined,
  HeartFilled,
  UserOutlined,
  ClockCircleOutlined,
  StarFilled,
  LockOutlined,
  GlobalOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useGetUserQuery } from "../state/UserApi.slice";
import { useDispatch, useSelector } from "react-redux";
import { setIsPlaying } from "../state/CurrentTrack.slice";
import { playTrackAndQueue } from "../state/Queue.slice";
import { api } from "../shared/api";
import { type AppDispatch } from "../store";

/**
 * Playlists Discovery Page
 *
 * Features:
 * - Tabbed interface (Featured, User Playlists, Liked)
 * - Real-time search with debounce
 * - Featured platform playlists showcase
 * - User-created playlists grid
 * - Like/unlike functionality
 * - Privacy indicators
 * - Responsive layout
 * - Skeleton loading states
 * - Error handling with retry
 * - Track play functionality with recommendations
 */

interface PlaylistOwner {
  _id: string;
  name: string;
  username?: string;
  avatar: string | null;
}

interface Playlist {
  _id: string;
  name: string;
  description: string;
  coverUrl: string | null;
  owner: PlaylistOwner;
  tracks: string[]; // Array of track IDs
  tags: string[];
  category: "user" | "featured" | "curated";
  privacy: "public" | "private" | "unlisted";
  isDraft: boolean;
  trackCount: number;
  totalDuration: number;
  likeCount: number;
  createdAt: string;
  updatedAt: string;
}

interface SearchResult {
  playlists: Playlist[];
  count: number;
  query: string;
}

interface PlaylistCardProps {
  playlist: Playlist;
  onLike: (playlistId: string) => void;
  onUnlike: (playlistId: string) => void;
  isLiked: boolean;
  showOwner?: boolean;
  variant?: "default" | "featured" | "compact";
}

type TabType = "featured" | "user" | "liked" | "search";

/**
 * Playlist card component with multiple variants
 */
const PlaylistCard: React.FC<PlaylistCardProps> = ({
  playlist,
  onLike,
  onUnlike,
  isLiked,
  showOwner = true,
  variant = "default",
}) => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { data: user } = useGetUserQuery();
  const currentTrack = useSelector((state: any) => state.currentTrack);

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLiked) {
      onUnlike(playlist._id);
    } else {
      onLike(playlist._id);
    }
  };

  const handlePlaylistClick = () => {
    navigate(`/playlist/${playlist._id}`);
  };

  /**
   * Handle playlist play with recommendations queue
   */
  const handlePlaylistPlay = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!playlist || !user || playlist.tracks.length === 0) return;

    try {
      // Get playlist tracks
      const tracksResponse = await api.playlist.getTracks(playlist._id, {
        limit: 50,
      });
      const tracksData = await tracksResponse.json();

      if (!tracksData.success || !tracksData.data?.tracks?.length) {
        console.error("No tracks found in playlist");
        return;
      }

      const playlistTracks = tracksData.data.tracks;
      const firstTrack = playlistTracks[0];

      // Check if first track is currently playing
      const isCurrentTrack = currentTrack.currentTrack?._id === firstTrack._id;

      if (isCurrentTrack) {
        dispatch(setIsPlaying(!currentTrack.isPlaying));
        return;
      }

      try {
        // Get recommendations to add after playlist
        const recommendationsResponse = await api.recommendations.getForUser(
          user._id
        );
        const recommendationsData = await recommendationsResponse.json();

        const recommendations = recommendationsData.success
          ? recommendationsData.data
          : [];
        const fullQueue = [...playlistTracks, ...recommendations];

        dispatch(
          playTrackAndQueue({
            track: firstTrack,
            contextTracks: fullQueue,
            startIndex: 0,
          })
        );

        setTimeout(() => {
          dispatch(setIsPlaying(true));
        }, 50);
      } catch (error) {
        console.error("Error getting recommendations:", error);

        // Fallback: play just the playlist
        dispatch(
          playTrackAndQueue({
            track: firstTrack,
            contextTracks: playlistTracks,
            startIndex: 0,
          })
        );

        setTimeout(() => {
          dispatch(setIsPlaying(true));
        }, 50);
      }
    } catch (error) {
      console.error("Error playing playlist:", error);
    }
  };

  const getPrivacyIcon = () => {
    switch (playlist.privacy) {
      case "private":
        return <LockOutlined style={{ color: "#facc15" }} />;
      case "unlisted":
        return <GlobalOutlined style={{ color: "#3b82f6" }} />;
      default:
        return null;
    }
  };

  const cardClasses = {
    default:
      "bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all duration-300 cursor-pointer group",
    featured:
      "bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-lg border border-purple-300/20 rounded-2xl p-6 hover:border-purple-300/40 transition-all duration-300 cursor-pointer group",
    compact:
      "bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-4 hover:border-white/20 transition-all duration-300 cursor-pointer group",
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ y: -5 }}
      className={cardClasses[variant]}
      onClick={handlePlaylistClick}
    >
      {/* Cover and Title Section */}
      <div className="relative mb-4">
        <div className="aspect-square rounded-xl overflow-hidden bg-white/10 relative group/cover">
          {playlist.coverUrl ? (
            <img
              src={playlist.coverUrl}
              alt={playlist.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <CaretRightOutlined
                style={{ color: "rgba(255, 255, 255, 0.3)", fontSize: "48px" }}
              />
            </div>
          )}

          {/* Overlay on hover */}
          <div
            className="absolute inset-0 bg-black/50 opacity-0 group-hover/cover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
            onClick={handlePlaylistPlay}
          >
            <CaretRightOutlined style={{ color: "white", fontSize: "48px" }} />
          </div>

          {/* Featured badge */}
          {playlist.category === "featured" && (
            <div className="absolute top-2 left-2 bg-gradient-to-r from-yellow-400 to-orange-400 text-black text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
              <StarFilled style={{ fontSize: "10px" }} />
              Featured
            </div>
          )}

          {/* Privacy indicator */}
          {getPrivacyIcon() && (
            <div className="absolute top-2 right-2 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center">
              {getPrivacyIcon()}
            </div>
          )}

          {/* Like button */}
          <button
            onClick={handleLikeClick}
            className="absolute bottom-2 right-2 w-8 h-8 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-colors"
            aria-label={isLiked ? "Unlike playlist" : "Like playlist"}
          >
            {isLiked ? (
              <HeartFilled style={{ color: "#ef4444", fontSize: "14px" }} />
            ) : (
              <HeartOutlined style={{ color: "white", fontSize: "14px" }} />
            )}
          </button>
        </div>
      </div>

      {/* Playlist Info */}
      <div className="space-y-3">
        <div>
          <h3 className="text-white font-semibold text-lg line-clamp-2 group-hover:text-purple-300 transition-colors">
            {playlist.name}
          </h3>

          {playlist.description && (
            <p className="text-white/60 text-sm mt-1 line-clamp-2">
              {playlist.description}
            </p>
          )}
        </div>

        {/* Owner info */}
        {showOwner && (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full overflow-hidden bg-white/10 flex items-center justify-center flex-shrink-0">
              {playlist.owner.avatar ? (
                <img
                  src={playlist.owner.avatar}
                  alt={playlist.owner.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <UserOutlined
                  style={{
                    color: "rgba(255, 255, 255, 0.5)",
                    fontSize: "12px",
                  }}
                />
              )}
            </div>
            <span className="text-white/70 text-sm truncate">
              by {playlist.owner.name}
            </span>
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between text-white/50 text-sm">
          <div className="flex items-center gap-4">
            <span>{playlist.trackCount} tracks</span>
            {playlist.totalDuration > 0 && (
              <>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <ClockCircleOutlined style={{ fontSize: "12px" }} />
                  {formatDuration(playlist.totalDuration)}
                </div>
              </>
            )}
          </div>

          {playlist.likeCount > 0 && (
            <div className="flex items-center gap-1">
              <HeartFilled style={{ color: "#ef4444", fontSize: "12px" }} />
              <span>{playlist.likeCount}</span>
            </div>
          )}
        </div>

        {/* Tags */}
        {playlist.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {playlist.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="bg-purple-500/20 text-purple-200 text-xs px-2 py-1 rounded-full"
              >
                {tag}
              </span>
            ))}
            {playlist.tags.length > 3 && (
              <span className="text-white/50 text-xs px-2 py-1">
                +{playlist.tags.length - 3} more
              </span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

/**
 * Tab navigation component
 */
const TabNavigation: React.FC<{
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  isSearchMode: boolean;
}> = ({ activeTab, onTabChange, isSearchMode }) => {
  const tabs = [
    {
      id: "featured" as TabType,
      label: "Featured",
      icon: <StarFilled style={{ fontSize: "14px" }} />,
    },
    {
      id: "user" as TabType,
      label: "Community",
      icon: <UserOutlined style={{ fontSize: "14px" }} />,
    },
    {
      id: "liked" as TabType,
      label: "Liked",
      icon: <HeartFilled style={{ fontSize: "14px" }} />,
    },
  ];

  if (isSearchMode) {
    return (
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => onTabChange("featured")}
          className="text-purple-300 hover:text-white transition-colors text-sm"
        >
          ← Back to browse
        </button>
        <span className="text-white/30">|</span>
        <span className="text-white font-medium">Search Results</span>
      </div>
    );
  }

  return (
    <div className="flex space-x-1 bg-white/5 backdrop-blur-lg rounded-xl p-1 mb-6 overflow-x-auto">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap
            ${
              activeTab === tab.id
                ? "bg-purple-500 text-white shadow-lg"
                : "text-white/70 hover:text-white hover:bg-white/10"
            }
          `}
        >
          <span>{tab.icon}</span>
          {tab.label}
        </button>
      ))}
    </div>
  );
};

/**
 * Main Playlists page component
 */
export default function Playlists() {
  const navigate = useNavigate();
  const { data: user } = useGetUserQuery();

  // State management
  const [activeTab, setActiveTab] = useState<TabType>("featured");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [featuredPlaylists, setFeaturedPlaylists] = useState<Playlist[]>([]);
  const [userPlaylists, setUserPlaylists] = useState<Playlist[]>([]);
  const [likedPlaylists, setLikedPlaylists] = useState<Playlist[]>([]);
  const [likedPlaylistIds, setLikedPlaylistIds] = useState<Set<string>>(
    new Set()
  );

  // Loading states
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingFeatured, setIsLoadingFeatured] = useState(true);
  const [isLoadingUser, setIsLoadingUser] = useState(false);
  const [isLoadingLiked, setIsLoadingLiked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [hasMore, _setHasMore] = useState(true);

  /**
   * Initialize liked playlists from user data
   */
  useEffect(() => {
    if (user?.likedPlaylists) {
      const likedIds = new Set(
        user.likedPlaylists.map((playlist: any) =>
          typeof playlist === "string" ? playlist : playlist._id
        )
      );
      setLikedPlaylistIds(likedIds);
    }
  }, [user]);

  /**
   * Fetch featured playlists
   */
  const fetchFeaturedPlaylists = useCallback(async () => {
    try {
      setIsLoadingFeatured(true);
      setError(null);

      const response = await api.playlist.getFeatured({ limit: 20 });
      const data = await response.json();

      if (data.success) {
        setFeaturedPlaylists(data.data.playlists || data.data);
      } else {
        throw new Error("Failed to fetch featured playlists");
      }
    } catch (error) {
      console.error("Error fetching featured playlists:", error);
      setError("Failed to load featured playlists. Please try again.");
    } finally {
      setIsLoadingFeatured(false);
    }
  }, []);

  /**
   * Fetch user/community playlists
   */
  const fetchUserPlaylists = useCallback(async () => {
    try {
      setIsLoadingUser(true);
      setError(null);

      const response = await api.playlist.getAll({
        category: "user",
        privacy: "public",
        limit: 20,
      });
      const data = await response.json();

      if (data.success) {
        setUserPlaylists(data.data.playlists || data.data);
      } else {
        throw new Error("Failed to fetch user playlists");
      }
    } catch (error) {
      console.error("Error fetching user playlists:", error);
      setError("Failed to load community playlists. Please try again.");
    } finally {
      setIsLoadingUser(false);
    }
  }, []);

  /**
   * Fetch liked playlists
   */
  const fetchLikedPlaylists = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoadingLiked(true);
      setError(null);

      const response = await api.playlist.getLiked({ limit: 20 });
      const data = await response.json();

      if (data.success) {
        setLikedPlaylists(data.data.playlists || data.data);
      } else {
        throw new Error("Failed to fetch liked playlists");
      }
    } catch (error) {
      console.error("Error fetching liked playlists:", error);
      setError("Failed to load liked playlists. Please try again.");
    } finally {
      setIsLoadingLiked(false);
    }
  }, [user]);

  /**
   * Debounced search function
   */
  const debouncedSearch = useMemo(() => {
    let timeoutId: number;

    return (query: string) => {
      clearTimeout(timeoutId);

      if (!query.trim()) {
        setSearchResults(null);
        return;
      }

      timeoutId = setTimeout(async () => {
        try {
          setIsSearching(true);
          setError(null);

          const response = await api.playlist.search(query, { limit: 20 });
          const data = await response.json();

          if (data.success) {
            setSearchResults(data.data);
          } else {
            throw new Error("Search failed");
          }
        } catch (error) {
          console.error("Search error:", error);
          setError("Search failed. Please try again.");
        } finally {
          setIsSearching(false);
        }
      }, 300);
    };
  }, []);

  /**
   * Handle search input changes
   */
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    debouncedSearch(query);
  };

  /**
   * Handle playlist like/unlike
   */
  const handleLikePlaylist = useCallback(
    async (playlistId: string) => {
      if (!user) {
        navigate("/login");
        return;
      }

      try {
        const response = await api.playlist.like(playlistId);

        if (response.ok) {
          setLikedPlaylistIds((prev) => new Set(prev).add(playlistId));
          // Update like count in current playlists
          const updatePlaylistLikes = (playlists: Playlist[]) =>
            playlists.map((p) =>
              p._id === playlistId ? { ...p, likeCount: p.likeCount + 1 } : p
            );

          setFeaturedPlaylists(updatePlaylistLikes);
          setUserPlaylists(updatePlaylistLikes);
        }
      } catch (error) {
        console.error("Error liking playlist:", error);
      }
    },
    [user, navigate]
  );

  const handleUnlikePlaylist = useCallback(
    async (playlistId: string) => {
      try {
        const response = await api.playlist.unlike(playlistId);

        if (response.ok) {
          setLikedPlaylistIds((prev) => {
            const newSet = new Set(prev);
            newSet.delete(playlistId);
            return newSet;
          });

          // Update like count in current playlists
          const updatePlaylistLikes = (playlists: Playlist[]) =>
            playlists.map((p) =>
              p._id === playlistId
                ? { ...p, likeCount: Math.max(0, p.likeCount - 1) }
                : p
            );

          setFeaturedPlaylists(updatePlaylistLikes);
          setUserPlaylists(updatePlaylistLikes);

          // Remove from liked playlists if currently viewing liked
          if (activeTab === "liked") {
            setLikedPlaylists((prev) =>
              prev.filter((p) => p._id !== playlistId)
            );
          }
        }
      } catch (error) {
        console.error("Error unliking playlist:", error);
      }
    },
    [activeTab]
  );

  /**
   * Handle tab changes and data fetching
   */
  const handleTabChange = useCallback(
    (tab: TabType) => {
      setActiveTab(tab);
      setSearchQuery("");
      setSearchResults(null);
      setError(null);

      // Fetch data for the selected tab if not already loaded
      switch (tab) {
        case "featured":
          if (featuredPlaylists.length === 0) {
            fetchFeaturedPlaylists();
          }
          break;
        case "user":
          if (userPlaylists.length === 0) {
            fetchUserPlaylists();
          }
          break;
        case "liked":
          if (user && likedPlaylists.length === 0) {
            fetchLikedPlaylists();
          }
          break;
      }
    },
    [
      featuredPlaylists.length,
      userPlaylists.length,
      likedPlaylists.length,
      user,
      fetchFeaturedPlaylists,
      fetchUserPlaylists,
      fetchLikedPlaylists,
    ]
  );

  /**
   * Initialize featured playlists on component mount
   */
  useEffect(() => {
    fetchFeaturedPlaylists();
  }, [fetchFeaturedPlaylists]);

  /**
   * Get current playlists based on active tab or search
   */
  const getCurrentPlaylists = () => {
    if (searchResults) {
      return searchResults.playlists;
    }

    switch (activeTab) {
      case "featured":
        return featuredPlaylists;
      case "user":
        return userPlaylists;
      case "liked":
        return likedPlaylists;
      default:
        return [];
    }
  };

  /**
   * Get loading state for current tab
   */
  const getCurrentLoadingState = () => {
    if (isSearching) return true;

    switch (activeTab) {
      case "featured":
        return isLoadingFeatured;
      case "user":
        return isLoadingUser;
      case "liked":
        return isLoadingLiked;
      default:
        return false;
    }
  };

  const currentPlaylists = getCurrentPlaylists();
  const isLoading = getCurrentLoadingState();
  const isSearchMode = Boolean(searchQuery.trim());

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Main content with responsive padding */}
      <div className="px-4 xl:px-0 xl:pl-[22vw] xl:pr-[2vw] py-8 pb-36 xl:pb-8">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent mb-4">
            Discover Playlists
          </h1>
          <p className="text-white/70 text-lg max-w-2xl">
            Explore curated collections and community playlists. Find your
            perfect music mix.
          </p>
        </motion.div>

        {/* Search Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="relative max-w-2xl">
            <SearchOutlined
              style={{ color: "rgba(255, 255, 255, 0.5)", fontSize: "20px" }}
              className="absolute left-4 top-1/2 transform -translate-y-1/2"
            />
            <input
              type="text"
              placeholder="Search playlists..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl py-4 pl-12 pr-6 text-white placeholder-white/50 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all"
            />
            {isSearching && (
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                <div className="w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
        </motion.div>

        {/* Tab Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <TabNavigation
            activeTab={activeTab}
            onTabChange={handleTabChange}
            isSearchMode={isSearchMode}
          />
        </motion.div>

        {/* Error State */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-6 bg-red-500/10 border border-red-500/20 rounded-2xl"
          >
            <p className="text-red-300 text-center">{error}</p>
            <button
              onClick={() => handleTabChange(activeTab)}
              className="mt-4 mx-auto block px-6 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-colors"
            >
              Try Again
            </button>
          </motion.div>
        )}

        {/* Results Header */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mb-6"
        >
          <h2 className="text-2xl font-bold text-white mb-2">
            {isSearchMode ? (
              <>
                Search Results
                {searchResults && (
                  <span className="text-white/60 font-normal ml-2">
                    ({searchResults.count} found)
                  </span>
                )}
              </>
            ) : (
              <>
                {activeTab === "featured" && "Featured Playlists"}
                {activeTab === "user" && "Community Playlists"}
                {activeTab === "liked" && "Your Liked Playlists"}
              </>
            )}
          </h2>
        </motion.div>

        {/* Auth required message for liked playlists */}
        {activeTab === "liked" && !user && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="w-24 h-24 mx-auto mb-6 bg-white/10 rounded-full flex items-center justify-center">
              <HeartOutlined
                style={{ color: "rgba(255, 255, 255, 0.5)", fontSize: "48px" }}
              />
            </div>
            <h3 className="text-white text-xl font-semibold mb-2">
              Sign in to view liked playlists
            </h3>
            <p className="text-white/60 mb-6">
              Create an account to like and save your favorite playlists
            </p>
            <button
              onClick={() => navigate("/login")}
              className="px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-medium transition-colors"
            >
              Sign In
            </button>
          </motion.div>
        )}

        {/* Playlists Grid */}
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              {Array.from({ length: 8 }).map((_, index) => (
                <div
                  key={index}
                  className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 animate-pulse"
                >
                  <div className="aspect-square bg-white/10 rounded-xl mb-4" />
                  <div className="space-y-3">
                    <div className="h-5 bg-white/10 rounded w-3/4" />
                    <div className="h-3 bg-white/5 rounded w-1/2" />
                    <div className="h-3 bg-white/5 rounded w-2/3" />
                  </div>
                </div>
              ))}
            </motion.div>
          ) : currentPlaylists.length > 0 ? (
            <motion.div
              key="playlists-grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              {currentPlaylists.map((playlist) => (
                <PlaylistCard
                  key={playlist._id}
                  playlist={playlist}
                  onLike={handleLikePlaylist}
                  onUnlike={handleUnlikePlaylist}
                  isLiked={likedPlaylistIds.has(playlist._id)}
                  showOwner={activeTab !== "liked"}
                  variant={
                    playlist.category === "featured" ? "featured" : "default"
                  }
                />
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="no-results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center py-16"
            >
              <div className="w-24 h-24 mx-auto mb-6 bg-white/10 rounded-full flex items-center justify-center">
                {isSearchMode ? (
                  <SearchOutlined
                    style={{
                      color: "rgba(255, 255, 255, 0.5)",
                      fontSize: "48px",
                    }}
                  />
                ) : (
                  <CaretRightOutlined
                    style={{
                      color: "rgba(255, 255, 255, 0.5)",
                      fontSize: "48px",
                    }}
                  />
                )}
              </div>
              <h3 className="text-white text-xl font-semibold mb-2">
                {isSearchMode ? "No playlists found" : "No playlists available"}
              </h3>
              <p className="text-white/60">
                {isSearchMode
                  ? "Try searching with different keywords"
                  : "Check back later for new playlists"}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Load More Button */}
        {!isSearchMode && hasMore && currentPlaylists.length >= 20 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center mt-12"
          >
            <button
              onClick={() => {
                console.log("Load more playlists");
              }}
              className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-colors backdrop-blur-lg border border-white/20"
            >
              Load More Playlists
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
