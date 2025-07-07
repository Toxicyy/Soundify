import { useParams } from "react-router-dom";
import { useCallback, useEffect } from "react";
import Header from "../components/Playlist/Header";
import { usePlaylist } from "../hooks/usePlaylist";
import { usePlaylistTracks } from "../hooks/usePlaylistTracks";
import { usePlaylistSave } from "../hooks/usePlaylistSave";
import MainMenu from "../components/Playlist/MainMenu";
import type { Track } from "../types/TrackData";

export default function Playlist() {
  const { id } = useParams<{ id: string }>();

  // Основной хук для управления плейлистом
  const {
    playlist,
    hasUnsavedChanges,
    loading: playlistLoading,
    error: playlistError,
    updateLocal,
    fetchPlaylist,
  } = usePlaylist(id);

  // Хук для получения треков плейлиста
  const {
    tracks,
    isLoading: tracksLoading,
    error: tracksError,
    refetch: refetchTracks,
  } = usePlaylistTracks(id || "", {
    page: 1,
    limit: 100, // Увеличиваем лимит для работы с drag & drop
    sortBy: "createdAt",
    sortOrder: -1,
  });

  // Хук для сохранения изменений
  const { saveChanges, saving } = usePlaylistSave(id || "");

  // Общие состояния
  const isLoading = playlistLoading || tracksLoading;
  const error = playlistError || tracksError;

  // Синхронизация локальных треков с полученными из API
  useEffect(() => {
    if (tracks.length > 0 && playlist && !hasUnsavedChanges) {
      // Обновляем локальное состояние только если нет несохраненных изменений
      updateLocal({
        tracks: tracks, // tracks уже является Track[]
        trackCount: tracks.length,
        totalDuration: tracks.reduce(
          (total, track) => total + (track.duration || 0),
          0
        ),
      });
    }
  }, [tracks, playlist, hasUnsavedChanges, updateLocal]);

  /**
   * Получаем треки как массив Track[] независимо от того, как они хранятся в плейлисте
   */
  const getTracksAsArray = useCallback((): Track[] => {
    if (!playlist?.tracks) return tracks;

    // Если tracks в плейлисте это массив Track[], возвращаем его
    if (Array.isArray(playlist.tracks) && playlist.tracks.length > 0) {
      // Проверяем первый элемент, чтобы определить тип
      const firstItem = playlist.tracks[0];
      if (
        typeof firstItem === "object" &&
        firstItem !== null &&
        "_id" in firstItem
      ) {
        return playlist.tracks as Track[];
      }
    }

    // Иначе используем треки из хука usePlaylistTracks
    return tracks;
  }, [playlist?.tracks, tracks]);

  /**
   * Сохранение всех изменений плейлиста
   */
  const handleSavePlaylist = useCallback(async () => {
    if (!playlist || !hasUnsavedChanges) return;

    try {
      // Подготавливаем данные для сохранения (только основные поля, без треков)
      const updateData = {
        name: playlist.name,
        description: playlist.description,
        privacy: playlist.privacy,
        category: playlist.category,
        tags: playlist.tags,
      };

      // Сохраняем основные данные плейлиста
      await saveChanges(updateData);

      // Если изменились треки, сохраняем их порядок
      const currentTracks = getTracksAsArray();
      if (currentTracks && currentTracks.length > 0) {
        const trackIds = currentTracks.map((track) => track._id);

        try {
          const token = localStorage.getItem("token");
          const response = await fetch(
            `http://localhost:5000/api/playlists/${id}/tracks/order`,
            {
              method: "PUT",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ 
                trackIds,
                skipValidation: true
              }),
            }
          );

          if (!response.ok) {
            throw new Error(`Failed to save track order: ${response.status}`);
          }
        } catch (orderError) {
          console.error("Error saving track order:", orderError);
          alert("Failed to save track order. Please try again.");
          return;
        }
      }
    } catch (error) {
      console.error("Error saving playlist:", error);
      alert(
        `Save failed: ${
          error instanceof Error ? error.message : "Failed to save playlist"
        }`
      );
    }
  }, [
    playlist,
    hasUnsavedChanges,
    saveChanges,
    id,
    refetchTracks,
    fetchPlaylist,
    getTracksAsArray,
  ]);

  /**
   * Функция для обновления после изменений
   */
  const handleRefetch = useCallback(() => {
    if (id) {
      fetchPlaylist(id);
      refetchTracks();
    }
  }, [id, fetchPlaylist, refetchTracks]);

  /**
   * Обработка отмены изменений
   */
  const handleDiscardChanges = useCallback(() => {
    const confirmDiscard = window.confirm(
      "Are you sure you want to discard all changes? This action cannot be undone."
    );

    if (confirmDiscard) {
      handleRefetch();
      console.log(
        "📝 Changes discarded - all unsaved changes have been reverted"
      );
    }
  }, [handleRefetch]);

  // Обработка ошибок
  if (error) {
    return (
      <div className="h-screen w-full mainMenu pl-[22vw] pr-[2vw] flex items-center justify-center">
        <div className="text-center bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
          <div className="w-16 h-16 mx-auto rounded-full bg-red-500/20 flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Something went wrong
          </h2>
          <p className="text-white/70 mb-6">{error}</p>
          <button
            onClick={handleRefetch}
            className="px-6 py-3 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors duration-200"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full mainMenu pl-[22vw] pr-[2vw] flex flex-col gap-5">
      <Header
        playlist={playlist}
        isLoading={isLoading}
        updateLocal={updateLocal}
        fetchPlaylist={fetchPlaylist}
      />

      <MainMenu
        playlist={playlist}
        isLoading={isLoading || saving}
        updateLocal={updateLocal}
        hasUnsavedChanges={hasUnsavedChanges}
        tracks={getTracksAsArray()} // Используем функцию для получения Track[]
        tracksError={tracksError}
      />

      {/* Floating Action Button для быстрого сохранения */}
      {hasUnsavedChanges && (
        <div className="fixed bottom-8 right-8 z-50">
          <div className="flex items-center gap-3">
            {/* Кнопка отмены */}
            <button
              onClick={handleDiscardChanges}
              className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 rounded-lg transition-all duration-200 text-sm font-medium"
            >
              Discard
            </button>

            {/* Кнопка сохранения */}
            <button
              onClick={handleSavePlaylist}
              disabled={saving}
              className="px-6 py-3 bg-green-500 hover:bg-green-600 disabled:bg-green-500/50 text-white rounded-lg transition-all duration-200 font-medium shadow-lg hover:shadow-xl disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Saving...
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
