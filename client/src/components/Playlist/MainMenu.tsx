import { useCallback, type FC, memo } from "react";
import type { Playlist } from "../../types/Playlist";
import type { Track } from "../../types/TrackData";
import DraggableTracksList from "./components/DraggableTracksList";
import TrackSearchLocal from "./components/TrackSearchLocal";

interface MainMenuProps {
  /** Current playlist data */
  playlist: Playlist | null;
  /** Loading state indicator */
  isLoading?: boolean;
  /** Function to update local playlist state */
  updateLocal: (updates: Partial<Playlist>) => void;
  /** Whether there are unsaved changes */
  hasUnsavedChanges: boolean;
  /** Array of tracks to display */
  tracks?: Track[];
  /** Error message if track loading failed */
  tracksError?: string | null;
  /** Whether the playlist is in edit mode */
  isEditable?: boolean;
}

/**
 * Playlist main menu component with drag & drop tracks, local track management, and search
 * Provides comprehensive playlist editing and interaction functionality
 */
const MainMenu: FC<MainMenuProps> = ({
  playlist,
  isLoading = false,
  updateLocal,
  hasUnsavedChanges,
  tracks = [],
  tracksError = null,
  isEditable = true, // По умолчанию включаем редактирование
}) => {
  /**
   * Локальное добавление трека в плейлист
   */
  const handleAddTrackLocal = useCallback(
    (track: Track) => {
      if (!playlist) return;
      // Проверяем, нет ли уже такого трека в плейлисте
      const isAlreadyInPlaylist = tracks.some(
        (existingTrack) => existingTrack._id === track._id
      );

      if (isAlreadyInPlaylist) {
        console.warn(`Track "${track.name}" is already in the playlist`);
        return;
      }

      // Добавляем трек в конец списка
      const newTracks = [...tracks, track];

      // Обновляем локальное состояние плейлиста
      updateLocal({
        tracks: newTracks as Track[] | string[], // Приводим к нужному типу
        trackCount: newTracks.length,
        // Можно также обновить общую длительность плейлиста
        totalDuration: newTracks.reduce(
          (total, t) => total + (t.duration || 0),
          0
        ),
      });

      console.log(`✅ Track "${track.name}" added to playlist locally`);
    },
    [playlist, tracks, updateLocal]
  );

  // Показываем индикатор изменений
  const renderUnsavedChangesIndicator = () => {
    if (!hasUnsavedChanges) return null;

    return (
      <div className="px-6 py-3 mb-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
            <span className="text-yellow-400 font-medium text-sm">
              Unsaved Changes
            </span>
          </div>
          <div className="text-white/60 text-sm">
            {tracks.length} tracks • Don't forget to save your changes
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-[62.9vh] w-full bg-white/10 rounded-3xl border border-white/20 overflow-hidden">
      {/* Индикатор несохраненных изменений */}
      {renderUnsavedChangesIndicator()}

      {/* Основной список треков с drag & drop */}
      <DraggableTracksList
        tracks={tracks}
        isLoading={isLoading}
        tracksError={tracksError}
        isEditable={isEditable}
        updateLocal={updateLocal}
        playlist={playlist}
      />

      {/* Поиск и добавление треков (только в режиме редактирования) */}
      {isEditable && (
        <div className="border-t border-white/10 pt-4 pb-6">
          <TrackSearchLocal
            onAddTrackLocal={handleAddTrackLocal}
            existingTracks={tracks}
            isPlaylistLoading={isLoading}
          />
        </div>
      )}

      {/* Информация о плейлисте внизу */}
      {playlist && (
        <div className="px-6 py-4 border-t border-white/10 bg-white/5">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4 text-white/60">
              <span>{tracks.length} tracks</span>
              {playlist.totalDuration && (
                <span>{Math.floor(playlist.totalDuration / 60)} minutes</span>
              )}
              {playlist.privacy && (
                <span className="capitalize">{playlist.privacy}</span>
              )}
            </div>

            {hasUnsavedChanges && (
              <div className="flex items-center gap-2 text-yellow-400">
                <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full"></div>
                <span className="text-xs">Changes pending</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default memo(MainMenu);
