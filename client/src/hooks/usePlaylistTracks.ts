import { useState, useEffect, useRef, useCallback } from "react";
import { api } from "../shared/api";
import type { Track } from "../types/TrackData";
import type { Playlist } from "../types/Playlist";

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalTracks: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface UsePlaylistTracksOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: number;
}

interface UsePlaylistTracksReturn {
  playlist: Playlist;
  tracks: Track[];
  isLoading: boolean;
  error: string | null;
  pagination: Pagination | null;
  refetch: () => void;
  hasData: boolean;
  loadMore: () => void;
  canLoadMore: boolean;
}

/**
 * Hook for fetching playlist tracks with pagination
 * Provides comprehensive error handling and loading states
 */
export const usePlaylistTracks = (
  playlistId: string,
  options: UsePlaylistTracksOptions = {}
): UsePlaylistTracksReturn => {
  const { page = 1, limit = 20, sortOrder = -1 } = options;

  const [playlist, setPlaylist] = useState<Playlist>({} as Playlist);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);

  /**
   * Loads playlist tracks with comprehensive validation
   */
  const loadPlaylistTracks = useCallback(
    async (id: string, pageNum: number = 1, limitNum: number = 20) => {
      if (!id?.trim()) {
        setError("Invalid playlist ID");
        setIsLoading(false);
        return;
      }

      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();

      setIsLoading(true);
      setError(null);

      try {
        const response = await api.playlist.getTracks(id, {
          page: pageNum,
          limit: limitNum,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));

          if (response.status === 401) {
            throw new Error("Authentication required. Please log in.");
          }
          if (response.status === 403) {
            throw new Error("Access denied to this playlist");
          }
          if (response.status === 404) {
            throw new Error("Playlist not found");
          }

          throw new Error(
            errorData.message ||
              errorData.error ||
              `HTTP ${response.status}: ${response.statusText}`
          );
        }

        const contentType = response.headers.get("content-type");
        if (!contentType?.includes("application/json")) {
          throw new Error("Invalid response format - expected JSON");
        }

        const responseData = await response.json();

        if (!responseData || typeof responseData !== "object") {
          throw new Error("Invalid response format");
        }

        if (!isMountedRef.current) return;

        const playlistData = responseData.data?.playlist;
        const tracksData = responseData.data?.tracks;
        const paginationData = responseData.pagination;

        if (!Array.isArray(tracksData)) {
          throw new Error("Invalid tracks data format");
        }

        setPlaylist(playlistData || ({} as Playlist));
        setTracks(tracksData);
        setPagination(paginationData || null);
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }

        if (!isMountedRef.current) return;

        let errorMessage = "Unknown error occurred";

        if (error instanceof Error) {
          errorMessage = error.message;
        }

        if (
          errorMessage.includes("Failed to fetch") ||
          errorMessage.includes("NetworkError")
        ) {
          errorMessage = "Network connection error";
        } else if (errorMessage.includes("HTTP 404")) {
          errorMessage = "Playlist not found";
        } else if (errorMessage.includes("HTTP 500")) {
          errorMessage = "Server error";
        }

        setError(errorMessage);
        setPlaylist({} as Playlist);
        setTracks([]);
        setPagination(null);
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    },
    []
  );

  const refetch = useCallback(() => {
    if (playlistId) {
      loadPlaylistTracks(playlistId, page, limit);
    }
  }, [playlistId, page, limit, loadPlaylistTracks]);

  const loadMore = useCallback(() => {
    if (playlistId && pagination?.hasNextPage) {
      loadPlaylistTracks(playlistId, pagination.currentPage + 1, limit);
    }
  }, [playlistId, pagination, limit, loadPlaylistTracks]);

  useEffect(() => {
    if (playlistId) {
      loadPlaylistTracks(playlistId, page, limit);
    } else {
      setPlaylist({} as Playlist);
      setTracks([]);
      setIsLoading(false);
      setError("Playlist ID is required");
      setPagination(null);
    }

    return () => {
      abortControllerRef.current?.abort();
    };
  }, [playlistId, page, limit, sortOrder, loadPlaylistTracks]);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      abortControllerRef.current?.abort();
    };
  }, []);

  return {
    playlist,
    tracks,
    isLoading,
    error,
    pagination,
    refetch,
    hasData: tracks.length > 0,
    loadMore,
    canLoadMore: pagination?.hasNextPage ?? false,
  };
};
