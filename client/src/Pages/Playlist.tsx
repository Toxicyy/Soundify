import { useParams } from "react-router-dom";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PlaylistHeader from "../components/Playlist/PlaylistHeader";
import { usePlaylist } from "../hooks/usePlaylist";
import { usePlaylistTracks } from "../hooks/usePlaylistTracks";
import { usePlaylistSave } from "../hooks/usePlaylistSave";
import { useNotification } from "../hooks/useNotification";
import MainMenu from "../components/Playlist/MainMenu";
import type { Track } from "../types/TrackData";
import { api } from "../shared/api";

/**
 * Main playlist page component with enhanced security and batch saving
 *
 * Features:
 * - Role-based access control (admin + owner only)
 * - Batch saving for all changes
 * - Comprehensive error handling
 * - Responsive design
 * - Real-time notifications
 */
export default function Playlist() {
  const { id } = useParams<{ id: string }>();
  const notification = useNotification();

  // Refs to prevent cyclic updates and manage sync state
  const isSyncingRef = useRef(false);
  const lastSyncDataRef = useRef<string>("");

  // State for cover file selected in header
  const [selectedCoverFile, setSelectedCoverFile] = useState<File | null>(null);

  // Main playlist management hook
  const {
    playlist,
    hasUnsavedChanges,
    loading: playlistLoading,
    error: playlistError,
    updateLocal,
    fetchPlaylist,
    switchUnsavedChangesToFalse,
  } = usePlaylist(id);

  // Playlist tracks management hook
  const {
    tracks,
    isLoading: tracksLoading,
    error: tracksError,
    refetch: refetchTracks,
  } = usePlaylistTracks(id || "", {
    page: 1,
    limit: 100,
    sortBy: "playlistOrder",
    sortOrder: 1,
  });

  // Playlist save operations hook
  const { saveChanges, saving } = usePlaylistSave(id || "");

  // Memoized loading and error states
  const isLoading = useMemo(
    () => playlistLoading || tracksLoading,
    [playlistLoading, tracksLoading]
  );

  const error = useMemo(
    () => playlistError || tracksError,
    [playlistError, tracksError]
  );

  /**
   * Check if current user has edit permissions for this playlist
   * Only owner or admin can edit
   */
  const canEditPlaylist = useMemo(() => {
    if (!playlist) return false;

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
  }, [playlist]);

  /**
   * Get current tracks as Track[] array
   * Priority: local changes > API tracks
   */
  const getTracksAsArray = useCallback((): Track[] => {
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
  }, [playlist?.tracks, tracks, hasUnsavedChanges]);

  /**
   * Memoized current tracks
   */
  const currentTracks = useMemo(() => getTracksAsArray(), [getTracksAsArray]);

  /**
   * Optimized synchronization without cyclic updates
   */
  const syncTracksWithPlaylist = useCallback(() => {
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
  }, [tracks, playlist, hasUnsavedChanges, updateLocal]);

  /**
   * Sync effect with cycle protection
   */
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      syncTracksWithPlaylist();
    }, 50);

    return () => clearTimeout(timeoutId);
  }, [tracks.length, playlist?.trackCount, hasUnsavedChanges]);

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

        if(!id) return
        const response = await api.playlist.updateTrackOrder(id, trackIds, true);

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

  // Memoized components for performance optimization
  const headerComponent = useMemo(
    () => (
      <PlaylistHeader
        playlist={playlist}
        isLoading={isLoading}
        updateLocal={updateLocal}
        canEdit={canEditPlaylist}
        fetchPlaylist={fetchPlaylist}
        onCoverFileSelect={setSelectedCoverFile}
      />
    ),
    [playlist, isLoading, updateLocal, canEditPlaylist, fetchPlaylist]
  );

  const mainMenuComponent = useMemo(
    () => (
      <MainMenu
        playlist={playlist}
        isLoading={isLoading || saving}
        updateLocal={updateLocal}
        hasUnsavedChanges={hasUnsavedChanges}
        tracks={currentTracks}
        tracksError={tracksError}
        isEditable={canEditPlaylist}
      />
    ),
    [
      playlist,
      isLoading,
      saving,
      updateLocal,
      hasUnsavedChanges,
      currentTracks,
      tracksError,
      canEditPlaylist,
    ]
  );

  // Error state rendering
  if (error) {
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

      {/* Enhanced save/discard controls with better UX */}
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
