import { useState, useCallback } from "react";
import { api } from "../shared/api";
import { useGetUserQuery } from "../state/UserApi.slice";

interface UseFollowArtistReturn {
  isFollowing: boolean;
  isLoading: boolean;
  error: string | null;
  toggleFollow: () => Promise<void>;
}

/**
 * Hook for following/unfollowing artists
 * Manages follow state and provides toggle functionality
 */
export const useFollowArtist = (
  artistId: string,
  initialFollowState = false
): UseFollowArtistReturn => {
  const { data: user } = useGetUserQuery();
  const [isFollowing, setIsFollowing] = useState(initialFollowState);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleFollow = useCallback(async () => {
    if (!user?._id || !artistId || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = isFollowing
        ? await api.user.unfollowArtist(user._id, artistId)
        : await api.user.followArtist(user._id, artistId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to update follow status");
      }

      const data = await response.json();

      if (data.success) {
        setIsFollowing(!isFollowing);
      } else {
        throw new Error(data.message || "Failed to update follow status");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      setError(errorMessage);
      console.error("Error toggling follow status:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user?._id, artistId, isFollowing, isLoading]);

  return {
    isFollowing,
    isLoading,
    error,
    toggleFollow,
  };
};
