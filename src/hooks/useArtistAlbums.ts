import { useState, useEffect, useRef, useCallback } from "react";
import type { Album } from "../types/AlbumData";

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalAlbums: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface UseArtistAlbumsOptions {
  page?: number;
  limit?: number;
}

interface UseArtistAlbumsReturn {
  albums: Album[];
  isLoading: boolean;
  error: string | null;
  pagination: Pagination | null;
  refetch: () => void;
  hasData: boolean;
  loadMore: () => void;
  canLoadMore: boolean;
}

/**
 * Custom hook for fetching artist albums with pagination support
 * Provides comprehensive state management and error handling
 */
export const useArtistAlbums = (
  artistId: string,
  options: UseArtistAlbumsOptions = {}
): UseArtistAlbumsReturn => {
  const { page = 1, limit = 20 } = options;

  // State management
  const [albums, setAlbums] = useState<Album[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);

  // Refs for cleanup and mount state tracking
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);

  /**
   * Core data fetching function with error handling and validation
   * Manages request lifecycle and response processing
   */
  const loadArtistAlbums = useCallback(
    async (id: string, pageNum: number = 1, limitNum: number = 20) => {
      // Input validation
      if (!id?.trim()) {
        setError("Invalid artist ID");
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

        const response = await fetch(
          `http://localhost:5000/api/artists/${encodeURIComponent(
            id
          )}/albums?${queryParams}`,
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

        // Extract and validate albums data
        const albumsData =
          responseData.data || responseData.albums || responseData;
        const paginationData = responseData.pagination;

        if (!Array.isArray(albumsData)) {
          throw new Error("Invalid albums data format");
        }

        // Update state with validated data
        setAlbums(albumsData);
        setPagination(paginationData || null);
      } catch (error) {
        // Ignore abort errors (expected behavior)
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
          errorMessage = "Artist albums not found";
        } else if (errorMessage.includes("HTTP 500")) {
          errorMessage = "Server error";
        }

        console.error("Artist albums loading error:", error);
        setError(errorMessage);
        setAlbums([]);
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
    if (artistId) {
      loadArtistAlbums(artistId, page, limit);
    }
  }, [artistId, page, limit, loadArtistAlbums]);

  /**
   * Load next page of data if available
   */
  const loadMore = useCallback(() => {
    if (artistId && pagination?.hasNextPage) {
      loadArtistAlbums(artistId, pagination.currentPage + 1, limit);
    }
  }, [artistId, pagination, limit, loadArtistAlbums]);

  // Initial data loading effect
  useEffect(() => {
    if (artistId) {
      loadArtistAlbums(artistId, page, limit);
    } else {
      // Reset state when no artist ID provided
      setAlbums([]);
      setIsLoading(false);
      setError("Artist ID is required");
      setPagination(null);
    }

    return () => {
      abortControllerRef.current?.abort();
    };
  }, [artistId, page, limit, loadArtistAlbums]);

  // Component lifecycle management
  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      abortControllerRef.current?.abort();
    };
  }, []);

  return {
    albums,
    isLoading,
    error,
    pagination,
    refetch,
    hasData: albums.length > 0,
    loadMore,
    canLoadMore: pagination?.hasNextPage ?? false,
  };
};
