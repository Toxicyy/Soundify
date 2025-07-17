import { useState, useEffect, useRef, useCallback } from "react";
import { api } from "../shared/api";
import type { Playlist } from "../types/Playlist";

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalPlaylists: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface UseUserPlaylistsOptions {
  page?: number;
  limit?: number;
  privacy?: "public" | "private" | "unlisted";
  autoFetch?: boolean;
}

interface UseUserPlaylistsReturn {
  playlists: Playlist[];
  isLoading: boolean;
  error: string | null;
  pagination: Pagination | null;
  refetch: () => void;
  hasData: boolean;
  loadMore: () => void;
  canLoadMore: boolean;
}

/**
 * Custom hook for fetching user playlists with pagination and privacy filtering
 * Handles loading states, error management, and data fetching lifecycle
 */
export const useUserPlaylists = (
  userId: string,
  options: UseUserPlaylistsOptions = {}
): UseUserPlaylistsReturn => {
  const { page = 1, limit = 20, privacy, autoFetch = true } = options;

  // State management
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
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
  const loadUserPlaylists = useCallback(
    async (
      id: string,
      pageNum: number = 1,
      limitNum: number = 20,
      privacyFilter?: string
    ) => {
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
        const response = await api.user.getPlaylists(id, {
          page: pageNum,
          limit: limitNum,
          privacy: privacyFilter as any,
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
        const playlistsData = responseData.data || [];
        const paginationData = responseData.pagination;

        if (!Array.isArray(playlistsData)) {
          throw new Error("Invalid playlists data format");
        }

        // Update state with validated data
        setPlaylists(playlistsData);
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

        console.error("User playlists loading error:", error);
        setError(errorMessage);
        setPlaylists([]);
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
      loadUserPlaylists(userId, page, limit, privacy);
    }
  }, [userId, page, limit, privacy, loadUserPlaylists]);

  /**
   * Load next page of data if available
   */
  const loadMore = useCallback(() => {
    if (userId && pagination?.hasNextPage) {
      loadUserPlaylists(userId, pagination.currentPage + 1, limit, privacy);
    }
  }, [userId, pagination, limit, privacy, loadUserPlaylists]);

  // Initial data loading effect
  useEffect(() => {
    if (!autoFetch) return;

    if (userId) {
      loadUserPlaylists(userId, page, limit, privacy);
    } else {
      // Reset state when no user ID provided
      setPlaylists([]);
      setIsLoading(false);
      setError("User ID is required");
      setPagination(null);
    }

    return () => {
      abortControllerRef.current?.abort();
    };
  }, [userId, page, limit, privacy, loadUserPlaylists, autoFetch]);

  // Component lifecycle management
  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      abortControllerRef.current?.abort();
    };
  }, []);

  return {
    playlists,
    isLoading,
    error,
    pagination,
    refetch,
    hasData: playlists.length > 0,
    loadMore,
    canLoadMore: pagination?.hasNextPage ?? false,
  };
};
