import { useParams } from "react-router-dom";
import { useCallback, useEffect, useMemo, useRef } from "react";
import Header from "../components/Playlist/Header";
import { usePlaylist } from "../hooks/usePlaylist";
import { usePlaylistTracks } from "../hooks/usePlaylistTracks";
import { usePlaylistSave } from "../hooks/usePlaylistSave";
import MainMenu from "../components/Playlist/MainMenu";
import type { Track } from "../types/TrackData";

export default function Playlist() {
  const { id } = useParams<{ id: string }>();

  // Refs для предотвращения циклических обновлений
  const isSyncingRef = useRef(false);
  const lastSyncDataRef = useRef<string>("");

  // Основной хук для управления плейлистом
  const {
    playlist,
    hasUnsavedChanges,
    loading: playlistLoading,
    error: playlistError,
    updateLocal,
    fetchPlaylist,
    switchUnsavedChangesToFalse,
  } = usePlaylist(id);

  // Хук для получения треков плейлиста
  const {
    tracks,
    isLoading: tracksLoading,
    error: tracksError,
    refetch: refetchTracks,
  } = usePlaylistTracks(id || "", {
    page: 1,
    limit: 100,
    sortBy: "playlistOrder", // ✅ Используем порядок плейлиста
    sortOrder: 1,
  });

  // Хук для сохранения изменений
  const { saveChanges, saving } = usePlaylistSave(id || "");

  // ✅ Мемоизируем общие состояния
  const isLoading = useMemo(
    () => playlistLoading || tracksLoading,
    [playlistLoading, tracksLoading]
  );
  const error = useMemo(
    () => playlistError || tracksError,
    [playlistError, tracksError]
  );

  /**
   * ✅ Получаем актуальные треки как массив Track[]
   * Приоритет: локальные изменения > API треки
   */
  const getTracksAsArray = useCallback((): Track[] => {
    // Если есть локальные изменения в плейлисте с треками
    if (playlist?.tracks && hasUnsavedChanges) {
      if (Array.isArray(playlist.tracks) && playlist.tracks.length > 0) {
        const firstItem = playlist.tracks[0];
        if (
          typeof firstItem === "object" &&
          firstItem !== null &&
          "_id" in firstItem
        ) {
          return playlist.tracks as Track[];
        }
      }
    }

    // Используем треки из API
    return tracks;
  }, [playlist?.tracks, tracks, hasUnsavedChanges]);

  /**
   * ✅ Мемоизированные актуальные треки
   */
  const currentTracks = useMemo(() => getTracksAsArray(), [getTracksAsArray]);

  /**
   * ✅ Оптимизированная синхронизация без циклических обновлений
   */
  const syncTracksWithPlaylist = useCallback(() => {
    // Предотвращаем циклические вызовы
    if (isSyncingRef.current) return;

    // Проверяем наличие данных
    if (!tracks.length || !playlist || hasUnsavedChanges) return;

    // Создаем хеш текущего состояния для сравнения
    const currentDataHash = JSON.stringify({
      tracksLength: tracks.length,
      playlistTracksLength: playlist.tracks?.length || 0,
      playlistTrackCount: playlist.trackCount || 0,
    });

    // Если данные не изменились, пропускаем синхронизацию
    if (lastSyncDataRef.current === currentDataHash) return;

    // Проверяем необходимость синхронизации
    const needsSync =
      !playlist.tracks ||
      playlist.tracks.length !== tracks.length ||
      playlist.trackCount !== tracks.length;

    if (!needsSync) return;

    console.log("🔄 Syncing tracks with playlist state");

    isSyncingRef.current = true;
    lastSyncDataRef.current = currentDataHash;

    // Обновляем локальное состояние
    updateLocal({
      tracks: tracks,
      trackCount: tracks.length,
      totalDuration: tracks.reduce(
        (total, track) => total + (track.duration || 0),
        0
      ),
    });

    // Сбрасываем флаг синхронизации
    setTimeout(() => {
      isSyncingRef.current = false;
    }, 100);
  }, [tracks, playlist, hasUnsavedChanges, updateLocal]);

  /**
   * ✅ Эффект синхронизации с защитой от циклических вызовов
   */
  useEffect(() => {
    // Небольшая задержка для стабилизации состояния
    const timeoutId = setTimeout(() => {
      syncTracksWithPlaylist();
    }, 50);

    return () => clearTimeout(timeoutId);
  }, [tracks.length, playlist?.trackCount, hasUnsavedChanges]); // ✅ Минимальные зависимости

  /**
   * ✅ Оптимизированное сохранение плейлиста
   */
  const handleSavePlaylist = useCallback(async () => {
    if (!playlist || !hasUnsavedChanges) return;

    try {
      console.log("💾 Starting playlist save process");

      // Получаем актуальные треки на момент сохранения
      const tracksToSave = getTracksAsArray();

      // Подготавливаем данные для сохранения (только основные поля)
      const updateData = {
        name: playlist.name,
        description: playlist.description,
        privacy: playlist.privacy,
        category: playlist.category,
        tags: playlist.tags,
      };

      // Сохраняем основные данные плейлиста
      await saveChanges(updateData);

      // Если есть треки для сохранения, обновляем их порядок
      if (tracksToSave && tracksToSave.length > 0) {
        const trackIds = tracksToSave.map((track) => track._id);
        console.log("💾 Saving track order:", trackIds.length, "tracks");

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
              skipValidation: true,
            }),
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to save track order: ${response.status}`);
        }

        console.log("✅ Track order saved successfully");
      }

      // Сбрасываем флаг несохраненных изменений
      switchUnsavedChangesToFalse();

      // Обновляем данные из API
      await Promise.all([fetchPlaylist(id!), refetchTracks()]);

      console.log("✅ Playlist saved successfully");
    } catch (error) {
      console.error("❌ Error saving playlist:", error);
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
    getTracksAsArray,
    id,
    switchUnsavedChangesToFalse,
    fetchPlaylist,
    refetchTracks,
  ]);

  /**
   * ✅ Мемоизированная функция обновления данных
   */
  const handleRefetch = useCallback(() => {
    if (!id) return;

    console.log("🔄 Refetching playlist data");
    Promise.all([fetchPlaylist(id), refetchTracks()]).then(() => {
      // Сбрасываем состояние синхронизации
      isSyncingRef.current = false;
      lastSyncDataRef.current = "";
      console.log("✅ Playlist data refreshed");
    });
  }, [id, fetchPlaylist, refetchTracks]);

  /**
   * ✅ Обработка отмены изменений
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

  // ✅ Мемоизированные компоненты для предотвращения ненужных ререндеров
  const headerComponent = useMemo(
    () => (
      <Header
        playlist={playlist}
        isLoading={isLoading}
        updateLocal={updateLocal}
        fetchPlaylist={fetchPlaylist}
      />
    ),
    [playlist, isLoading, updateLocal, fetchPlaylist]
  );

  const mainMenuComponent = useMemo(
    () => (
      <MainMenu
        playlist={playlist}
        isLoading={isLoading || saving}
        updateLocal={updateLocal}
        hasUnsavedChanges={hasUnsavedChanges}
        tracks={currentTracks}
        tracksError={tracksError}
      />
    ),
    [
      playlist,
      isLoading,
      saving,
      updateLocal,
      hasUnsavedChanges,
      currentTracks,
      tracksError,
    ]
  );

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
      {headerComponent}
      {mainMenuComponent}

      {/* ✅ Мемоизированная кнопка сохранения */}
      {hasUnsavedChanges && (
        <div className="fixed bottom-8 right-8 z-50">
          <div className="flex items-center gap-3">
            <button
              onClick={handleDiscardChanges}
              className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 rounded-lg transition-all duration-200 text-sm font-medium"
            >
              Discard
            </button>

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
