import { useState, useEffect, useRef, useCallback } from "react";
import { api } from "../shared/api";
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
 * Hook for fetching artist albums with pagination
 * Provides comprehensive state management and error handling
 */
export const useArtistAlbums = (
  artistId: string,
  options: UseArtistAlbumsOptions = {}
): UseArtistAlbumsReturn => {
  const { page = 1, limit = 20 } = options;

  const [albums, setAlbums] = useState<Album[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);

  /**
   * Loads artist albums from API with validation and error handling
   */
  const loadArtistAlbums = useCallback(
    async (id: string, pageNum: number = 1, limitNum: number = 20) => {
      if (!id?.trim()) {
        setError("Invalid artist ID");
        setIsLoading(false);
        return;
      }

      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();

      setIsLoading(true);
      setError(null);

      try {
        const response = await api.artist.getAlbums(id, {
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

        const albumsData =
          responseData.data || responseData.albums || responseData;
        const paginationData = responseData.pagination;

        if (!Array.isArray(albumsData)) {
          throw new Error("Invalid albums data format");
        }

        setAlbums(albumsData);
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
          errorMessage = "Artist albums not found";
        } else if (errorMessage.includes("HTTP 500")) {
          errorMessage = "Server error";
        }

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

  const refetch = useCallback(() => {
    if (artistId) {
      loadArtistAlbums(artistId, page, limit);
    }
  }, [artistId, page, limit, loadArtistAlbums]);

  const loadMore = useCallback(() => {
    if (artistId && pagination?.hasNextPage) {
      loadArtistAlbums(artistId, pagination.currentPage + 1, limit);
    }
  }, [artistId, pagination, limit, loadArtistAlbums]);

  useEffect(() => {
    if (artistId) {
      loadArtistAlbums(artistId, page, limit);
    } else {
      setAlbums([]);
      setIsLoading(false);
      setError("Artist ID is required");
      setPagination(null);
    }

    return () => {
      abortControllerRef.current?.abort();
    };
  }, [artistId, page, limit, loadArtistAlbums]);

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
