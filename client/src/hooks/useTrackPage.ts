import { useState, useEffect } from "react";
import { api } from "../shared/api";
import type { Track } from "../types/TrackData";

interface UseTrackPageReturn {
  track: Track | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useTrackPage = (trackId: string): UseTrackPageReturn => {
  const [track, setTrack] = useState<Track | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTrack = async () => {
    if (!trackId) {
      setError("Track ID is required");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await api.track.getForPage(trackId);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Track not found");
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.data) {
        setTrack(data.data);
      } else {
        throw new Error(data.message || "Failed to load track");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      setError(errorMessage);
      console.error("Error fetching track for page:", err);
    } finally {
      setLoading(false);
    }
  };

  const refetch = async () => {
    await fetchTrack();
  };

  useEffect(() => {
    fetchTrack();
  }, [trackId]);

  return {
    track,
    loading,
    error,
    refetch,
  };
};
