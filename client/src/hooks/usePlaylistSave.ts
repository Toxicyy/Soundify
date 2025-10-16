import { useState } from "react";
import { api } from "../shared/api";

interface PlaylistSaveData {
  name?: string;
  description?: string;
  privacy?: "public" | "private" | "unlisted";
  category?: string;
  tags?: string[];
  cover?: File | null;
}

interface UsePlaylistSaveReturn {
  saveChanges: (changes: PlaylistSaveData) => Promise<any>;
  saving: boolean;
  error: string | null;
  clearError: () => void;
}

/**
 * Hook for saving playlist changes with cover upload support
 * Validates data and handles comprehensive error scenarios
 */
export const usePlaylistSave = (playlistId: string): UsePlaylistSaveReturn => {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => {
    setError(null);
  };

  /**
   * Saves playlist changes with full validation and error handling
   */
  const saveChanges = async (changes: PlaylistSaveData) => {
    if (!playlistId) {
      throw new Error("Playlist ID is required for saving");
    }

    setSaving(true);
    setError(null);

    try {
      if (
        changes.name !== undefined &&
        (!changes.name || changes.name.trim().length === 0)
      ) {
        throw new Error("Playlist name cannot be empty");
      }

      if (changes.tags && Array.isArray(changes.tags)) {
        const invalidTags = changes.tags.filter(
          (tag) => typeof tag !== "string" || tag.trim().length === 0
        );
        if (invalidTags.length > 0) {
          throw new Error("All tags must be non-empty strings");
        }
      }

      if (
        changes.privacy &&
        !["public", "private", "unlisted"].includes(changes.privacy)
      ) {
        throw new Error("Invalid privacy setting");
      }

      if (changes.cover && changes.cover instanceof File) {
        if (!changes.cover.type.startsWith("image/")) {
          throw new Error("Cover must be an image file");
        }
        if (changes.cover.size > 5 * 1024 * 1024) {
          throw new Error("Cover image must be less than 5MB");
        }
      }

      const formData = new FormData();

      if (changes.name !== undefined) {
        formData.append("name", changes.name.trim());
      }
      if (changes.description !== undefined) {
        formData.append("description", changes.description.trim());
      }
      if (changes.privacy !== undefined) {
        formData.append("privacy", changes.privacy);
      }
      if (changes.category !== undefined) {
        formData.append("category", changes.category);
      }
      if (changes.tags !== undefined) {
        formData.append("tags", JSON.stringify(changes.tags));
      }

      if (changes.cover instanceof File) {
        formData.append("cover", changes.cover);
      }

      const response = await api.playlist.update(playlistId, formData);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Authentication failed. Please log in again.");
        }
        if (response.status === 403) {
          throw new Error("You don't have permission to edit this playlist.");
        }
        if (response.status === 404) {
          throw new Error("Playlist not found.");
        }
        if (response.status === 413) {
          throw new Error("File too large. Please choose a smaller image.");
        }
        if (response.status === 422) {
          throw new Error("Invalid data provided. Please check your inputs.");
        }

        let errorMessage = `Save failed with status ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          // Silent fail on JSON parse
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to save playlist");
      }

      return data.data;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";

      setError(errorMessage);
      throw error;
    } finally {
      setSaving(false);
    }
  };

  return {
    saveChanges,
    saving,
    error,
    clearError,
  };
};
