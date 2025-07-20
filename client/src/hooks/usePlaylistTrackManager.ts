import { useState, useCallback } from "react";
import { api } from "../shared/api";
import type { Track } from "../types/TrackData";

interface UsePlaylistTrackManagerOptions {
  playlistId: string;
  onTrackAdded?: (track: Track) => void;
  onTrackRemoved?: (trackId: string) => void;
  onError?: (error: string) => void;
}

interface UsePlaylistTrackManagerReturn {
  addTrack: (track: Track) => Promise<void>;
  removeTrack: (trackId: string) => Promise<void>;
  updateTrackOrder: (trackIds: string[]) => Promise<void>;
  isAdding: boolean;
  isRemoving: boolean;
  isReordering: boolean;
}

/**
 * Хук для управления треками в плейлисте
 * Обрабатывает добавление, удаление и изменение порядка треков
 */
export const usePlaylistTrackManager = ({
  playlistId,
  onTrackAdded,
  onTrackRemoved,
  onError,
}: UsePlaylistTrackManagerOptions): UsePlaylistTrackManagerReturn => {
  const [isAdding, setIsAdding] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [isReordering, setIsReordering] = useState(false);

  /**
   * Обработка ошибок API
   */
  const handleApiError = useCallback((response: Response, errorData: any) => {
    if (response.status === 401) {
      throw new Error("Authentication failed. Please log in again.");
    }
    if (response.status === 403) {
      throw new Error("You don't have permission to edit this playlist");
    }
    if (response.status === 404) {
      throw new Error("Playlist or track not found");
    }
    if (response.status === 409) {
      throw new Error("Track is already in this playlist");
    }

    throw new Error(
      errorData.message ||
        errorData.error ||
        `Operation failed: ${response.status}`
    );
  }, []);

  /**
   * Добавление трека в плейлист
   */
  const addTrack = useCallback(
    async (track: Track) => {
      if (!playlistId || !track._id) {
        throw new Error("Invalid playlist or track ID");
      }

      setIsAdding(true);

      try {
        const response = await api.playlist.addTrack(playlistId, track._id);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          handleApiError(response, errorData);
        }

        const data = await response.json();

        if (data.success) {
          onTrackAdded?.(track);
          console.log(`✅ Track "${track.name}" added to playlist`);
        } else {
          throw new Error(data.message || "Failed to add track");
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        console.error("Error adding track:", error);
        onError?.(errorMessage);
        throw error;
      } finally {
        setIsAdding(false);
      }
    },
    [playlistId, handleApiError, onTrackAdded, onError]
  );

  /**
   * Удаление трека из плейлиста
   */
  const removeTrack = useCallback(
    async (trackId: string) => {
      if (!playlistId || !trackId) {
        throw new Error("Invalid playlist or track ID");
      }

      setIsRemoving(true);

      try {
        const response = await api.playlist.removeTrack(playlistId, trackId);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          handleApiError(response, errorData);
        }

        const data = await response.json();

        if (data.success) {
          onTrackRemoved?.(trackId);
          console.log(`✅ Track removed from playlist`);
        } else {
          throw new Error(data.message || "Failed to remove track");
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        console.error("Error removing track:", error);
        onError?.(errorMessage);
        throw error;
      } finally {
        setIsRemoving(false);
      }
    },
    [playlistId, handleApiError, onTrackRemoved, onError]
  );

  /**
   * Изменение порядка треков в плейлисте
   */
  const updateTrackOrder = useCallback(
    async (trackIds: string[]) => {
      if (!playlistId || !Array.isArray(trackIds)) {
        throw new Error("Invalid playlist ID or track IDs");
      }

      setIsReordering(true);

      try {
        const response = await api.playlist.updateTrackOrder(
          playlistId,
          trackIds
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          handleApiError(response, errorData);
        }

        const data = await response.json();

        if (data.success) {
          console.log(`✅ Track order updated`);
        } else {
          throw new Error(data.message || "Failed to update track order");
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        console.error("Error updating track order:", error);
        onError?.(errorMessage);
        throw error;
      } finally {
        setIsReordering(false);
      }
    },
    [playlistId, handleApiError, onError]
  );

  return {
    addTrack,
    removeTrack,
    updateTrackOrder,
    isAdding,
    isRemoving,
    isReordering,
  };
};
