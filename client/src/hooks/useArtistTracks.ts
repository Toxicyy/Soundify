import { useState, useEffect, useRef, useCallback } from "react";
import { api } from "../shared/api";
import type { Track } from "../types/TrackData";

interface UseArtistTracksReturn {
  tracks: Track[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  hasData: boolean;
}

export const useArtistTracks = (artistId: string): UseArtistTracksReturn => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);

  // Функция для загрузки треков артиста
  const loadArtistTracks = useCallback(async (id: string) => {
    // Валидация ID
    if (!id || typeof id !== "string" || id.trim().length === 0) {
      setError("Неверный ID артиста");
      setLoading(false);
      return;
    }

    // Отменяем предыдущий запрос
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Создаем новый AbortController
    abortControllerRef.current = new AbortController();

    // Сбрасываем состояние
    setLoading(true);
    setError(null);

    try {
      const response = await api.artist.getTracks(id);

      // Проверка статуса ответа
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;

        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          errorMessage = response.statusText || errorMessage;
        }

        throw new Error(errorMessage);
      }

      // Проверка Content-Type
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Сервер вернул не JSON данные");
      }

      const tracksData = await response.json();

      // Проверка структуры ответа
      if (!tracksData || typeof tracksData !== "object") {
        throw new Error("Неверный формат данных от сервера");
      }

      // Проверяем что компонент еще смонтирован
      if (!isMountedRef.current) {
        return;
      }

      // Извлекаем массив треков (адаптируйте под структуру вашего API)
      const tracks = tracksData.data || tracksData.tracks || tracksData;

      // Проверяем что это массив
      if (!Array.isArray(tracks)) {
        throw new Error("Ответ сервера не содержит массив треков");
      }

      // Устанавливаем треки
      setTracks(tracks);
    } catch (error) {
      // Игнорируем AbortError
      if (error instanceof Error && error.name === "AbortError") {
        console.log("Artist tracks request was cancelled");
        return;
      }

      // Проверяем что компонент еще смонтирован
      if (!isMountedRef.current) {
        return;
      }

      let errorMessage = "Неизвестная ошибка";

      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      }

      // Дружелюбные сообщения об ошибках
      if (
        errorMessage.includes("Failed to fetch") ||
        errorMessage.includes("NetworkError")
      ) {
        errorMessage = "Проблема с подключением к серверу";
      } else if (errorMessage.includes("HTTP 404")) {
        errorMessage = "Треки артиста не найдены";
      } else if (errorMessage.includes("HTTP 500")) {
        errorMessage = "Ошибка сервера";
      }

      console.error("Ошибка загрузки треков артиста:", error);
      setError(errorMessage);
      setTracks([]); // Очищаем треки при ошибке
    } finally {
      // Проверяем что компонент еще смонтирован
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  // Функция для повторной загрузки
  const refetch = useCallback(() => {
    if (artistId) {
      loadArtistTracks(artistId);
    }
  }, [artistId, loadArtistTracks]);

  // Эффект для загрузки треков при изменении artistId
  useEffect(() => {
    if (artistId) {
      loadArtistTracks(artistId);
    } else {
      // Если нет ID, сбрасываем состояние
      setTracks([]);
      setLoading(false);
      setError("ID артиста не указан");
    }

    // Cleanup функция
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [artistId, loadArtistTracks]);

  // Cleanup при размонтировании компонента
  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    tracks,
    loading,
    error,
    refetch,
    hasData: tracks.length > 0,
  };
};