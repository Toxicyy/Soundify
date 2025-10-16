import { useState, useCallback } from "react";
import { api } from "../shared/api";

interface SearchResults {
  tracks: any[];
  artists: any[];
  albums: any[];
  playlists: any[];
  totalResults: number;
  query: string;
}

/**
 * Hook for global search across all content types
 * Searches tracks, artists, albums, and playlists
 */
export const useGlobalSearch = () => {
  const [searchResults, setSearchResults] = useState<SearchResults | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchGlobal = useCallback(
    async (query: string, options: { limit?: number } = {}) => {
      if (!query.trim()) return;

      setIsLoading(true);
      setError(null);

      try {
        const response = await api.search.global(query, options);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.success) {
          setSearchResults(data.data);
        } else {
          setError(data.message || "Search error");
        }
      } catch (err) {
        setError("Network error");
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const getPopularContent = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.search.getPopular();

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setSearchResults({
          tracks: data.data.tracks || [],
          artists: data.data.artists || [],
          albums: data.data.albums || [],
          playlists: data.data.playlists || [],
          totalResults:
            (data.data.tracks?.length || 0) +
            (data.data.artists?.length || 0) +
            (data.data.albums?.length || 0) +
            (data.data.playlists?.length || 0),
          query: "",
        });
      } else {
        setError(data.message || "Error fetching popular content");
      }
    } catch (err) {
      setError("Error fetching popular content");
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    searchResults,
    isLoading,
    error,
    searchGlobal,
    getPopularContent,
  };
};
