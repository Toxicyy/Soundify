import { useState, useEffect, useMemo, useCallback } from "react";
import { api } from "../shared/api";
import type { Track } from "../types/TrackData";
import { useGetUserQuery } from "../state/UserApi.slice";

interface UseArtistLikedTracksCountResult {
  count: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

interface LikedSongsResponse {
  success: boolean;
  data: Track[];
  message?: string;
}

/**
 * Hook for counting liked tracks from specific artist
 * Fetches user's liked songs and filters by artist ID
 */
export const useArtistLikedTracksCount = (
  artistId: string
): UseArtistLikedTracksCountResult => {
  const [likedTracks, setLikedTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const { data: user } = useGetUserQuery();
  const userId = user?._id || null;

  const count = useMemo(() => {
    if (!artistId || !likedTracks.length) return 0;

    return likedTracks.filter(
      (track) =>
        track.artist?._id === artistId || track.artist?._id === artistId
    ).length;
  }, [likedTracks, artistId]);

  const fetchLikedTracks = useCallback(async () => {
    if (!userId) {
      setLikedTracks([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.user.getLikedSongs(userId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: LikedSongsResponse = await response.json();

      if (data.success) {
        setLikedTracks(data.data || []);
      } else {
        throw new Error(data.message || "Error fetching liked tracks");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setLikedTracks([]);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const refetch = useCallback(() => {
    fetchLikedTracks();
  }, [fetchLikedTracks]);

  useEffect(() => {
    fetchLikedTracks();
  }, [fetchLikedTracks]);

  return {
    count,
    isLoading,
    error,
    refetch,
  };
};
