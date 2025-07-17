import { useState, useEffect, useRef, useCallback } from "react";
import { api } from "../shared/api";
import type { Artist } from "../types/ArtistData";

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalArtists: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface UseUserLikedArtistsOptions {
  page?: number;
  limit?: number;
  autoFetch?: boolean;
}

interface UseUserLikedArtistsReturn {
  artists: Artist[];
  isLoading: boolean;
  error: string | null;
  pagination: Pagination | null;
  refetch: () => void;
  hasData: boolean;
  loadMore: () => void;
  canLoadMore: boolean;
}

/**
 * Custom hook for fetching user's liked artists with pagination
 * Handles loading states, error management, and data fetching lifecycle
 */
export const useUserLikedArtists = (
  userId: string,
  options: UseUserLikedArtistsOptions = {}
): UseUserLikedArtistsReturn => {
  const { page = 1, limit = 20, autoFetch = true } = options;

  // State management
  const [artists, setArtists] = useState<Artist[]>([]);
  const [isLoading, setIsLoading] = useState(autoFetch);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);

  // Refs for cleanup and mount state tracking
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);

  /**
   * Core data fetching function with comprehensive error handling
   * Manages request lifecycle, response validation, and state updates
   */
  const loadUserLikedArtists = useCallback(
    async (id: string, pageNum: number = 1, limitNum: number = 20) => {
      // Input validation
      if (!id?.trim()) {
        setError("Invalid user ID");
        setIsLoading(false);
        return;
      }

      // Cancel previous request to prevent race conditions
      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();

      setIsLoading(true);
      setError(null);

      try {
        const response = await api.user.getLikedArtists(id, {
          page: pageNum,
          limit: limitNum,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.message ||
              errorData.error ||
              `HTTP ${response.status}: ${response.statusText}`
          );
        }

        const responseData = await response.json();

        // Validate response structure
        if (!responseData || typeof responseData !== "object") {
          throw new Error("Invalid response format");
        }

        // Early return if component unmounted
        if (!isMountedRef.current) return;

        // Extract and validate data
        const artistsData = responseData.data || [];
        const paginationData = responseData.pagination;

        if (!Array.isArray(artistsData)) {
          throw new Error("Invalid artists data format");
        }

        // Update state with validated data
        setArtists(artistsData);
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
          errorMessage = "User not found";
        } else if (errorMessage.includes("HTTP 403")) {
          errorMessage = "Access denied";
        } else if (errorMessage.includes("HTTP 401")) {
          errorMessage = "Authentication required";
        } else if (errorMessage.includes("HTTP 500")) {
          errorMessage = "Server error";
        }

        console.error("User liked artists loading error:", error);
        setError(errorMessage);
        setArtists([]);
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
    if (userId) {
      loadUserLikedArtists(userId, page, limit);
    }
  }, [userId, page, limit, loadUserLikedArtists]);

  /**
   * Load next page of data if available
   */
  const loadMore = useCallback(() => {
    if (userId && pagination?.hasNextPage) {
      loadUserLikedArtists(userId, pagination.currentPage + 1, limit);
    }
  }, [userId, pagination, limit, loadUserLikedArtists]);

  // Initial data loading effect
  useEffect(() => {
    if (!autoFetch) return;

    if (userId) {
      loadUserLikedArtists(userId, page, limit);
    } else {
      // Reset state when no user ID provided
      setArtists([]);
      setIsLoading(false);
      setError("User ID is required");
      setPagination(null);
    }

    return () => {
      abortControllerRef.current?.abort();
    };
  }, [userId, page, limit, loadUserLikedArtists, autoFetch]);

  // Component lifecycle management
  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      abortControllerRef.current?.abort();
    };
  }, []);

  return {
    artists,
    isLoading,
    error,
    pagination,
    refetch,
    hasData: artists.length > 0,
    loadMore,
    canLoadMore: pagination?.hasNextPage ?? false,
  };
};
