import { useState, useEffect, useRef } from "react";
import { api } from "../shared/api";
import type { Artist } from "../types/ArtistData";

interface UseArtistDataReturn {
  data: Artist | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Hook for fetching artist data by ID
 * Handles loading, errors, and automatic cleanup
 */
export const useArtistData = (artistId: string): UseArtistDataReturn => {
  const [data, setData] = useState<Artist | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);

  const loadArtistData = async (id: string) => {
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
      const response = await api.artist.getById(id);

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

      const artistData = await response.json();

      if (!artistData || typeof artistData !== "object") {
        throw new Error("Invalid data format from server");
      }

      if (!isMountedRef.current) {
        return;
      }

      setData(artistData.data || artistData);
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
        errorMessage = "Artist not found";
      } else if (errorMessage.includes("HTTP 500")) {
        errorMessage = "Server error";
      }

      setError(errorMessage);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  const refetch = () => {
    if (artistId) {
      loadArtistData(artistId);
    }
  };

  useEffect(() => {
    if (artistId) {
      loadArtistData(artistId);
    } else {
      setData(null);
      setLoading(false);
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [artistId]);

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
    data,
    loading,
    error,
    refetch,
  };
};
