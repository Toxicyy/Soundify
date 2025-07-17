import { useState, useCallback } from "react";

interface SearchResults {
  tracks: any[];
  artists: any[];
  albums: any[];
  playlists: any[];
  totalResults: number;
  query: string;
}

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
        const params = new URLSearchParams({
          q: query,
          limit: String(options.limit || 10),
        });

        const response = await fetch(`http://localhost:5000/api/search?${params}`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        const data = await response.json();

        if (data.success) {
          setSearchResults(data.data);
        } else {
          setError(data.message || "Ошибка поиска");
        }
      } catch (err) {
        setError("Ошибка сети");
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const getPopularContent = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/search/popular", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

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
      }
    } catch (err) {
      setError("Ошибка получения популярного контента");
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
