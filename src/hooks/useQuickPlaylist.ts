import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../shared/api";
import { useGetUserQuery } from "../state/UserApi.slice";
import { useNotification } from "./useNotification";

export const useQuickPlaylist = () => {
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);

  // Get user data for limits check
  const { data: user } = useGetUserQuery();
  const {
    showPlaylistLimitError,
    showSuccess,
    showError,
    showLoading,
    dismiss,
  } = useNotification();

  /**
   * Check if user can create more playlists based on their status
   */
  const checkPlaylistLimit = (): boolean => {
    if (!user) {
      showError("Необходимо авторизоваться для создания плейлистов");
      return false;
    }

    // Define limits based on user status
    const limits = {
      USER: 5,
      PREMIUM: 15,
      ADMIN: 15,
    };

    const userStatus = user.status as keyof typeof limits;
    const limit = limits[userStatus] || limits.USER; // Default to USER limit if status is unknown
    const currentCount = user.playlists?.length || 0;
    console.log(currentCount, limit);
    // Check if limit is exceeded
    if (currentCount >= limit) {
      showPlaylistLimitError(currentCount, limit);
      return false;
    }

    return true;
  };

  const createQuickPlaylist = async () => {
    // Check limits before proceeding
    if (!checkPlaylistLimit()) {
      return;
    }

    setCreating(true);

    // Show loading notification
    const loadingToast = showLoading("Создаем плейлист...");

    try {
      const response = await api.playlist.createQuick();

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
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

      // Dismiss loading and show error
      dismiss(loadingToast);

      const errorMessage =
        error instanceof Error ? error.message : "Неизвестная ошибка";

      // Handle specific error cases
      if (
        errorMessage.includes("Authentication") ||
        errorMessage.includes("401")
      ) {
        showError("Необходимо войти в аккаунт для создания плейлистов");
      } else if (errorMessage.includes("403")) {
        showError("Недостаточно прав для создания плейлистов");
      } else if (
        errorMessage.includes("limit") ||
        errorMessage.includes("лимит")
      ) {
        // This case is already handled by checkPlaylistLimit, but just in case backend also checks
        const user = useGetUserQuery().data;
        const limit = user?.status === "USER" ? 5 : 15;
        const current = user?.playlists?.length || 0;
        showPlaylistLimitError(current, limit);
      } else {
        showError(`Ошибка создания плейлиста: ${errorMessage}`);
      }

      throw error;
    } finally {
      setCreating(false);
    }
  };

  return {
    createQuickPlaylist,
    creating,
    checkPlaylistLimit, // Export for potential use in other components
  };
};
