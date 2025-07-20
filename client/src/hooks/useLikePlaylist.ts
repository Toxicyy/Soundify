import { useState, useCallback } from "react";
import { api } from "../shared/api";
import { useGetUserQuery } from "../state/UserApi.slice";

interface UseLikePlaylistReturn {
  isLiked: boolean;
  isLoading: boolean;
  error: string | null;
  toggleLike: () => Promise<void>;
}

/**
 * Hook for liking/unliking playlists
 * Manages like state and provides toggle functionality
 */
export const useLikePlaylist = (
  playlistId: string,
  initialLikeState = false
): UseLikePlaylistReturn => {
  const { data: user } = useGetUserQuery();
  const [isLiked, setIsLiked] = useState(initialLikeState);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleLike = useCallback(async () => {
    if (!user?._id || !playlistId || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = isLiked
        ? await api.user.unlikePlaylist(user._id, playlistId)
        : await api.user.likePlaylist(user._id, playlistId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to update like status");
      }

      const data = await response.json();

      if (data.success) {
        setIsLiked(!isLiked);
      } else {
        throw new Error(data.message || "Failed to update like status");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      setError(errorMessage);
      console.error("Error toggling like status:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user?._id, playlistId, isLiked, isLoading]);

  return {
    isLiked,
    isLoading,
    error,
    toggleLike,
  };
};
