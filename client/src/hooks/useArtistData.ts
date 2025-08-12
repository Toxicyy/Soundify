import { useState, useEffect, useRef } from "react";
import { api } from "../shared/api";
import type { Artist } from "../types/ArtistData";

interface UseArtistDataReturn {
  data: Artist | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useArtistData = (artistId: string): UseArtistDataReturn => {
  const [data, setData] = useState<Artist | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);

  // Функция для загрузки данных
  const loadArtistData = async (id: string) => {
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
      const response = await api.artist.getById(id);

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

      const artistData = await response.json();

      // Проверка структуры ответа
      if (!artistData || typeof artistData !== "object") {
        throw new Error("Неверный формат данных от сервера");
      }

      // Проверяем что компонент еще смонтирован
      if (!isMountedRef.current) {
        return;
      }

      // Устанавливаем данные
      setData(artistData.data || artistData);
    } catch (error) {
      // Игнорируем AbortError
      if (error instanceof Error && error.name === "AbortError") {
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
        errorMessage = "Артист не найден";
      } else if (errorMessage.includes("HTTP 500")) {
        errorMessage = "Ошибка сервера";
      }

      console.error("Ошибка загрузки данных артиста:", error);
      setError(errorMessage);
    } finally {
      // Проверяем что компонент еще смонтирован
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  // Функция для повторной загрузки
  const refetch = () => {
    if (artistId) {
      loadArtistData(artistId);
    }
  };

  // Эффект для загрузки данных при изменении artistId
  useEffect(() => {
    if (artistId) {
      loadArtistData(artistId);
    } else {
      // Если нет ID, сбрасываем состояние
      setData(null);
      setLoading(false);
    }

    // Cleanup функция
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [artistId]); // Зависимость от artistId

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
    data,
    loading,
    error,
    refetch,
  };
};
