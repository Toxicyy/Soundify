import { useState } from "react";
import { api } from "../shared/api";
import { useImagePreloader } from "./useImagePreloader";
import type { Track } from "../types/TrackData";

export const useLikedTracksLoader = () => {
  const [likedTracks, setLikedTracks] = useState<Track[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [imageSrcs, setImageSrcs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const { allImagesLoaded } = useImagePreloader(imageSrcs);

  // Общее состояние загрузки - данные + изображения
  const isFullyLoaded = !dataLoading && allImagesLoaded;

  const loadLikedTracks = async (userId: string) => {
    if (!userId) {
      setError("User ID is required");
      setDataLoading(false);
      return;
    }

    setDataLoading(true);
    setError(null);

    try {
      const response = await api.user.getLikedSongs(userId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const tracks = data.data || [];

      setLikedTracks(tracks);

      // Собираем все URL изображений для предзагрузки
      const allImageSrcs: string[] = [];

      tracks.forEach((track: Track) => {
        // Обложка трека
        if (track.coverUrl) {
          allImageSrcs.push(track.coverUrl);
        }
      });

      // Убираем дубликаты URL
      const uniqueImageSrcs = [...new Set(allImageSrcs)];
      setImageSrcs(uniqueImageSrcs);
      setDataLoading(false);
    } catch (error) {
      console.error("Ошибка загрузки любимых треков:", error);
      setError(
        error instanceof Error ? error.message : "Unknown error occurred"
      );
      setDataLoading(false);
    }
  };

  const refreshLikedTracks = async (userId: string) => {
    // Перезагрузка без сброса текущих данных (для обновления после лайка/дизлайка)
    try {
      const response = await api.user.getLikedSongs(userId);

      if (response.ok) {
        const data = await response.json();
        setLikedTracks(data.data || []);
      }
    } catch (error) {
      console.error("Ошибка обновления любимых треков:", error);
    }
  };

  const addTrackToLiked = (track: Track) => {
    setLikedTracks((prev) => {
      if (prev.some((t) => t._id === track._id)) {
        return prev; // Трек already exists
      }
      return [track, ...prev]; // Добавляем в начало списка
    });
  };

  const removeTrackFromLiked = (trackId: string) => {
    setLikedTracks((prev) => prev.filter((track) => track._id !== trackId));
  };

  const clearLikedTracks = () => {
    setLikedTracks([]);
    setImageSrcs([]);
    setError(null);
  };

  return {
    likedTracks,
    isLoading: !isFullyLoaded,
    dataLoading, // Отдельное состояние загрузки данных
    imagesLoading: !allImagesLoaded, // Отдельное состояние загрузки изображений
    error,
    loadLikedTracks,
    refreshLikedTracks,
    addTrackToLiked,
    removeTrackFromLiked,
    clearLikedTracks,
    tracksCount: likedTracks.length,
  };
};
