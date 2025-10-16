import { useCallback, useEffect, useRef, useState } from "react";
import type { Playlist } from "../types/Playlist";
import { api } from "../shared/api";

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
 * Hook for fetching user playlists with privacy filtering
 * Supports pagination and auto-fetch configuration
 */
export const useUserPlaylists = (
  userId: string,
  options: UseUserPlaylistsOptions = {}
): UseUserPlaylistsReturn => {
  const { page = 1, limit = 20, privacy, autoFetch = true } = options;

  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isLoading, setIsLoading] = useState(autoFetch);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);

  const loadUserPlaylists = useCallback(
    async (
      id: string,
      pageNum: number = 1,
      limitNum: number = 20,
      privacyFilter?: string
    ) => {
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
      loadUserPlaylists(userId, page, limit, privacy);
    }
  }, [userId, page, limit, privacy, loadUserPlaylists]);

  const loadMore = useCallback(() => {
    if (userId && pagination?.hasNextPage) {
      loadUserPlaylists(userId, pagination.currentPage + 1, limit, privacy);
    }
  }, [userId, pagination, limit, privacy, loadUserPlaylists]);

  useEffect(() => {
    if (!autoFetch) return;

    if (userId) {
      loadUserPlaylists(userId, page, limit, privacy);
    } else {
      setPlaylists([]);
      setIsLoading(false);
      setError("User ID is required");
      setPagination(null);
    }

    return () => {
      abortControllerRef.current?.abort();
    };
  }, [userId, page, limit, privacy, loadUserPlaylists, autoFetch]);

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
