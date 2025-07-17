import { useState, useEffect, useRef, useCallback } from "react";
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
 * Custom hook for fetching playlist tracks with pagination and metadata
 * Handles loading states, error management, and data fetching lifecycle
 */
export const usePlaylistTracks = (
  playlistId: string,
  options: UsePlaylistTracksOptions = {}
): UsePlaylistTracksReturn => {
  const { page = 1, limit = 20, sortOrder = -1 } = options;

  // State management
  const [playlist, setPlaylist] = useState<Playlist>({} as Playlist);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);

  // Refs for cleanup and mount state tracking
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);

  /**
   * Main data fetching function with comprehensive error handling
   * Manages request lifecycle, response validation, and state updates
   */
  const loadPlaylistTracks = useCallback(
    async (id: string, pageNum: number = 1, limitNum: number = 20) => {
      // Input validation
      if (!id?.trim()) {
        setError("Invalid playlist ID");
        setIsLoading(false);
        return;
      }

      // Cancel previous request to prevent race conditions
      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();

      setIsLoading(true);
      setError(null);

      try {
        const queryParams = new URLSearchParams({
          page: pageNum.toString(),
          limit: limitNum.toString(),
        });

        const token = localStorage.getItem("token");
        const headers: HeadersInit = {
          Accept: "application/json",
          "Content-Type": "application/json",
        };

        // Add auth header if token exists
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        const response = await fetch(
          `http://localhost:5000/api/playlists/${encodeURIComponent(
            id
          )}/tracks?${queryParams}`,
          {
            signal: abortControllerRef.current.signal,
            headers,
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));

          // Handle specific error cases
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

        // Validate response structure
        if (!responseData || typeof responseData !== "object") {
          throw new Error("Invalid response format");
        }

        // Early return if component unmounted
        if (!isMountedRef.current) return;

        // Extract and validate data
        const playlistData = responseData.data?.playlist;
        const tracksData = responseData.data?.tracks;
        const paginationData = responseData.pagination;

        if (!Array.isArray(tracksData)) {
          throw new Error("Invalid tracks data format");
        }

        // Update state with validated data
        setPlaylist(playlistData || ({} as Playlist));
        setTracks(tracksData);
        setPagination(paginationData || null);
      } catch (error) {
        // Ignore abort errors (expected when component unmounts or new request starts)
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }

        if (!isMountedRef.current) return;

        // Transform error messages for better UX
        let errorMessage = "Unknown error occurred";

        if (error instanceof Error) {
          errorMessage = error.message;
        }

        // Provide user-friendly error messages
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

        console.error("Playlist tracks loading error:", error);
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

  /**
   * Refetch current data with same parameters
   */
  const refetch = useCallback(() => {
    if (playlistId) {
      loadPlaylistTracks(playlistId, page, limit);
    }
  }, [playlistId, page, limit, loadPlaylistTracks]);

  /**
   * Load next page of data if available
   */
  const loadMore = useCallback(() => {
    if (playlistId && pagination?.hasNextPage) {
      loadPlaylistTracks(playlistId, pagination.currentPage + 1, limit);
    }
  }, [playlistId, pagination, limit, loadPlaylistTracks]);

  // Initial data loading effect
  useEffect(() => {
    if (playlistId) {
      loadPlaylistTracks(playlistId, page, limit);
    } else {
      // Reset state when no playlist ID provided
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

  // Component lifecycle management
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
