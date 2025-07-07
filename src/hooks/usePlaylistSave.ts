import { useState } from "react";

// Локальный интерфейс для сохранения (без tracks)
interface PlaylistSaveData {
  name?: string;
  description?: string;
  privacy?: "public" | "private" | "unlisted";
  category?: string;
  tags?: string[];
  cover?: File | null;
}

export const usePlaylistSave = (playlistId: string) => {
  const [saving, setSaving] = useState(false);

  const saveChanges = async (changes: PlaylistSaveData) => {
    setSaving(true);
    try {
      const formData = new FormData();

      // Добавляем текстовые поля
      if (changes.name) formData.append("name", changes.name);
      if (changes.description)
        formData.append("description", changes.description);
      if (changes.privacy) formData.append("privacy", changes.privacy);
      if (changes.category) formData.append("category", changes.category);
      if (changes.tags) formData.append("tags", JSON.stringify(changes.tags));

      // Добавляем файл, если есть
      if (changes.cover) formData.append("cover", changes.cover);

      const response = await fetch(
        `http://localhost:5000/api/playlists/${playlistId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            // НЕ ДОБАВЛЯЙ Content-Type! Браузер сам установит multipart/form-data с boundary
          },
          body: formData, // FormData вместо JSON
        }
      );

      if (!response.ok) {
        console.log(changes.tags)
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        return data.data;
      } else {
        throw new Error(data.message || "Failed to save playlist");
      }
    } catch (error) {
      console.error("Failed to save playlist:", error);
      throw error;
    } finally {
      setSaving(false);
    }
  };

  return { saveChanges, saving };
};
