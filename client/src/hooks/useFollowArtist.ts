import { useState, useCallback, useEffect } from "react";
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
export const useFollowArtist = (artistId: string): UseFollowArtistReturn => {
  const { data: user, isLoading: isUserLoading } = useGetUserQuery();
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && artistId) {
      setIsFollowing(
        user.likedArtists.some((artist) =>
          typeof artist === "object"
            ? artist._id === artistId
            : artist === artistId
        )
      );
    }
  }, [user, artistId]);

  const toggleFollow = useCallback(async () => {
    if (!user?._id || !artistId || isLoading || isUserLoading) return;

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
  }, [user?._id, artistId, isFollowing, isLoading, isUserLoading]);

  return {
    isFollowing,
    isLoading,
    error,
    toggleFollow,
  };
};
