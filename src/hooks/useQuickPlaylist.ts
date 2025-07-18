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

    // Show loading notification
    const loadingToast = showLoading("Создаем плейлист...");

    try {
      const response = await api.playlist.createQuick();

      // Handle different response statuses
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        // Handle playlist limit exceeded (403 status)
        if (
          response.status === 403 &&
          errorData.data?.errorCode === "PLAYLIST_LIMIT_EXCEEDED"
        ) {
          const limitData = errorData.data as PlaylistLimitError;

          // Dismiss loading toast
          dismiss(loadingToast);

          // Show custom limit error notification
          showPlaylistLimitError(limitData.currentCount, limitData.limit);
          return;
        }

        // Handle authentication errors
        if (response.status === 401) {
          throw new Error("Необходимо войти в аккаунт для создания плейлистов");
        }

        // Handle other errors
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      const data = await response.json();

      if (data.success && data.data?.id) {
        const playlistId = data.data.id;
        const playlistName = data.data.name || "Новый плейлист";

        // Dismiss loading and show success
        dismiss(loadingToast);
        showSuccess(`Плейлист "${playlistName}" создан!`);

        // Navigate to the new playlist
        setTimeout(() => {
          navigate(`/playlist/${playlistId}`);
        }, 0);

        return data.data;
      } else {
        throw new Error(data.message || "Failed to create playlist");
      }
    } catch (error) {
      console.error("Failed to create playlist:", error);

      // Dismiss loading toast
      dismiss(loadingToast);

      const errorMessage =
        error instanceof Error ? error.message : "Неизвестная ошибка";

      // Show appropriate error message
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
