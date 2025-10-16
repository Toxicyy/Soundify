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

interface UseUserLikedPlaylistsOptions {
  page?: number;
  limit?: number;
  autoFetch?: boolean;
}

interface UseUserLikedPlaylistsReturn {
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
 * Hook for fetching user's liked playlists with pagination
 * Provides load more functionality and auto-fetch option
 */
export const useUserLikedPlaylists = (
  userId: string,
  options: UseUserLikedPlaylistsOptions = {}
): UseUserLikedPlaylistsReturn => {
  const { page = 1, limit = 20, autoFetch = true } = options;

  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isLoading, setIsLoading] = useState(autoFetch);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);

  const loadUserLikedPlaylists = useCallback(
    async (id: string, pageNum: number = 1, limitNum: number = 20) => {
      if (!id?.trim()) {
        setError("Invalid user ID");
        setIsLoading(false);
        return;
      }

      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();

      setIsLoading(true);
      setError(null);

      try {
        const response = await api.user.getLikedPlaylists({
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

        if (!responseData || typeof responseData !== "object") {
          throw new Error("Invalid response format");
        }

        if (!isMountedRef.current) return;

        const playlistsData = responseData.data || [];
        const paginationData = responseData.pagination;

        if (!Array.isArray(playlistsData)) {
          throw new Error("Invalid playlists data format");
        }

        setPlaylists(playlistsData);
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
          errorMessage = "User not found";
        } else if (errorMessage.includes("HTTP 403")) {
          errorMessage = "Access denied";
        } else if (errorMessage.includes("HTTP 401")) {
          errorMessage = "Authentication required";
        } else if (errorMessage.includes("HTTP 500")) {
          errorMessage = "Server error";
        }

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

  const refetch = useCallback(() => {
    if (userId) {
      loadUserLikedPlaylists(userId, page, limit);
    }
  }, [userId, page, limit, loadUserLikedPlaylists]);

  const loadMore = useCallback(() => {
    if (userId && pagination?.hasNextPage) {
      loadUserLikedPlaylists(userId, pagination.currentPage + 1, limit);
    }
  }, [userId, pagination, limit, loadUserLikedPlaylists]);

  useEffect(() => {
    if (!autoFetch) return;

    if (userId) {
      loadUserLikedPlaylists(userId, page, limit);
    } else {
      setPlaylists([]);
      setIsLoading(false);
      setError("User ID is required");
      setPagination(null);
    }

    return () => {
      abortControllerRef.current?.abort();
    };
  }, [userId, page, limit, loadUserLikedPlaylists, autoFetch]);

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
