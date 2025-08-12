import { useState, useEffect, useCallback } from "react";
import { api } from "../shared/api";
import type { Playlist } from "../types/Playlist";

interface UsePlaylistReturn {
  playlist: Playlist | null;
  hasUnsavedChanges: boolean;
  loading: boolean;
  error: string | null;
  updateLocal: (updates: Partial<Playlist>) => void;
  fetchPlaylist: (id: string) => Promise<void>;
  switchUnsavedChangesToFalse: () => void;
}

export const usePlaylist = (playlistId?: string): UsePlaylistReturn => {
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [localChanges, setLocalChanges] = useState<Partial<Playlist>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (playlistId) {
      fetchPlaylist(playlistId);
    }
  }, [playlistId]);

  const fetchPlaylist = async (id: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.playlist.getById(id);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Authentication failed. Please log in again.");
        }
        if (response.status === 403) {
          throw new Error("Access denied to this playlist");
        }
        if (response.status === 404) {
          throw new Error("Playlist not found");
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setPlaylist(data.data);
        setLocalChanges({});
        setHasUnsavedChanges(false);
      } else {
        setError(data.message || "Failed to load playlist");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load playlist";
      setError(errorMessage);

      if (errorMessage.includes("Authentication")) {
        // localStorage.removeItem('token');
        // navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const switchUnsavedChangesToFalse = useCallback(() => {
    setHasUnsavedChanges(false);
  }, []);

  const updateLocal = useCallback((updates: Partial<Playlist>) => {
    setLocalChanges((prev) => ({ ...prev, ...updates }));
    setHasUnsavedChanges(true);
  }, []);

  // Получаем текущее состояние (оригинал + локальные изменения)
  const currentPlaylist: Playlist | null =
    playlist && Object.keys(localChanges).length > 0
      ? { ...playlist, ...localChanges }
      : playlist;

  return {
    playlist: currentPlaylist,
    hasUnsavedChanges,
    loading,
    error,
    updateLocal,
    fetchPlaylist,
    switchUnsavedChangesToFalse,
  };
};
