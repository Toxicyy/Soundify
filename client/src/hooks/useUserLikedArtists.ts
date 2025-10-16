import { useCallback, useEffect, useRef, useState } from "react";
import type { Artist } from "../types/ArtistData";
import { api } from "../shared/api";

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
 * Hook for fetching user's liked artists with pagination
 * Supports auto-fetch and provides load more functionality
 */
export const useUserLikedArtists = (
  userId: string,
  options: UseUserLikedArtistsOptions = {}
): UseUserLikedArtistsReturn => {
  const { page = 1, limit = 20, autoFetch = true } = options;

  const [artists, setArtists] = useState<Artist[]>([]);
  const [isLoading, setIsLoading] = useState(autoFetch);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);

  const loadUserLikedArtists = useCallback(
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

        if (!responseData || typeof responseData !== "object") {
          throw new Error("Invalid response format");
        }

        if (!isMountedRef.current) return;

        const artistsData = responseData.data || [];
        const paginationData = responseData.pagination;

        if (!Array.isArray(artistsData)) {
          throw new Error("Invalid artists data format");
        }

        setArtists(artistsData);
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

  const refetch = useCallback(() => {
    if (userId) {
      loadUserLikedArtists(userId, page, limit);
    }
  }, [userId, page, limit, loadUserLikedArtists]);

  const loadMore = useCallback(() => {
    if (userId && pagination?.hasNextPage) {
      loadUserLikedArtists(userId, pagination.currentPage + 1, limit);
    }
  }, [userId, pagination, limit, loadUserLikedArtists]);

  useEffect(() => {
    if (!autoFetch) return;

    if (userId) {
      loadUserLikedArtists(userId, page, limit);
    } else {
      setArtists([]);
      setIsLoading(false);
      setError("User ID is required");
      setPagination(null);
    }

    return () => {
      abortControllerRef.current?.abort();
    };
  }, [userId, page, limit, loadUserLikedArtists, autoFetch]);

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
