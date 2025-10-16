import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  SearchOutlined,
  CaretRightOutlined,
  PauseOutlined,
  HeartOutlined,
  HeartFilled,
  UserOutlined,
  VerifiedOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useGetUserQuery } from "../state/UserApi.slice";
import { useDispatch, useSelector } from "react-redux";
import { setCurrentTrack, setIsPlaying } from "../state/CurrentTrack.slice";
import { playTrackAndQueue } from "../state/Queue.slice";
import { api } from "../shared/api";
import type { AppDispatch } from "../store";
import type { Track } from "../types/TrackData";

/**
 * Artists Discovery Page
 * Features: search, track playback with recommendations, like functionality
 */

interface Artist {
  _id: string;
  name: string;
  slug: string;
  avatar: string | null;
  bio: string;
  genres: string[];
  isVerified: boolean;
  followerCount: number;
  socialLinks?: {
    spotify?: string;
    instagram?: string;
    twitter?: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface SimpleTrack {
  _id: string;
  name: string;
  duration: number;
  coverUrl: string | null;
  artist: {
    _id: string;
    name: string;
    avatar: string | null;
  };
}

interface SearchResult {
  artists: Artist[];
  count: number;
  query: string;
}

interface ArtistCardProps {
  artist: Artist;
  onLike: (artistId: string) => void;
  onUnlike: (artistId: string) => void;
  isLiked: boolean;
  tracks: SimpleTrack[];
  isLoadingTracks: boolean;
}

const ArtistCard: React.FC<ArtistCardProps> = ({
  artist,
  onLike,
  onUnlike,
  isLiked,
  tracks,
  isLoadingTracks,
}) => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { data: user } = useGetUserQuery();
  const currentTrack = useSelector((state: any) => state.currentTrack);

  const formatNumber = useCallback((num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  }, []);

  const formatDuration = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }, []);

  const handleLikeClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (isLiked) {
        onUnlike(artist._id);
      } else {
        onLike(artist._id);
      }
    },
    [isLiked, onLike, onUnlike, artist._id]
  );

  const handleArtistClick = useCallback(() => {
    navigate(`/artist/${artist._id}`);
  }, [navigate, artist._id]);

  const handleTrackPlay = useCallback(
    async (track: SimpleTrack, e: React.MouseEvent) => {
      e.stopPropagation();

      if (!track || !user) return;

      const isCurrentTrack = currentTrack.currentTrack?._id === track._id;

      if (isCurrentTrack) {
        dispatch(setIsPlaying(!currentTrack.isPlaying));
        return;
      }

      try {
        const response = await api.recommendations.getForUser(user._id);
        const data = await response.json();

        if (data.success) {
          const recommendations: Track[] = data.data || [];
          const fullTrack: Track = track as any;
          const playQueue = [fullTrack, ...recommendations];

          await dispatch(
            playTrackAndQueue({
              track: fullTrack,
              contextTracks: playQueue,
              startIndex: 0,
            })
          );

          setTimeout(() => {
            dispatch(setIsPlaying(true));
          }, 50);
        } else {
          dispatch(setCurrentTrack(track as any));
          setTimeout(() => {
            dispatch(setIsPlaying(true));
          }, 50);
        }
      } catch (error) {
        console.error("Error getting recommendations:", error);
        dispatch(setCurrentTrack(track as any));
        setTimeout(() => {
          dispatch(setIsPlaying(true));
        }, 50);
      }
    },
    [user, currentTrack, dispatch]
  );

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ y: -5 }}
      className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all duration-300 cursor-pointer group"
      onClick={handleArtistClick}
    >
      <div className="flex items-start gap-4 mb-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-white/10 flex items-center justify-center">
            {artist.avatar ? (
              <img
                src={artist.avatar}
                alt={artist.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none";
                }}
              />
            ) : (
              <UserOutlined
                style={{ color: "rgba(255, 255, 255, 0.5)", fontSize: "24px" }}
              />
            )}
          </div>
          {artist.isVerified && (
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
              <VerifiedOutlined style={{ color: "white", fontSize: "12px" }} />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-semibold text-lg truncate group-hover:text-purple-300 transition-colors">
              {artist.name}
            </h3>
            <button
              onClick={handleLikeClick}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
              aria-label={isLiked ? "Unlike artist" : "Like artist"}
            >
              {isLiked ? (
                <HeartFilled style={{ color: "#ef4444", fontSize: "18px" }} />
              ) : (
                <HeartOutlined
                  style={{
                    color: "rgba(255, 255, 255, 0.7)",
                    fontSize: "18px",
                  }}
                />
              )}
            </button>
          </div>

          <div className="flex items-center gap-3 mt-1">
            <span className="text-white/60 text-sm">
              {formatNumber(artist.followerCount)} followers
            </span>
            {artist.genres.length > 0 && (
              <>
                <span className="text-white/30">•</span>
                <span className="text-purple-300 text-sm">
                  {artist.genres.slice(0, 2).join(", ")}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {artist.bio && (
        <p className="text-white/70 text-sm mb-4 line-clamp-2">{artist.bio}</p>
      )}

      <div className="space-y-2">
        <h4 className="text-white/80 text-sm font-medium mb-2">
          Popular Tracks
        </h4>

        {isLoadingTracks ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-lg">
                <div className="w-8 h-8 bg-white/10 rounded animate-pulse" />
                <div className="flex-1">
                  <div className="h-3 bg-white/10 rounded w-3/4 mb-1 animate-pulse" />
                  <div className="h-2 bg-white/5 rounded w-1/2 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : tracks.length > 0 ? (
          <div className="space-y-1">
            {tracks.slice(0, 3).map((track, index) => {
              const isCurrentTrack =
                currentTrack.currentTrack?._id === track._id;
              const isThisTrackPlaying =
                isCurrentTrack && currentTrack.isPlaying;

              return (
                <motion.div
                  key={track._id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors group/track cursor-pointer"
                  onClick={(e) => handleTrackPlay(track, e)}
                >
                  <div className="relative w-8 h-8 rounded overflow-hidden bg-white/10 flex items-center justify-center">
                    {track.coverUrl ? (
                      <img
                        src={track.coverUrl}
                        alt={track.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <CaretRightOutlined
                        style={{
                          color: "rgba(255, 255, 255, 0.5)",
                          fontSize: "14px",
                        }}
                      />
                    )}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/track:opacity-100 transition-opacity flex items-center justify-center">
                      {isThisTrackPlaying ? (
                        <PauseOutlined
                          style={{ color: "white", fontSize: "14px" }}
                        />
                      ) : (
                        <CaretRightOutlined
                          style={{ color: "white", fontSize: "14px" }}
                        />
                      )}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm truncate ${
                        isCurrentTrack ? "text-green-400" : "text-white"
                      }`}
                    >
                      {track.name}
                    </p>
                    <p className="text-white/50 text-xs">
                      {formatDuration(track.duration)}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <p className="text-white/50 text-sm italic">No tracks available</p>
        )}
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          handleArtistClick();
        }}
        className="w-full mt-4 py-2 text-purple-300 hover:text-purple-200 text-sm font-medium transition-colors"
      >
        View Profile →
      </button>
    </motion.div>
  );
};

export default function Artists() {
  const navigate = useNavigate();
  const { data: user } = useGetUserQuery();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [popularArtists, setPopularArtists] = useState<Artist[]>([]);
  const [artistTracks, setArtistTracks] = useState<{
    [key: string]: SimpleTrack[];
  }>({});
  const [likedArtists, setLikedArtists] = useState<Set<string>>(new Set());

  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingPopular, setIsLoadingPopular] = useState(true);
  const [loadingTracks, setLoadingTracks] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const [hasMore, _setHasMore] = useState(true);

  useEffect(() => {
    if (user?.likedArtists) {
      const likedIds = new Set(
        user.likedArtists.map((artist: any) =>
          typeof artist === "string" ? artist : artist._id
        )
      );
      setLikedArtists(likedIds);
    }
  }, [user]);

  const fetchPopularArtists = useCallback(async () => {
    try {
      setIsLoadingPopular(true);
      setError(null);

      const response = await api.artist.getPopular({ limit: 12 });
      const data = await response.json();

      if (data.success) {
        setPopularArtists(data.data.artists);
      } else {
        throw new Error("Failed to fetch popular artists");
      }
    } catch (error) {
      console.error("Error fetching popular artists:", error);
      setError("Failed to load artists. Please try again.");
    } finally {
      setIsLoadingPopular(false);
    }
  }, []);

  const fetchArtistTracks = useCallback(
    async (artistId: string) => {
      if (artistTracks[artistId] || loadingTracks.has(artistId)) {
        return;
      }

      try {
        setLoadingTracks((prev) => new Set(prev).add(artistId));

        const response = await api.artist.getTracks(artistId, { limit: 3 });
        const data = await response.json();

        if (data.success) {
          setArtistTracks((prev) => ({
            ...prev,
            [artistId]: data.data.tracks || data.data,
          }));
        }
      } catch (error) {
        console.error("Error fetching artist tracks:", error);
      } finally {
        setLoadingTracks((prev) => {
          const newSet = new Set(prev);
          newSet.delete(artistId);
          return newSet;
        });
      }
    },
    [artistTracks, loadingTracks]
  );

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

          const response = await api.artist.search(query, { limit: 20 });
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

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const query = e.target.value;
      setSearchQuery(query);
      debouncedSearch(query);
    },
    [debouncedSearch]
  );

  const handleLikeArtist = useCallback(
    async (artistId: string) => {
      if (!user) {
        navigate("/login");
        return;
      }

      try {
        const response = await api.artist.like(artistId);

        if (response.ok) {
          setLikedArtists((prev) => new Set(prev).add(artistId));
        }
      } catch (error) {
        console.error("Error liking artist:", error);
      }
    },
    [user, navigate]
  );

  const handleUnlikeArtist = useCallback(async (artistId: string) => {
    try {
      const response = await api.artist.unlike(artistId);

      if (response.ok) {
        setLikedArtists((prev) => {
          const newSet = new Set(prev);
          newSet.delete(artistId);
          return newSet;
        });
      }
    } catch (error) {
      console.error("Error unliking artist:", error);
    }
  }, []);

  useEffect(() => {
    const artistsToLoad = searchResults?.artists || popularArtists;
    artistsToLoad.forEach((artist) => {
      fetchArtistTracks(artist._id);
    });
  }, [searchResults, popularArtists, fetchArtistTracks]);

  useEffect(() => {
    fetchPopularArtists();
  }, [fetchPopularArtists]);

  const currentArtists = searchResults?.artists || popularArtists;
  const isSearchMode = Boolean(searchQuery.trim());

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="px-4 xl:px-0 xl:pl-[22vw] xl:pr-[2vw] py-8 pb-36 xl:pb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent mb-4">
            Discover Artists
          </h1>
          <p className="text-white/70 text-lg max-w-2xl">
            Explore talented artists and their music. Find your next favorite
            track.
          </p>
        </motion.div>

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
              placeholder="Search artists..."
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

        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-6 bg-red-500/10 border border-red-500/20 rounded-2xl"
          >
            <p className="text-red-300 text-center">{error}</p>
            <button
              onClick={fetchPopularArtists}
              className="mt-4 mx-auto block px-6 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-colors"
            >
              Try Again
            </button>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
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
              "Popular Artists"
            )}
          </h2>
        </motion.div>

        <AnimatePresence mode="wait">
          {isLoadingPopular && !isSearchMode ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              {Array.from({ length: 8 }).map((_, index) => (
                <div
                  key={index}
                  className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 animate-pulse"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-16 h-16 bg-white/10 rounded-full" />
                    <div className="flex-1">
                      <div className="h-5 bg-white/10 rounded w-3/4 mb-2" />
                      <div className="h-3 bg-white/5 rounded w-1/2" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 bg-white/5 rounded w-full" />
                    <div className="h-3 bg-white/5 rounded w-2/3" />
                  </div>
                </div>
              ))}
            </motion.div>
          ) : currentArtists.length > 0 ? (
            <motion.div
              key="artists-grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              {currentArtists.map((artist) => (
                <ArtistCard
                  key={artist._id}
                  artist={artist}
                  onLike={handleLikeArtist}
                  onUnlike={handleUnlikeArtist}
                  isLiked={likedArtists.has(artist._id)}
                  tracks={artistTracks[artist._id] || []}
                  isLoadingTracks={loadingTracks.has(artist._id)}
                />
              ))}
            </motion.div>
          ) : isSearchMode ? (
            <motion.div
              key="no-results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center py-16"
            >
              <div className="w-24 h-24 mx-auto mb-6 bg-white/10 rounded-full flex items-center justify-center">
                <SearchOutlined
                  style={{
                    color: "rgba(255, 255, 255, 0.5)",
                    fontSize: "48px",
                  }}
                />
              </div>
              <h3 className="text-white text-xl font-semibold mb-2">
                No artists found
              </h3>
              <p className="text-white/60">
                Try searching with different keywords
              </p>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {!isSearchMode && hasMore && currentArtists.length >= 12 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center mt-12"
          >
            <button className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-colors backdrop-blur-lg border border-white/20">
              Load More Artists
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
