// Pages/Admin/AdminPlatformPlaylists.tsx
import React, { useState, useCallback, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeftOutlined,
  PlusOutlined,
  EditOutlined,
  SearchOutlined,
  DeleteOutlined,
  SaveOutlined,
  UploadOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import type { Playlist } from "../../types/Playlist";
import type { Track } from "../../types/TrackData";

// Mock data - replace with actual API calls
const mockPlaylists: Playlist[] = [
  {
    _id: "1",
    id: "1",
    name: "Today's Top Hits",
    description: "The biggest hits right now",
    coverUrl: "https://via.placeholder.com/300x300",
    owner: { _id: "admin", name: "Platform", username: "platform", avatar: "" },
    tracks: [],
    tags: ["pop", "trending", "hits"],
    category: "featured",
    privacy: "public",
    likeCount: 15420,
    trackCount: 50,
    totalDuration: 10800,
    createdAt: "2024-01-01",
    updatedAt: "2024-01-15",
  },
  {
    _id: "2",
    id: "2",
    name: "Chill Vibes",
    description: "Perfect for relaxing",
    coverUrl: "https://via.placeholder.com/300x300",
    owner: { _id: "admin", name: "Platform", username: "platform", avatar: "" },
    tracks: [],
    tags: ["chill", "relax", "ambient"],
    category: "featured",
    privacy: "public",
    likeCount: 8930,
    trackCount: 35,
    totalDuration: 7200,
    createdAt: "2024-01-02",
    updatedAt: "2024-01-10",
  },
];

// Real API track search function
const searchTracksAPI = async (query: string): Promise<Track[]> => {
  try {
    const response = await fetch(
      `http://localhost:5000/api/tracks/search?q=${encodeURIComponent(query)}&limit=20`,
      {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.data?.tracks || [];
  } catch (error) {
    console.error("Search API error:", error);
    // Return empty array instead of mock data to avoid type errors
    return [];
  }
};

// Search Result Item Component
interface SearchResultItemProps {
  track: Track;
  onAdd: (track: Track) => void;
  onRemove: (trackId: string) => void;
  isAlreadyInPlaylist: boolean;
  isAdding: boolean;
}

const SearchResultItem: React.FC<SearchResultItemProps> = ({
  track,
  onAdd,
  onRemove,
  isAlreadyInPlaylist,
  isAdding,
}) => {
  const handleButtonClick = useCallback(() => {
    if (!isAdding) {
      if (isAlreadyInPlaylist) {
        onRemove(track._id);
      } else {
        onAdd(track);
      }
    }
  }, [track, onAdd, onRemove, isAlreadyInPlaylist, isAdding]);

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
      <img
        src={track.coverUrl}
        alt={track.name}
        className="w-12 h-12 rounded-lg object-cover"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.src = "/default-cover.jpg";
        }}
      />
      <div className="flex-1 min-w-0">
        <h4 className="text-white font-medium truncate">{track.name}</h4>
        <p className="text-white/60 text-sm truncate">{track.artist.name}</p>
        {track.duration && (
          <p className="text-white/40 text-xs">{formatDuration(track.duration)}</p>
        )}
      </div>
      <button
        onClick={handleButtonClick}
        disabled={isAdding}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
          isAlreadyInPlaylist
            ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
            : isAdding
            ? "bg-blue-500/20 text-blue-400 cursor-not-allowed"
            : "bg-emerald-500 hover:bg-emerald-600 text-white"
        }`}
      >
        {isAdding ? (
          <LoadingOutlined className="animate-spin" />
        ) : isAlreadyInPlaylist ? (
          "Remove"
        ) : (
          "Add"
        )}
      </button>
    </div>
  );
};

// Playlist Editor Component
interface PlaylistEditorProps {
  playlist: Playlist;
  isCreating: boolean;
  isEditing: boolean;
  onClose: () => void;
  onSave: (playlist: Playlist) => void;
}

const PlaylistEditor: React.FC<PlaylistEditorProps> = ({
  playlist,
  isCreating,
  isEditing,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    name: playlist.name,
    description: playlist.description || "",
    tags: playlist.tags.join(", "),
  });
  const [coverPreview, setCoverPreview] = useState<string | null>(
    playlist.coverUrl || null
  );
  const [_coverFile, setCoverFile] = useState<File | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [addingTrackIds, setAddingTrackIds] = useState<Set<string>>(new Set());

  // Initialize tracks from playlist if editing existing playlist
  useEffect(() => {
    if (playlist.tracks && Array.isArray(playlist.tracks) && !isCreating) {
      const trackObjects = playlist.tracks.filter(track => 
        typeof track === 'object' && track !== null && '_id' in track
      ) as Track[];
      setTracks(trackObjects);
    }
  }, [playlist, isCreating]);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const results = await searchTracksAPI(searchQuery);
        setSearchResults(results);
      } catch (error) {
        console.error("Search error:", error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300),
    []
  );

  // Effect to trigger search when query changes
  useEffect(() => {
    debouncedSearch(searchQuery);
  }, [searchQuery, debouncedSearch]);

  // Handle cover file change
  const handleCoverChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Image file size must be less than 5MB");
      return;
    }

    setCoverFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setCoverPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  const handleInputChange = useCallback((field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleAddTrack = useCallback((track: Track) => {
    const isAlreadyAdded = tracks.some((t) => t._id === track._id);
    if (!isAlreadyAdded) {
      setAddingTrackIds((prev) => new Set(prev).add(track._id));
      setTracks((prev) => [...prev, track]);
      
      // Remove adding state after short delay
      setTimeout(() => {
        setAddingTrackIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(track._id);
          return newSet;
        });
      }, 500);
    }
  }, [tracks]);

  const handleRemoveTrack = useCallback((trackId: string) => {
    setTracks((prev) => prev.filter((t) => t._id !== trackId));
  }, []);

  const handleSave = useCallback(() => {
    const updatedPlaylist: Playlist = {
      ...playlist,
      name: formData.name,
      description: formData.description,
      tags: formData.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      tracks,
      trackCount: tracks.length,
      totalDuration: tracks.reduce((sum, track) => sum + track.duration, 0),
      updatedAt: new Date().toISOString(),
    };

    onSave(updatedPlaylist);
  }, [playlist, formData, tracks, onSave]);

  const canSave = formData.name.trim().length > 0;
  const isTrackInPlaylist = useCallback((trackId: string) => {
    return tracks.some(t => t._id === trackId);
  }, [tracks]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <motion.div
          className="flex items-center justify-between mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all duration-200"
            >
              <ArrowLeftOutlined className="text-white text-xl" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-white">
                {isCreating ? "Create Platform Playlist" : 
                 isEditing ? "Edit Platform Playlist" : "View Platform Playlist"}
              </h1>
              <p className="text-white/70 mt-1">
                {isCreating
                  ? "Build a new curated playlist"
                  : isEditing 
                  ? `Editing "${playlist.name}"`
                  : `Viewing "${playlist.name}"`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 text-white rounded-lg transition-all duration-200"
            >
              {isEditing ? "Cancel" : "Close"}
            </button>
            {(isCreating || isEditing) && (
              <button
                onClick={handleSave}
                disabled={!canSave}
                className={`flex items-center gap-2 px-6 py-2 rounded-lg font-semibold transition-all duration-200 ${
                  canSave
                    ? "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg"
                    : "bg-white/10 text-white/50 cursor-not-allowed"
                }`}
              >
                <SaveOutlined />
                Save Playlist
              </button>
            )}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Playlist Form */}
          <motion.div
            className="lg:col-span-1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Playlist Details</h2>

              {/* Cover Upload */}
              <div className="mb-6">
                <label className="block text-white/80 text-sm font-medium mb-3">
                  Cover Image
                </label>
                <div className="relative">
                  <div className="aspect-square bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl overflow-hidden">
                    {coverPreview ? (
                      <img
                        src={coverPreview}
                        alt="Playlist cover"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="text-center">
                          <UploadOutlined className="text-4xl text-white/60 mb-2" />
                          <p className="text-white/60 text-sm">Upload Cover</p>
                        </div>
                      </div>
                    )}
                  </div>
                  {(isCreating || isEditing) && (
                    <>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleCoverChange}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity duration-200 rounded-xl">
                        <span className="text-white font-medium">Change Cover</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Playlist Name *
                  </label>
                  {isCreating || isEditing ? (
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      placeholder="Enter playlist name"
                      className="w-full px-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:border-white/40 focus:bg-white/15 transition-all duration-200"
                    />
                  ) : (
                    <div className="text-white text-lg font-medium">{playlist.name}</div>
                  )}
                </div>

                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Description
                  </label>
                  {isCreating || isEditing ? (
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleInputChange("description", e.target.value)}
                      placeholder="Describe your playlist..."
                      rows={3}
                      className="w-full px-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:border-white/40 focus:bg-white/15 transition-all duration-200 resize-none"
                    />
                  ) : (
                    <div className="text-white/80">{playlist.description || "No description"}</div>
                  )}
                </div>

                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Tags
                  </label>
                  {isCreating || isEditing ? (
                    <input
                      type="text"
                      value={formData.tags}
                      onChange={(e) => handleInputChange("tags", e.target.value)}
                      placeholder="pop, trending, hits (comma separated)"
                      className="w-full px-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:border-white/40 focus:bg-white/15 transition-all duration-200"
                    />
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {playlist.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-3 py-1 bg-white/10 text-white/80 text-sm rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="mt-6 bg-white/5 rounded-xl p-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-white">{tracks.length}</div>
                    <div className="text-white/60 text-sm">Tracks</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">
                      {Math.round(tracks.reduce((sum, track) => sum + track.duration, 0) / 60)}m
                    </div>
                    <div className="text-white/60 text-sm">Duration</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Track Management */}
          <motion.div
            className="lg:col-span-2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
              <h2 className="text-xl font-semibold text-white mb-6">
                {isCreating || isEditing ? "Manage Tracks" : "Playlist Tracks"}
              </h2>

              {/* Search Tracks - Only show in edit mode */}
              {(isCreating || isEditing) && (
                <div className="mb-6">
                  <div className="relative">
                    <SearchOutlined className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/60 text-lg" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search tracks to add..."
                      className="w-full pl-12 pr-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:border-white/40 focus:bg-white/15 transition-all duration-200"
                    />
                  </div>

                  {/* Search Results */}
                  {searchQuery && (
                    <div className="mt-4 max-h-60 overflow-y-auto space-y-2">
                      {isSearching ? (
                        <div className="text-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
                          <p className="text-white/60 mt-2">Searching...</p>
                        </div>
                      ) : searchResults.length > 0 ? (
                        searchResults.map((track) => (
                          <SearchResultItem
                            key={track._id}
                            track={track}
                            onAdd={handleAddTrack}
                            onRemove={handleRemoveTrack}
                            isAlreadyInPlaylist={isTrackInPlaylist(track._id)}
                            isAdding={addingTrackIds.has(track._id)}
                          />
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-white/60">No tracks found</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Current Tracks */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">
                  Playlist Tracks ({tracks.length})
                </h3>

                {tracks.length > 0 ? (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {tracks.map((track, index) => (
                      <motion.div
                        key={track._id}
                        className="flex items-center gap-3 p-3 bg-white/5 rounded-lg group hover:bg-white/10 transition-colors"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                      >
                        <div className="text-white/60 font-medium w-8 text-center">
                          {index + 1}
                        </div>
                        <img
                          src={track.coverUrl}
                          alt={track.name}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-white font-medium truncate">{track.name}</h4>
                          <p className="text-white/60 text-sm truncate">{track.artist.name}</p>
                        </div>
                        <div className="text-white/60 text-sm">
                          {Math.floor(track.duration / 60)}:
                          {(track.duration % 60).toString().padStart(2, "0")}
                        </div>
                        {(isCreating || isEditing) && (
                          <button
                            onClick={() => handleRemoveTrack(track._id)}
                            className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-500/20 rounded-lg transition-all duration-200"
                          >
                            <DeleteOutlined className="text-red-400" />
                          </button>
                        )}
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto rounded-full bg-white/10 flex items-center justify-center mb-4">
                      <SearchOutlined className="text-2xl text-white/60" />
                    </div>
                    <h4 className="text-white/80 font-medium mb-2">No tracks added yet</h4>
                    <p className="text-white/60 text-sm">
                      {isCreating || isEditing 
                        ? "Search and add tracks to build your playlist"
                        : "This playlist is empty"
                      }
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

// Main Component
const AdminPlatformPlaylists = () => {
  const navigate = useNavigate();
  const [playlists, setPlaylists] = useState<Playlist[]>(mockPlaylists);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Filter playlists based on search
  const filteredPlaylists = useMemo(() => {
    if (!searchQuery.trim()) return playlists;
    const query = searchQuery.toLowerCase();
    return playlists.filter(
      (playlist) =>
        playlist.name.toLowerCase().includes(query) ||
        playlist.description?.toLowerCase().includes(query) ||
        playlist.tags.some((tag) => tag.toLowerCase().includes(query))
    );
  }, [playlists, searchQuery]);

  const handleBackClick = useCallback(() => {
    navigate("/admin");
  }, [navigate]);

  const handleCreateNew = useCallback(() => {
    const newPlaylist: Playlist = {
      _id: `temp_${Date.now()}`,
      id: `temp_${Date.now()}`,
      name: "",
      description: "",
      coverUrl: "",
      owner: {
        _id: "admin",
        name: "Platform",
        username: "platform",
        avatar: "",
      },
      tracks: [],
      tags: [],
      category: "featured",
      privacy: "public",
      likeCount: 0,
      trackCount: 0,
      totalDuration: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setSelectedPlaylist(newPlaylist);
    setIsCreating(true);
    setIsEditing(true);
  }, []);

  const handlePlaylistSelect = useCallback((playlist: Playlist) => {
    setSelectedPlaylist(playlist);
    setIsCreating(false);
    setIsEditing(false);
  }, []);

  const handleEditPlaylist = useCallback((playlist: Playlist) => {
    setSelectedPlaylist(playlist);
    setIsCreating(false);
    setIsEditing(true);
  }, []);

  const handleCloseEditor = useCallback(() => {
    setSelectedPlaylist(null);
    setIsCreating(false);
    setIsEditing(false);
  }, []);

  const handleDeletePlaylist = useCallback(
    (playlist: Playlist) => {
      if (window.confirm(`Are you sure you want to delete "${playlist.name}"?`)) {
        setPlaylists((prev) => prev.filter((p) => p._id !== playlist._id));
        if (selectedPlaylist?._id === playlist._id) {
          setSelectedPlaylist(null);
          setIsEditing(false);
        }
      }
    },
    [selectedPlaylist]
  );

  if (selectedPlaylist) {
    return (
      <PlaylistEditor
        playlist={selectedPlaylist}
        isCreating={isCreating}
        isEditing={isEditing}
        onClose={handleCloseEditor}
        onSave={(updatedPlaylist) => {
          if (isCreating) {
            setPlaylists((prev) => [
              ...prev,
              { ...updatedPlaylist, _id: `new_${Date.now()}` },
            ]);
          } else {
            setPlaylists((prev) =>
              prev.map((p) =>
                p._id === updatedPlaylist._id ? updatedPlaylist : p
              )
            );
          }
          setSelectedPlaylist(null);
          setIsCreating(false);
          setIsEditing(false);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <motion.div
          className="flex items-center justify-between mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center gap-4">
            <button
              onClick={handleBackClick}
              className="p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all duration-200"
            >
              <ArrowLeftOutlined className="text-white text-xl" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-white">Platform Playlists</h1>
              <p className="text-white/70 mt-1">Manage featured and curated playlists</p>
            </div>
          </div>

          <button
            onClick={handleCreateNew}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <PlusOutlined />
            Create Playlist
          </button>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="relative max-w-md">
            <SearchOutlined className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/60 text-lg" />
            <input
              type="text"
              placeholder="Search playlists..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:border-white/40 focus:bg-white/15 transition-all duration-200"
            />
          </div>
        </motion.div>

        {/* Playlists Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <AnimatePresence>
            {filteredPlaylists.map((playlist, index) => (
              <motion.div
                key={playlist._id}
                className="group relative bg-white/10 backdrop-blur-md border border-white/20 rounded-xl overflow-hidden hover:bg-white/15 hover:border-white/30 transition-all duration-300 cursor-pointer"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                onClick={() => handlePlaylistSelect(playlist)}
              >
                {/* Cover Image */}
                <div className="relative aspect-square bg-gradient-to-br from-purple-500 to-pink-500 overflow-hidden">
                  {playlist.coverUrl ? (
                    <img
                      src={playlist.coverUrl}
                      alt={playlist.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                        <SearchOutlined className="text-2xl text-white/60" />
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditPlaylist(playlist);
                      }}
                      className="p-2 bg-black/60 backdrop-blur-sm rounded-lg hover:bg-black/80 transition-colors"
                    >
                      <EditOutlined className="text-white text-sm" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePlaylist(playlist);
                      }}
                      className="p-2 bg-red-500/60 backdrop-blur-sm rounded-lg hover:bg-red-500/80 transition-colors"
                    >
                      <DeleteOutlined className="text-white text-sm" />
                    </button>
                  </div>
                </div>

                {/* Playlist Info */}
                <div className="p-4">
                  <h3 className="text-white font-semibold text-lg mb-1 truncate">
                    {playlist.name || "Untitled Playlist"}
                  </h3>
                  <p className="text-white/60 text-sm mb-3 line-clamp-2">
                    {playlist.description || "No description"}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {playlist.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-white/10 text-white/80 text-xs rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                    {playlist.tags.length > 3 && (
                      <span className="px-2 py-1 bg-white/10 text-white/80 text-xs rounded-full">
                        +{playlist.tags.length - 3}
                      </span>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between text-sm text-white/60">
                    <span>{playlist.trackCount} tracks</span>
                    <span>{playlist.likeCount.toLocaleString()} likes</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Empty State */}
        {filteredPlaylists.length === 0 && (
          <motion.div
            className="text-center py-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <div className="w-20 h-20 mx-auto rounded-full bg-white/10 flex items-center justify-center mb-6">
              <SearchOutlined className="text-3xl text-white/60" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              {searchQuery ? "No playlists found" : "No playlists yet"}
            </h3>
            <p className="text-white/60 mb-6">
              {searchQuery
                ? `No playlists match "${searchQuery}"`
                : "Create your first platform playlist to get started"}
            </p>
            {!searchQuery && (
              <button
                onClick={handleCreateNew}
                className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl font-semibold transition-all duration-200"
              >
                Create First Playlist
              </button>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

// Utility debounce function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: number;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export default AdminPlatformPlaylists;