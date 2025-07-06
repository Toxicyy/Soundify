import { useState } from "react";
import { useNavigate } from "react-router-dom";

export const useQuickPlaylist = () => {
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);

  const createQuickPlaylist = async () => {
    setCreating(true);

    try {
        
      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Authentication required. Please log in.");
      }

      const response = await fetch(
        "http://localhost:5000/api/playlists/quick",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.data?.id) {
        const playlistId = data.data.id;

        // Используем setTimeout для навигации после завершения текущего рендера
        setTimeout(() => {
          navigate(`/playlist/${playlistId}`);
        }, 0);

        return data.data;
      } else {
        throw new Error(data.message || "Failed to create playlist");
      }
    } catch (error) {
      console.error("Failed to create playlist:", error);
      // Можно показать пользователю уведомление об ошибке
      alert(`Error: ${error}`);
      throw error;
    } finally {
      setCreating(false);
    }
  };

  return { createQuickPlaylist, creating };
};
