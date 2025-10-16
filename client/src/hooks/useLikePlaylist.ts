import { useState, useCallback, useEffect } from "react";
import { useGetUserQuery } from "../state/UserApi.slice";
import { api } from "../shared/api";

interface UseLikePlaylistReturn {
  isLiked: boolean;
  isLoading: boolean;
  error: string | null;
  toggleLike: () => Promise<void>;
  likeCount: number;
}

/**
 * Hook for managing playlist like/unlike
 * Features optimistic updates with automatic rollback on errors
 */
export const useLikePlaylist = (
  playlistId: string,
  initialLikeCount = 0
): UseLikePlaylistReturn => {
  const { data: user, refetch: refetchUser } = useGetUserQuery();

  const [isLiked, setIsLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [likeCount, setLikeCount] = useState(initialLikeCount);

  useEffect(() => {
    if (user?.likedPlaylists && playlistId) {
      const userLikesPlaylist = user.likedPlaylists.includes(playlistId);
      setIsLiked(userLikesPlaylist);
    }
  }, [user?.likedPlaylists, playlistId]);

  useEffect(() => {
    setLikeCount(initialLikeCount);
  }, [initialLikeCount]);

  const toggleLike = useCallback(async () => {
    if (!user?._id || !playlistId || isLoading) {
      return;
    }

    const previousLiked = isLiked;
    const previousCount = likeCount;

    setIsLoading(true);
    setError(null);

    try {
      const newLikedState = !isLiked;
      const newCount = newLikedState
        ? likeCount + 1
        : Math.max(0, likeCount - 1);

      setIsLiked(newLikedState);
      setLikeCount(newCount);

      const response = await api.playlist.likePlaylist(playlistId, newLikedState);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to update like status");
      }

      const data = await response.json();

      if (data.data && typeof data.data.likeCount === "number") {
        setLikeCount(data.data.likeCount);
      }

      await refetchUser();
    } catch (error) {
      setIsLiked(previousLiked);
      setLikeCount(previousCount);

      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [user?._id, playlistId, isLiked, likeCount, isLoading, refetchUser]);

  return {
    isLiked,
    isLoading,
    error,
    toggleLike,
    likeCount,
  };
};
