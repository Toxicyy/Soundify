import { useParams } from "react-router-dom";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  LoginOutlined,
  UserOutlined,
  PlayCircleOutlined,
  SoundOutlined,
  HeartOutlined,
  FolderOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import PlaylistHeader from "../components/Playlist/PlaylistHeader";
import { usePlaylist } from "../hooks/usePlaylist";
import { usePlaylistTracks } from "../hooks/usePlaylistTracks";
import { usePlaylistSave } from "../hooks/usePlaylistSave";
import { useNotification } from "../hooks/useNotification";
import { useGetUserQuery } from "../state/UserApi.slice";
import MainMenu from "../components/Playlist/MainMenu";
import type { Track } from "../types/TrackData";
import { api } from "../shared/api";

/**
 * Authentication required state component
 */
const AuthRequiredState: React.FC = () => {
  const navigate = useNavigate();

  return (
    <motion.div
      className="flex flex-col items-center justify-center py-16 xs:py-12 px-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Animated music icons background */}
      <div className="absolute inset-0 overflow-hidden opacity-5">
        <motion.div
          className="absolute top-10 left-10"
          animate={{
            y: [0, -20, 0],
            rotate: [0, 10, 0],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <SoundOutlined className="text-6xl text-white" />
        </motion.div>
        <motion.div
          className="absolute top-20 right-20"
          animate={{
            y: [0, 20, 0],
            rotate: [0, -15, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
        >
          <PlayCircleOutlined className="text-8xl text-white" />
        </motion.div>
        <motion.div
          className="absolute bottom-20 left-20"
          animate={{
            y: [0, -15, 0],
            rotate: [0, 20, 0],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2,
          }}
        >
          <HeartOutlined className="text-5xl text-white" />
        </motion.div>
        <motion.div
          className="absolute bottom-16 right-16"
          animate={{
            y: [0, 25, 0],
            rotate: [0, -10, 0],
          }}
          transition={{
            duration: 3.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.5,
          }}
        >
          <FolderOutlined className="text-7xl text-white" />
        </motion.div>
      </div>

      {/* Main content */}
      <motion.div
        className="relative z-10 text-center max-w-md"
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{
          duration: 0.8,
          type: "spring",
          bounce: 0.4,
          delay: 0.2,
        }}
      >
        {/* Playlist icon with glow effect */}
        <motion.div
          className="relative mb-6 xs:mb-4"
          initial={{ rotate: -180, scale: 0 }}
          animate={{ rotate: 0, scale: 1 }}
          transition={{
            duration: 1.2,
            type: "spring",
            bounce: 0.6,
            delay: 0.3,
          }}
        >
          <div className="relative inline-block">
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-purple-400/30 to-pink-500/30 rounded-full blur-xl scale-150"
              animate={{
                opacity: [0.3, 0.7, 0.3],
                scale: [1.4, 1.6, 1.4],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            <div className="relative p-6 xs:p-4 bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-lg rounded-2xl border border-purple-500/30">
              <FolderOutlined className="text-purple-400 text-6xl xs:text-5xl" />
            </div>
          </div>
        </motion.div>

        {/* Title */}
        <motion.h2
          className="text-2xl xs:text-xl font-bold text-white mb-3 xs:mb-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          Access This Playlist
        </motion.h2>

        {/* Description */}
        <motion.p
          className="text-white/70 text-base xs:text-sm leading-relaxed mb-8 xs:mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
        >
          Sign in to view this playlist, like tracks, create your own
          collections, and enjoy full music experience
        </motion.p>

        {/* Features list */}
        <motion.div
          className="mb-8 xs:mb-6 space-y-3 xs:space-y-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.9 }}
        >
          <div className="flex items-center gap-3 text-white/80 text-sm xs:text-xs">
            <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex-shrink-0" />
            <span>View and play full playlists</span>
          </div>
          <div className="flex items-center gap-3 text-white/80 text-sm xs:text-xs">
            <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex-shrink-0" />
            <span>Like and save your favorite tracks</span>
          </div>
          <div className="flex items-center gap-3 text-white/80 text-sm xs:text-xs">
            <div className="w-2 h-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex-shrink-0" />
            <span>Create and edit your own playlists</span>
          </div>
          <div className="flex items-center gap-3 text-white/80 text-sm xs:text-xs">
            <div className="w-2 h-2 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex-shrink-0" />
            <span>Access full music streaming features</span>
          </div>
        </motion.div>

        {/* Action buttons */}
        <motion.div
          className="flex flex-col xs:flex-row gap-3 xs:gap-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.1 }}
        >
          <motion.button
            onClick={() => navigate("/login")}
            className="flex items-center justify-center gap-2 px-6 xs:px-4 py-3 xs:py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-xl xs:rounded-lg transition-all duration-300 shadow-lg hover:shadow-purple-500/25 text-sm xs:text-xs"
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
          >
            <LoginOutlined className="text-base xs:text-sm" />
            Sign In
          </motion.button>

          <motion.button
            onClick={() => navigate("/signup")}
            className="flex items-center justify-center gap-2 px-6 xs:px-4 py-3 xs:py-2 bg-white/10 hover:bg-white/15 text-white font-medium rounded-xl xs:rounded-lg transition-all duration-300 border border-white/20 hover:border-white/30 text-sm xs:text-xs"
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
          >
            <UserOutlined className="text-base xs:text-sm" />
            Create Account
          </motion.button>
        </motion.div>

        {/* Additional info */}
        <motion.p
          className="text-white/50 text-xs xs:text-[10px] mt-6 xs:mt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.3 }}
        >
          Free forever • No credit card required
        </motion.p>
      </motion.div>

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 6 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white/20 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -100, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 4 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
    </motion.div>
  );
};

/**
 * Main playlist page component with enhanced security and batch saving
 *
 * Features:
 * - Beautiful authentication required state for non-users
 * - Role-based access control (admin + owner only)
 * - Batch saving for all changes
 * - Comprehensive error handling
 * - Responsive design with adjusted spacing for small screens
 * - Real-time notifications
 */
export default function Playlist() {
  const { id } = useParams<{ id: string }>();
  const notification = useNotification();
  const navigate = useNavigate();
  const { data: user, isLoading: userLoading } = useGetUserQuery();

  // Refs to prevent cyclic updates and manage sync state
  const isSyncingRef = useRef(false);
  const lastSyncDataRef = useRef<string>("");

  // State for cover file selected in header
  const [selectedCoverFile, setSelectedCoverFile] = useState<File | null>(null);

  // Main playlist management hook - only for authenticated users
  const {
    playlist,
    hasUnsavedChanges,
    loading: playlistLoading,
    error: playlistError,
    updateLocal,
    fetchPlaylist,
    switchUnsavedChangesToFalse,
  } = usePlaylist(user ? id : undefined);

  // Playlist tracks management hook - only for authenticated users
  const {
    tracks,
    isLoading: tracksLoading,
    error: tracksError,
    refetch: refetchTracks,
  } = usePlaylistTracks(user && id ? id : "", {
    page: 1,
    limit: 100,
    sortBy: "playlistOrder",
    sortOrder: 1,
  });

  // Playlist save operations hook - only for authenticated users
  const { saveChanges, saving } = usePlaylistSave(user && id ? id : "");

  // Memoized loading and error states - only for authenticated users
  const isLoading = useMemo(
    () => (user ? playlistLoading || tracksLoading : false),
    [user, playlistLoading, tracksLoading]
  );

  const error = useMemo(
    () => (user ? playlistError || tracksError : null),
    [user, playlistError, tracksError]
  );

  /**
   * Check if current user has edit permissions for this playlist
   * Only owner or admin can edit
   */
  const canEditPlaylist = useMemo(() => {
    if (!playlist || !user) return false;

    // Get current user from localStorage or context
    const token = localStorage.getItem("token");
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const currentUserId = payload.id || payload.userId;
      const userStatus = payload.status;

      // Admin can edit any playlist
      if (userStatus === "ADMIN") return true;

      // Owner can edit their own playlist
      const ownerId =
        typeof playlist.owner === "string"
          ? playlist.owner
          : playlist.owner?._id;

      return currentUserId === ownerId;
    } catch (error) {
      console.error("Error checking playlist permissions:", error);
      return false;
    }
  }, [playlist, user]);

  /**
   * Get current tracks as Track[] array
   * Priority: local changes > API tracks
   * Only for authenticated users
   */
  const getTracksAsArray = useCallback((): Track[] => {
    if (!user) return [];

    // If there are local changes in playlist with tracks
    if (playlist?.tracks && hasUnsavedChanges) {
      if (Array.isArray(playlist.tracks) && playlist.tracks.length > 0) {
        const firstItem = playlist.tracks[0];
        if (
          typeof firstItem === "object" &&
          firstItem !== null &&
          "_id" in firstItem
        ) {
          return playlist.tracks as Track[];
        }
      }
    }

    // Use tracks from API
    return tracks;
  }, [playlist?.tracks, tracks, hasUnsavedChanges, user]);

  /**
   * Memoized current tracks
   */
  const currentTracks = useMemo(() => getTracksAsArray(), [getTracksAsArray]);

  /**
   * Optimized synchronization without cyclic updates
   * Only for authenticated users
   */
  const syncTracksWithPlaylist = useCallback(() => {
    // Only sync for authenticated users
    if (!user) return;
    // Prevent cyclic calls
    if (isSyncingRef.current) return;

    // Check data availability
    if (!tracks.length || !playlist || hasUnsavedChanges) return;

    // Create hash of current state for comparison
    const currentDataHash = JSON.stringify({
      tracksLength: tracks.length,
      playlistTracksLength: playlist.tracks?.length || 0,
      playlistTrackCount: playlist.trackCount || 0,
    });

    // Skip sync if data hasn't changed
    if (lastSyncDataRef.current === currentDataHash) return;

    // Check if sync is needed
    const needsSync =
      !playlist.tracks ||
      playlist.tracks.length !== tracks.length ||
      playlist.trackCount !== tracks.length;

    if (!needsSync) return;

    console.log("🔄 Syncing tracks with playlist state");

    isSyncingRef.current = true;
    lastSyncDataRef.current = currentDataHash;

    // Update local state
    updateLocal({
      tracks: tracks,
      trackCount: tracks.length,
      totalDuration: tracks.reduce(
        (total, track) => total + (track.duration || 0),
        0
      ),
    });

    // Reset sync flag
    setTimeout(() => {
      isSyncingRef.current = false;
    }, 100);
  }, [tracks, playlist, hasUnsavedChanges, updateLocal, user]);

  /**
   * Sync effect with cycle protection
   * Only for authenticated users
   */
  useEffect(() => {
    if (!user) return;

    const timeoutId = setTimeout(() => {
      syncTracksWithPlaylist();
    }, 50);

    return () => clearTimeout(timeoutId);
  }, [
    tracks.length,
    playlist?.trackCount,
    hasUnsavedChanges,
    user,
    syncTracksWithPlaylist,
  ]);

  /**
   * Comprehensive batch save handler
   * Saves all changes at once with proper error handling
   */
  const handleSavePlaylist = useCallback(async () => {
    if (!playlist || !hasUnsavedChanges) {
      notification.showWarning("No changes to save");
      return;
    }

    if (!canEditPlaylist) {
      notification.showError("You don't have permission to edit this playlist");
      return;
    }

    try {
      console.log("💾 Starting batch playlist save process");

      // Show loading notification
      const loadingToast = notification.showLoading(
        "Saving playlist changes..."
      );

      // Get current tracks for saving
      const tracksToSave = getTracksAsArray();

      // Prepare update data (only basic fields)
      const updateData = {
        name: playlist.name,
        description: playlist.description,
        privacy: playlist.privacy,
        category: playlist.category,
        tags: playlist.tags,
        cover: selectedCoverFile, // Include cover file if selected
      };

      console.log("💾 Saving playlist data:", {
        hasName: !!updateData.name,
        hasDescription: !!updateData.description,
        hasPrivacy: !!updateData.privacy,
        hasCover: !!selectedCoverFile,
        coverFileName: selectedCoverFile?.name,
      });

      // Save basic playlist data with cover
      await saveChanges(updateData);

      // Save track order if tracks exist
      if (tracksToSave && tracksToSave.length > 0) {
        const trackIds = tracksToSave.map((track) => track._id);
        console.log("💾 Saving track order:", trackIds.length, "tracks");

        if (!id) return;
        const response = await api.playlist.updateTrackOrder(
          id,
          trackIds,
          true
        );

        if (!response.ok) {
          throw new Error(`Failed to save track order: ${response.status}`);
        }

        console.log("✅ Track order saved successfully");
      }

      // Reset unsaved changes flag and cover file
      switchUnsavedChangesToFalse();
      setSelectedCoverFile(null);

      // Refresh data from API
      await Promise.all([fetchPlaylist(id!), refetchTracks()]);

      // Dismiss loading and show success
      notification.dismiss(loadingToast);
      notification.showSuccess("Playlist saved successfully!");

      console.log("✅ Playlist batch save completed successfully");
    } catch (error) {
      console.error("❌ Error saving playlist:", error);

      const errorMessage =
        error instanceof Error ? error.message : "Failed to save playlist";

      notification.showError(`Save failed: ${errorMessage}`);
    }
  }, [
    playlist,
    hasUnsavedChanges,
    canEditPlaylist,
    saveChanges,
    getTracksAsArray,
    selectedCoverFile,
    id,
    switchUnsavedChangesToFalse,
    fetchPlaylist,
    refetchTracks,
    notification,
  ]);

  /**
   * Memoized data refresh handler
   */
  const handleRefetch = useCallback(() => {
    if (!id) return;

    console.log("🔄 Refetching playlist data");
    const loadingToast = notification.showLoading(
      "Refreshing playlist data..."
    );

    Promise.all([fetchPlaylist(id), refetchTracks()])
      .then(() => {
        // Reset sync state
        isSyncingRef.current = false;
        lastSyncDataRef.current = "";

        notification.dismiss(loadingToast);
        notification.showSuccess("Playlist data refreshed");
        console.log("✅ Playlist data refreshed");
      })
      .catch((error) => {
        notification.dismiss(loadingToast);
        notification.showError("Failed to refresh playlist data");
        console.error("❌ Failed to refresh playlist data:", error);
      });
  }, [id, fetchPlaylist, refetchTracks, notification]);

  /**
   * Handle discard changes with confirmation
   */
  const handleDiscardChanges = useCallback(() => {
    if (!hasUnsavedChanges && !selectedCoverFile) return;

    const confirmDiscard = window.confirm(
      "Are you sure you want to discard all changes? This action cannot be undone."
    );

    if (confirmDiscard) {
      setSelectedCoverFile(null); // Reset selected cover file
      handleRefetch();
      notification.showInfo("All changes have been discarded");
      console.log("📝 Changes discarded - all unsaved changes reverted");
    }
  }, [hasUnsavedChanges, selectedCoverFile, handleRefetch, notification]);

  // Show loading state while checking user auth
  if (userLoading) {
    return (
      <motion.div
        className="h-screen w-full mainMenu mb-35 xl:mb-5 pl-4 xl:pl-[22vw] pr-[2vw] flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 xs:w-12 xs:h-12 border-3 border-white/20 border-t-white rounded-full animate-spin" />
          <p className="text-white/70 text-sm xs:text-base">Loading...</p>
        </div>
      </motion.div>
    );
  }

  // Show auth required state if user is not logged in - FIRST PRIORITY
  if (!user) {
    return (
      <motion.div
        className="h-screen w-full mainMenu mb-35 xl:mb-5 pl-4 xl:pl-[22vw] pr-[2vw] flex flex-col gap-4 xs:gap-6 py-4 xs:py-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        {/* Page Header */}
        <motion.header
          className="flex items-center gap-3 xs:gap-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <motion.button
            onClick={() => navigate(-1)}
            className="p-2 xs:p-3 bg-white/10 hover:bg-white/20 backdrop-blur-lg rounded-lg xs:rounded-xl transition-all duration-200 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-white/20 flex-shrink-0"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Go back"
          >
            <ArrowLeftOutlined className="text-white text-base xs:text-xl" />
          </motion.button>

          <div className="flex items-center gap-2 xs:gap-3">
            <motion.div
              className="p-2 xs:p-3 bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-lg rounded-lg xs:rounded-xl border border-purple-500/30"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                duration: 0.8,
                delay: 0.3,
                type: "spring",
                bounce: 0.6,
              }}
            >
              <FolderOutlined className="text-purple-400 text-lg xs:text-2xl" />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <h1 className="text-white text-2xl xs:text-3xl font-bold">
                Playlist
              </h1>
              <p className="text-white/70 text-sm xs:text-lg">
                Music collection
              </p>
            </motion.div>
          </div>
        </motion.header>

        {/* Auth Required Content */}
        <motion.section
          className="bg-white/5 md:bg-white/5 md:backdrop-blur-lg border border-white/10 rounded-xl xs:rounded-2xl overflow-hidden flex-1 flex items-center justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <AuthRequiredState />
        </motion.section>
      </motion.div>
    );
  }

  // Memoized components for performance optimization - only for authenticated users
  const headerComponent = useMemo(
    () =>
      user ? (
        <PlaylistHeader
          playlist={playlist}
          isLoading={isLoading}
          updateLocal={updateLocal}
          canEdit={canEditPlaylist}
          fetchPlaylist={fetchPlaylist}
          onCoverFileSelect={setSelectedCoverFile}
        />
      ) : null,
    [playlist, isLoading, updateLocal, canEditPlaylist, fetchPlaylist, user]
  );

  const mainMenuComponent = useMemo(
    () =>
      user ? (
        <MainMenu
          playlist={playlist}
          isLoading={isLoading || saving}
          updateLocal={updateLocal}
          hasUnsavedChanges={hasUnsavedChanges}
          tracks={currentTracks}
          tracksError={tracksError}
          isEditable={canEditPlaylist}
        />
      ) : null,
    [
      playlist,
      isLoading,
      saving,
      updateLocal,
      hasUnsavedChanges,
      currentTracks,
      tracksError,
      canEditPlaylist,
      user,
    ]
  );

  // Error state rendering - ONLY for authenticated users with backend errors
  if (error && user) {
    return (
      <div className="h-screen w-full mainMenu mb-35 xl:mb-5 pl-4 xl:pl-[22vw] pr-[2vw] flex items-center justify-center">
        <div className="text-center bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 max-w-md w-full">
          <div className="w-16 h-16 mx-auto rounded-full bg-red-500/20 flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Something went wrong
          </h2>
          <p className="text-white/70 mb-6 text-sm">Access denied</p>
          <button
            onClick={handleRefetch}
            className="px-6 py-3 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors duration-200 font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full mainMenu mb-35 xl:mb-5 pl-4 xl:pl-[22vw] pr-[2vw] flex flex-col gap-5">
      {headerComponent}
      {mainMenuComponent}

      {/* Enhanced save/discard controls with better UX and adjusted spacing for small screens */}
      {(hasUnsavedChanges || selectedCoverFile) && canEditPlaylist && (
        <div className="fixed bottom-8 right-8 z-50">
          <div className="flex items-center gap-3 p-4 bg-black/80 backdrop-blur-lg border border-white/20 rounded-2xl shadow-2xl">
            <div className="flex items-center gap-2 text-white/80 text-sm">
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
              <span>
                Unsaved changes
                {selectedCoverFile && " (including cover)"}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleDiscardChanges}
                className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 rounded-lg transition-all duration-200 text-sm font-medium hover:scale-105"
                aria-label="Discard all changes"
              >
                Discard
              </button>

              <button
                onClick={handleSavePlaylist}
                disabled={saving}
                className="px-6 py-3 bg-green-500 hover:bg-green-600 disabled:bg-green-500/50 text-white rounded-lg transition-all duration-200 font-medium shadow-lg hover:shadow-xl disabled:cursor-not-allowed flex items-center gap-2 hover:scale-105 disabled:hover:scale-100"
                aria-label="Save all changes"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Saving...
                  </>
                ) : (
                  <>
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Permission denied message for non-editors */}
      {!canEditPlaylist && playlist && (
        <div className="fixed bottom-8 right-8 z-40">
          <div className="flex items-center gap-2 p-3 bg-blue-500/20 backdrop-blur-lg border border-blue-500/30 rounded-lg text-blue-400 text-sm">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>View-only mode</span>
          </div>
        </div>
      )}
    </div>
  );
}
