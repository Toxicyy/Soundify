// Pages/Admin/AdminPlatformPlaylists.tsx
import { useState, useCallback, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeftOutlined,
  PlusOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import type { Playlist } from "../../types/Playlist";
import { api } from "../../shared/api";
import { useNotification } from "../../hooks/useNotification";
import PlaylistEditor from "../../components/Admin/PlatfromPlaylist/PlaylistEditor";
import PlaylistCard from "../../components/Admin/PlatfromPlaylist/PlaylistCard";

const AdminPlatformPlaylists = () => {
  const navigate = useNavigate();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(
    null
  );
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const { showSuccess, showError } = useNotification();

  // Fetch playlists on component mount
  useEffect(() => {
    fetchPlaylists();
  }, []);

  const fetchPlaylists = async () => {
    try {
      setIsLoading(true);
      const response = await api.admin.playlist.getPlatform();

      if (!response.ok) {
        throw new Error("Failed to fetch playlists");
      }

      const data = await response.json();

      // Измените эту строку:
      setPlaylists(data.data || []); // Вместо data.data.playlists
    } catch (error: any) {
      console.error("Error fetching playlists:", error);
      showError("Failed to load platform playlists");
    } finally {
      setIsLoading(false);
    }
  };

  // Filter playlists based on search
  const filteredPlaylists = useMemo(() => {
    if (!searchQuery.trim()) return playlists;
    const query = searchQuery.toLowerCase();
    return playlists.filter(
      (playlist) =>
        playlist.name.toLowerCase().includes(query) ||
        playlist.description?.toLowerCase().includes(query) ||
        playlist.tags?.some((tag) => tag.toLowerCase().includes(query))
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
      isDraft: true,
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
    async (playlist: Playlist) => {
      if (
        !window.confirm(`Are you sure you want to delete "${playlist.name}"?`)
      ) {
        return;
      }

      setIsDeleting(playlist._id);

      try {
        const response = await api.admin.playlist.delete(playlist._id);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to delete playlist");
        }

        // Remove from local state
        setPlaylists((prev) => prev.filter((p) => p._id !== playlist._id));

        // Close editor if this playlist was being edited
        if (selectedPlaylist?._id === playlist._id) {
          setSelectedPlaylist(null);
          setIsEditing(false);
          setIsCreating(false);
        }

        showSuccess(
          `Platform playlist "${playlist.name}" deleted successfully`
        );
      } catch (error: any) {
        console.error("Error deleting playlist:", error);
        showError(error.message || "Failed to delete playlist");
      } finally {
        setIsDeleting(null);
      }
    },
    [selectedPlaylist, showSuccess, showError]
  );

  const handlePlaylistSave = useCallback(
    (updatedPlaylist: Playlist) => {
      if (isCreating) {
        setPlaylists((prev) => [updatedPlaylist, ...prev]);
      } else {
        setPlaylists((prev) =>
          prev.map((p) => (p._id === updatedPlaylist._id ? updatedPlaylist : p))
        );
      }

      handleCloseEditor();
    },
    [isCreating, handleCloseEditor]
  );

  const handlePublishPlaylist = useCallback(
    async (playlist: Playlist) => {
      if (!playlist.isDraft) {
        showError("Playlist is already published");
        return;
      }

      try {
        const response = await api.admin.playlist.publish(playlist._id);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to publish playlist");
        }

        // Update playlist in local state
        setPlaylists((prev) =>
          prev.map((p) =>
            p._id === playlist._id ? { ...p, isDraft: false } : p
          )
        );

        showSuccess(
          `Platform playlist "${playlist.name}" published successfully!`
        );
      } catch (error: any) {
        console.error("Error publishing playlist:", error);
        showError(error.message || "Failed to publish playlist");
      }
    },
    [showSuccess, showError]
  );

  // Show editor if playlist is selected
  if (selectedPlaylist) {
    return (
      <PlaylistEditor
        playlist={selectedPlaylist}
        isCreating={isCreating}
        isEditing={isEditing}
        onClose={handleCloseEditor}
        onSave={handlePlaylistSave}
      />
    );
  }

  return (
    (
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
                <h1 className="text-3xl font-bold text-white">
                  Platform Playlists
                </h1>
                <p className="text-white/70 mt-1">
                  Manage featured and curated playlists
                </p>
              </div>
            </div>

            <button
              onClick={handleCreateNew}
              disabled={isLoading}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
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

          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-white/60">Loading platform playlists...</p>
            </div>
          )}

          {/* Playlists Grid */}
          {!isLoading && (
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <AnimatePresence>
                {filteredPlaylists.map((playlist, index) => (
                  <PlaylistCard
                    key={playlist._id}
                    playlist={playlist}
                    index={index}
                    isDeleting={isDeleting === playlist._id}
                    onSelect={() => handlePlaylistSelect(playlist)}
                    onEdit={() => handleEditPlaylist(playlist)}
                    onDelete={() => handleDeletePlaylist(playlist)}
                    onPublish={() => handlePublishPlaylist(playlist)}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Empty State */}
          {!isLoading && filteredPlaylists.length === 0 && (
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
                {searchQuery
                  ? "No playlists found"
                  : "No platform playlists yet"}
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
    )
  );
};

export default AdminPlatformPlaylists;
