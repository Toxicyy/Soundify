import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../shared/api";
import { useNotification } from "./useNotification";

interface PlaylistLimitError {
  errorCode: string;
  currentCount: number;
  limit: number;
  userStatus: string;
}

/**
 * Hook for quick playlist creation
 * Handles limit errors and navigation
 */
export const useQuickPlaylist = () => {
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);

  const {
    showPlaylistLimitError,
    showSuccess,
    showError,
    showLoading,
    dismiss,
  } = useNotification();

  const createQuickPlaylist = async () => {
    setCreating(true);

    const loadingToast = showLoading("Creating playlist...");

    try {
      const response = await api.playlist.createQuick();

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        if (
          response.status === 403 &&
          errorData.data?.errorCode === "PLAYLIST_LIMIT_EXCEEDED"
        ) {
          const limitData = errorData.data as PlaylistLimitError;

          dismiss(loadingToast);
          showPlaylistLimitError(limitData.currentCount, limitData.limit);
          return;
        }

        if (response.status === 401) {
          throw new Error("Login required to create playlists");
        }

        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      const data = await response.json();

      if (data.success && data.data?.id) {
        const playlistId = data.data.id;
        const playlistName = data.data.name || "New Playlist";

        dismiss(loadingToast);
        showSuccess(`Playlist "${playlistName}" created!`);

        setTimeout(() => {
          navigate(`/playlist/${playlistId}`);
        }, 0);

        return data.data;
      } else {
        throw new Error(data.message || "Failed to create playlist");
      }
    } catch (error) {
      dismiss(loadingToast);

      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      showError(errorMessage);
      throw error;
    } finally {
      setCreating(false);
    }
  };

  return {
    createQuickPlaylist,
    creating,
  };
};
