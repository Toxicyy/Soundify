import { useCallback, type FC, memo } from "react";
import type { Playlist } from "../../types/Playlist";
import type { Track } from "../../types/TrackData";
import DraggableTracksList from "./components/DraggableTracksList";
import TrackSearchLocal from "./components/TrackSearchLocal";
import { useNotification } from "../../hooks/useNotification";

interface MainMenuProps {
  playlist: Playlist | null;
  isLoading?: boolean;
  updateLocal: (updates: Partial<Playlist>) => void;
  hasUnsavedChanges: boolean;
  tracks?: Track[];
  tracksError?: string | null;
  isEditable?: boolean;
}

/**
 * Main content area for playlist page
 * Features drag-and-drop tracks, search, and role-based permissions
 */
const MainMenu: FC<MainMenuProps> = ({
  playlist,
  isLoading = false,
  updateLocal,
  hasUnsavedChanges,
  tracks = [],
  tracksError = null,
  isEditable = false,
}) => {
  const notification = useNotification();

  const handleAddTrackLocal = useCallback(
    (track: Track) => {
      if (!playlist) {
        notification.showError("No playlist available");
        return;
      }

      if (!isEditable) {
        notification.showError(
          "You don't have permission to edit this playlist"
        );
        return;
      }

      const isAlreadyInPlaylist = tracks.some(
        (existingTrack) => existingTrack._id === track._id
      );

      if (isAlreadyInPlaylist) {
        notification.showWarning(`"${track.name}" is already in the playlist`);
        return;
      }

      try {
        const newTracks = [...tracks, track];

        updateLocal({
          tracks: newTracks as Track[] | string[],
          trackCount: newTracks.length,
          totalDuration: newTracks.reduce(
            (total, t) => total + (t.duration || 0),
            0
          ),
        });

        notification.showSuccess(`"${track.name}" added to playlist`);
      } catch (error) {
        notification.showError("Failed to add track to playlist");
      }
    },
    [playlist, tracks, updateLocal, isEditable, notification]
  );

  const handleRemoveTrackLocal = useCallback(
    (trackId: string) => {
      if (!playlist) {
        notification.showError("No playlist available");
        return;
      }

      if (!isEditable) {
        notification.showError(
          "You don't have permission to edit this playlist"
        );
        return;
      }

      try {
        const trackToRemove = tracks.find((track) => track._id === trackId);
        const newTracks = tracks.filter((track) => track._id !== trackId);

        updateLocal({
          tracks: newTracks as Track[] | string[],
          trackCount: newTracks.length,
          totalDuration: newTracks.reduce(
            (total, t) => total + (t.duration || 0),
            0
          ),
        });

        const trackName = trackToRemove?.name || "Track";
        notification.showSuccess(`"${trackName}" removed from playlist`);
      } catch (error) {
        notification.showError("Failed to remove track from playlist");
      }
    },
    [playlist, tracks, updateLocal, isEditable, notification]
  );

  const handleTrackReorder = useCallback(
    (newTracks: Track[]) => {
      if (!playlist) {
        notification.showError("No playlist available");
        return;
      }

      if (!isEditable) {
        notification.showError(
          "You don't have permission to edit this playlist"
        );
        return;
      }

      try {
        updateLocal({
          tracks: newTracks as Track[] | string[],
          trackCount: newTracks.length,
          totalDuration: newTracks.reduce(
            (total, t) => total + (t.duration || 0),
            0
          ),
        });

        notification.showInfo("Track order updated");
      } catch (error) {
        notification.showError("Failed to reorder tracks");
      }
    },
    [playlist, updateLocal, isEditable, notification]
  );

  const renderUnsavedChangesIndicator = () => {
    if (!hasUnsavedChanges || !isEditable) return null;

    return (
      <div className="px-6 py-3 mb-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
            <span className="text-yellow-400 font-medium text-sm">
              Unsaved Changes
            </span>
          </div>
          <div className="text-white/60 text-sm">
            {tracks.length} tracks • Don't forget to save your changes
          </div>
        </div>
      </div>
    );
  };

  const renderEditNotice = () => {
    if (isEditable || !playlist) return null;

    return (
      <div className="px-6 py-3 mb-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-400/20 rounded-full flex items-center justify-center">
            <svg
              className="w-2.5 h-2.5 text-blue-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <span className="text-blue-400 font-medium text-sm">
            View Only Mode
          </span>
          <span className="text-blue-400/60 text-xs">
            You can listen but cannot edit this playlist
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full bg-white/10 rounded-3xl border border-white/20 overflow-hidden backdrop-blur-sm">
      {renderUnsavedChangesIndicator()}
      {renderEditNotice()}

      <DraggableTracksList
        tracks={tracks}
        isLoading={isLoading}
        tracksError={tracksError}
        isEditable={isEditable}
        updateLocal={updateLocal}
        playlist={playlist}
        onRemoveTrack={handleRemoveTrackLocal}
        onReorderTracks={handleTrackReorder}
      />

      {isEditable && (
        <div className="border-t border-white/10 pt-4 pb-6">
          <TrackSearchLocal
            onAddTrackLocal={handleAddTrackLocal}
            existingTracks={tracks}
            isPlaylistLoading={isLoading}
          />
        </div>
      )}

      {playlist && (
        <div className="px-6 py-4 border-t border-white/10 bg-white/5">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4 text-white/60">
              <span>{tracks.length} tracks</span>
              {playlist.totalDuration && (
                <span>{Math.floor(playlist.totalDuration / 60)} minutes</span>
              )}
              {playlist.privacy && (
                <span className="capitalize">{playlist.privacy}</span>
              )}
              {playlist.likeCount !== undefined && (
                <span>{playlist.likeCount} likes</span>
              )}
            </div>

            <div className="flex items-center gap-3">
              {!isEditable && (
                <div className="flex items-center gap-1 text-blue-400">
                  <svg
                    className="w-3 h-3"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-xs">View Only</span>
                </div>
              )}

              {hasUnsavedChanges && isEditable && (
                <div className="flex items-center gap-2 text-yellow-400">
                  <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse"></div>
                  <span className="text-xs">Changes pending</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default memo(MainMenu);
