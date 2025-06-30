import { useState, useEffect, useMemo } from "react";
import type { Track } from "../types/TrackData";
import { useGetUserQuery } from "../state/UserApi.slice";

interface UseArtistLikedTracksCountResult {
  count: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

interface LikedSongsResponse {
  success: boolean;
  data: Track[];
  message?: string;
}

export const useArtistLikedTracksCount = (
  artistId: string
): UseArtistLikedTracksCountResult => {
  const [likedTracks, setLikedTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const { data: user } = useGetUserQuery();
  const userId = user?._id || null;
  const token = localStorage.getItem("token") || null;

  // Вычисляем количество треков от конкретного артиста
  const count = useMemo(() => {
    console.log(artistId, likedTracks);
    if (!artistId || !likedTracks.length) return 0;

    console.log(
      likedTracks.filter(
        (track) =>
          track.artist?._id === artistId || track.artist?._id === artistId
      ).length
    );
    return likedTracks.filter(
      (track) =>
        track.artist?._id === artistId || track.artist?._id === artistId
    ).length;
  }, [likedTracks, artistId]);

  const fetchLikedTracks = async () => {
    // Если пользователь не авторизован - возвращаем пустой результат
    if (!userId || !token) {
      setLikedTracks([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `http://localhost:5000/api/users/${userId}/liked-songs`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: LikedSongsResponse = await response.json();

      if (data.success) {
        setLikedTracks(data.data || []);
      } else {
        throw new Error(data.message || "Ошибка при получении любимых треков");
      }
    } catch (err) {
      console.error("Error fetching liked tracks:", err);
      setError(err instanceof Error ? err.message : "Неизвестная ошибка");
      setLikedTracks([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Функция для принудительного обновления данных
  const refetch = () => {
    fetchLikedTracks();
  };

  // Загружаем данные при монтировании компонента или изменении зависимостей
  useEffect(() => {
    fetchLikedTracks();
  }, [userId, token]);

  return {
    count,
    isLoading,
    error,
    refetch,
  };
};

export default useArtistLikedTracksCount;
