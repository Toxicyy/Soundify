import { useState, useEffect, useRef, useCallback } from "react";
import { api } from "../shared/api";
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
 * Hook for fetching album tracks with pagination
 * Handles loading states, errors, and provides load more functionality
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

  const [album, setAlbum] = useState<Album>({} as Album);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);

  /**
   * Loads album tracks from API with comprehensive error handling
   */
  const loadAlbumTracks = useCallback(
    async (
      id: string,
      pageNum: number = 1,
      limitNum: number = 20,
      sortByParam: string = "createdAt",
      sortOrderParam: number = -1
    ) => {
      if (!id?.trim()) {
        setError("Invalid album ID");
        setIsLoading(false);
        return;
      }

      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();

      setIsLoading(true);
      setError(null);

      try {
        const response = await api.album.getTracks(id, {
          page: pageNum,
          limit: limitNum,
          sortBy: sortByParam,
          sortOrder: sortOrderParam,
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

        const albumData = responseData.data?.album;
        const tracksData = responseData.data?.tracks;
        const paginationData = responseData.pagination;

        if (!Array.isArray(tracksData)) {
          throw new Error("Invalid tracks data format");
        }

        setAlbum(albumData || ({} as Album));
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
          errorMessage = "Album not found";
        } else if (errorMessage.includes("HTTP 500")) {
          errorMessage = "Server error";
        }

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

  const refetch = useCallback(() => {
    if (albumId) {
      loadAlbumTracks(albumId, page, limit, sortBy, sortOrder);
    }
  }, [albumId, page, limit, sortBy, sortOrder, loadAlbumTracks]);

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

  useEffect(() => {
    if (albumId) {
      loadAlbumTracks(albumId, page, limit, sortBy, sortOrder);
    } else {
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
