import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../shared/api";
import type { Track } from "../types/TrackData";

interface UseArtistTracksReturn {
  tracks: Track[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  hasData: boolean;
}

/**
 * Hook for fetching artist tracks
 * Provides loading state and error handling
 */
export const useArtistTracks = (artistId: string): UseArtistTracksReturn => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);

  const loadArtistTracks = useCallback(async (id: string) => {
    if (!id || typeof id !== "string" || id.trim().length === 0) {
      setError("Invalid artist ID");
      setLoading(false);
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    setLoading(true);
    setError(null);

    try {
      const response = await api.artist.getTracks(id);

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;

        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          errorMessage = response.statusText || errorMessage;
        }

        throw new Error(errorMessage);
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Server returned non-JSON data");
      }

      const tracksData = await response.json();

      if (!tracksData || typeof tracksData !== "object") {
        throw new Error("Invalid data format from server");
      }

      if (!isMountedRef.current) {
        return;
      }

      const tracks = tracksData.data || tracksData.tracks || tracksData;

      if (!Array.isArray(tracks)) {
        throw new Error("Server response does not contain tracks array");
      }

      setTracks(tracks);
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }

      if (!isMountedRef.current) {
        return;
      }

      let errorMessage = "Unknown error";

      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      }

      if (
        errorMessage.includes("Failed to fetch") ||
        errorMessage.includes("NetworkError")
      ) {
        errorMessage = "Server connection problem";
      } else if (errorMessage.includes("HTTP 404")) {
        errorMessage = "Artist tracks not found";
      } else if (errorMessage.includes("HTTP 500")) {
        errorMessage = "Server error";
      }

      setError(errorMessage);
      setTracks([]);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  const refetch = useCallback(() => {
    if (artistId) {
      loadArtistTracks(artistId);
    }
  }, [artistId, loadArtistTracks]);

  useEffect(() => {
    if (artistId) {
      loadArtistTracks(artistId);
    } else {
      setTracks([]);
      setLoading(false);
      setError("Artist ID not specified");
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [artistId, loadArtistTracks]);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    tracks,
    loading,
    error,
    refetch,
    hasData: tracks.length > 0,
  };
};
