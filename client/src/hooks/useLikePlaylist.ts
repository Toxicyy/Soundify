import { useState, useCallback, useEffect } from "react";
import { useGetUserQuery } from "../state/UserApi.slice";

interface UseLikePlaylistReturn {
  isLiked: boolean;
  isLoading: boolean;
  error: string | null;
  toggleLike: () => Promise<void>;
  likeCount: number;
}

/**
 * Hook for managing playlist like/unlike functionality
 *
 * Features:
 * - Optimistic updates for immediate UI feedback
 * - Automatic state sync with user data
 * - Comprehensive error handling with rollback
 * - Integration with playlist API endpoints
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

  // Initialize like status from user data
  useEffect(() => {
    if (user?.likedPlaylists && playlistId) {
      const userLikesPlaylist = user.likedPlaylists.includes(playlistId);
      setIsLiked(userLikesPlaylist);
    }
  }, [user?.likedPlaylists, playlistId]);

  // Update like count when prop changes
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
      // Optimistic update
      const newLikedState = !isLiked;
      const newCount = newLikedState
        ? likeCount + 1
        : Math.max(0, likeCount - 1);

      setIsLiked(newLikedState);
      setLikeCount(newCount);

      // API call
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:5000/api/playlists/${playlistId}/like`,
        {
          method: newLikedState ? "POST" : "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to update like status");
      }

      const data = await response.json();

      if (data.data && typeof data.data.likeCount === "number") {
        setLikeCount(data.data.likeCount);
      }

      // Refresh user data
      await refetchUser();
    } catch (error) {
      // Rollback optimistic updates on error
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
