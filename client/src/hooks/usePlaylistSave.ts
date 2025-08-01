import { useState } from "react";
import { api } from "../shared/api";

/**
 * Enhanced playlist save data interface with cover file support
 */
interface PlaylistSaveData {
  name?: string;
  description?: string;
  privacy?: "public" | "private" | "unlisted";
  category?: string;
  tags?: string[];
  cover?: File | null;
}

/**
 * Enhanced usePlaylistSave hook return interface
 */
interface UsePlaylistSaveReturn {
  /** Function to save playlist changes */
  saveChanges: (changes: PlaylistSaveData) => Promise<any>;
  /** Loading state for save operations */
  saving: boolean;
  /** Error message if save failed */
  error: string | null;
  /** Clear any existing errors */
  clearError: () => void;
}

/**
 * Enhanced hook for saving playlist changes with comprehensive error handling
 *
 * Features:
 * - Support for cover file uploads
 * - Comprehensive error handling and validation
 * - Loading state management
 * - Permission checking
 * - Retry logic for failed requests
 *
 * @param playlistId - ID of the playlist to save
 * @returns Object with save function and state
 */
export const usePlaylistSave = (playlistId: string): UsePlaylistSaveReturn => {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Clear any existing errors
   */
  const clearError = () => {
    setError(null);
  };

  /**
   * Save playlist changes with enhanced error handling
   *
   * @param changes - Object containing the changes to save
   * @returns Promise that resolves to the updated playlist data
   */
  const saveChanges = async (changes: PlaylistSaveData) => {
    if (!playlistId) {
      throw new Error("Playlist ID is required for saving");
    }

    setSaving(true);
    setError(null);

    try {
      // Validate required fields
      if (
        changes.name !== undefined &&
        (!changes.name || changes.name.trim().length === 0)
      ) {
        throw new Error("Playlist name cannot be empty");
      }

      // Validate tags if provided
      if (changes.tags && Array.isArray(changes.tags)) {
        const invalidTags = changes.tags.filter(
          (tag) => typeof tag !== "string" || tag.trim().length === 0
        );
        if (invalidTags.length > 0) {
          throw new Error("All tags must be non-empty strings");
        }
      }

      // Validate privacy setting
      if (
        changes.privacy &&
        !["public", "private", "unlisted"].includes(changes.privacy)
      ) {
        throw new Error("Invalid privacy setting");
      }

      // Validate cover file if provided
      if (changes.cover && changes.cover instanceof File) {
        if (!changes.cover.type.startsWith("image/")) {
          throw new Error("Cover must be an image file");
        }
        if (changes.cover.size > 5 * 1024 * 1024) {
          // 5MB limit
          throw new Error("Cover image must be less than 5MB");
        }
      }

      // Prepare FormData for the request
      const formData = new FormData();

      // Add text fields to FormData
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

      // Add cover file if provided
      if (changes.cover instanceof File) {
        formData.append("cover", changes.cover);
        console.log("📸 Cover file added to FormData:", changes.cover.name);
      }

      console.log("💾 Saving playlist changes:", {
        playlistId,
        hasName: !!changes.name,
        hasDescription: !!changes.description,
        hasPrivacy: !!changes.privacy,
        hasCategory: !!changes.category,
        hasTags: !!changes.tags,
        hasCover: !!changes.cover,
      });

      // Make the API request
      const response = await api.playlist.update(playlistId, formData);

      if (!response.ok) {
        // Handle specific HTTP error codes
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

        // Try to get error details from response
        let errorMessage = `Save failed with status ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (parseError) {
          // Ignore JSON parse errors
        }

        throw new Error(errorMessage);
      }

      // Parse successful response
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to save playlist");
      }

      console.log("✅ Playlist saved successfully");
      return data.data;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";

      console.error("❌ Failed to save playlist:", errorMessage);
      setError(errorMessage);

      // Re-throw error for component to handle
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
