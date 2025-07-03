import { useState, useEffect, useRef, useCallback } from "react";
import type { Track } from "../types/TrackData";
import type { Album } from "../types/AlbumData";

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalTracks: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface UseAlbumTracksOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: number;
}

interface UseAlbumTracksReturn {
  album: Album;
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
 * Custom hook for fetching album tracks with pagination and metadata
 * Handles loading states, error management, and data fetching lifecycle
 */
export const useAlbumTracks = (
  albumId: string,
  options: UseAlbumTracksOptions = {}
): UseAlbumTracksReturn => {
  const {
    page = 1,
    limit = 20,
    sortBy = "createdAt",
    sortOrder = -1,
  } = options;

  // State management
  const [album, setAlbum] = useState<Album>({} as Album);
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
  const loadAlbumTracks = useCallback(
    async (
      id: string,
      pageNum: number = 1,
      limitNum: number = 20,
      sortByParam: string = "createdAt",
      sortOrderParam: number = -1
    ) => {
      // Input validation
      if (!id?.trim()) {
        setError("Invalid album ID");
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
          sortBy: sortByParam,
          sortOrder: sortOrderParam.toString(),
        });

        const response = await fetch(
          `http://localhost:5000/api/albums/${encodeURIComponent(
            id
          )}/tracks?${queryParams}`,
          {
            signal: abortControllerRef.current.signal,
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
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
        const albumData = responseData.data?.album;
        const tracksData = responseData.data?.tracks;
        const paginationData = responseData.pagination;

        if (!Array.isArray(tracksData)) {
          throw new Error("Invalid tracks data format");
        }

        // Update state with validated data
        setAlbum(albumData || ({} as Album));
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
          errorMessage = "Album not found";
        } else if (errorMessage.includes("HTTP 500")) {
          errorMessage = "Server error";
        }

        console.error("Album tracks loading error:", error);
        setError(errorMessage);
        setAlbum({} as Album);
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
    if (albumId) {
      loadAlbumTracks(albumId, page, limit, sortBy, sortOrder);
    }
  }, [albumId, page, limit, sortBy, sortOrder, loadAlbumTracks]);

  /**
   * Load next page of data if available
   */
  const loadMore = useCallback(() => {
    if (albumId && pagination?.hasNextPage) {
      loadAlbumTracks(
        albumId,
        pagination.currentPage + 1,
        limit,
        sortBy,
        sortOrder
      );
    }
  }, [albumId, pagination, limit, sortBy, sortOrder, loadAlbumTracks]);

  // Initial data loading effect
  useEffect(() => {
    if (albumId) {
      loadAlbumTracks(albumId, page, limit, sortBy, sortOrder);
    } else {
      // Reset state when no album ID provided
      setAlbum({} as Album);
      setTracks([]);
      setIsLoading(false);
      setError("Album ID is required");
      setPagination(null);
    }

    return () => {
      abortControllerRef.current?.abort();
    };
  }, [albumId, page, limit, sortBy, sortOrder, loadAlbumTracks]);

  // Component lifecycle management
  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      abortControllerRef.current?.abort();
    };
  }, []);

  return {
    album,
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
