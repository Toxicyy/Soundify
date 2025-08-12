import React, { useState, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { playTrackAndQueue, toggleShuffle } from "../../../state/Queue.slice";
import { setIsPlaying } from "../../../state/CurrentTrack.slice";
import type { AppDispatch, AppState } from "../../../store";
import type { Track } from "../../../types/TrackData";
import type { Playlist } from "../../../types/Playlist";
import DraggableTrackTemplate from "./DraggableTrackTemplate";
import {
  CaretRightOutlined,
  PauseOutlined,
  SearchOutlined,
  SwapOutlined,
} from "@ant-design/icons";

interface DraggableTracksListProps {
  /** Array of tracks to display */
  tracks: Track[];
  /** Loading state indicator */
  isLoading?: boolean;
  /** Error message if tracks loading failed */
  tracksError?: string | null;
  /** Whether the playlist is editable by current user */
  isEditable?: boolean;
  /** Function to update local playlist state */
  updateLocal?: (updates: Partial<Playlist>) => void;
  /** Current playlist data */
  playlist?: Playlist | null;
  /** Callback for removing a track from playlist */
  onRemoveTrack?: (trackId: string) => void;
  /** Callback for reordering tracks */
  onReorderTracks?: (newTracks: Track[]) => void;
}

/**
 * Enhanced draggable tracks list component with permissions and callbacks
 *
 * Features:
 * - Role-based editing permissions
 * - Drag & drop reordering with callbacks
 * - Track removal with confirmation
 * - Comprehensive error handling
 * - Responsive design with accessibility
 */
const DraggableTracksList: React.FC<DraggableTracksListProps> = ({
  tracks,
  isLoading = false,
  tracksError = null,
  isEditable = false,
  updateLocal,
  onRemoveTrack,
  onReorderTracks,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const currentTrackState = useSelector(
    (state: AppState) => state.currentTrack
  );
  const { shuffle } = useSelector((state: AppState) => state.queue);

  const [searchQuery, setSearchQuery] = useState("");
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Отфильтрованные треки
  const filteredTracks = useMemo(() => {
    if (!searchQuery.trim()) {
      return tracks;
    }

    const query = searchQuery.toLowerCase();
    return tracks.filter((track) => {
      const trackName = track.name?.toLowerCase() || "";
      const artistName = track.artist?.name?.toLowerCase() || "";
      return trackName.includes(query) || artistName.includes(query);
    });
  }, [tracks, searchQuery]);

  const hasData = filteredTracks.length > 0;

  // Проверяем, играет ли сейчас трек из этого плейлиста
  const isCurrentTrackFromThisPlaylist = useMemo(() => {
    if (!currentTrackState.currentTrack) return false;
    return tracks.some(
      (track) => track._id === currentTrackState.currentTrack?._id
    );
  }, [currentTrackState.currentTrack, tracks]);

  const isPlaylistPlaying = useMemo(() => {
    return isCurrentTrackFromThisPlaylist && currentTrackState.isPlaying;
  }, [isCurrentTrackFromThisPlaylist, currentTrackState.isPlaying]);

  /**
   * Обработка перетаскивания треков с callback
   */
  const handleDragStart = useCallback((index: number) => {
    setIsDragging(true);
    setDragOverIndex(index);
  }, []);

  const handleDragEnd = useCallback(
    (fromIndex: number, toIndex: number) => {
      setIsDragging(false);
      setDragOverIndex(null);

      if (fromIndex === toIndex || !isEditable) return;

      // Создаем новый массив треков с измененным порядком
      const newTracks = [...tracks];
      const [movedTrack] = newTracks.splice(fromIndex, 1);
      newTracks.splice(toIndex, 0, movedTrack);

      // Вызываем callback для уведомления родительского компонента
      if (onReorderTracks) {
        onReorderTracks(newTracks);
      } else if (updateLocal) {
        // Fallback к старому способу если callback не предоставлен
        updateLocal({
          tracks: newTracks as Track[] | string[],
          trackCount: newTracks.length,
        });
      }

    },
    [tracks, updateLocal, onReorderTracks, isEditable]
  );

  /**
   * Удаление трека из плейлиста с callback
   */
  const handleRemoveTrack = useCallback(
    (trackId: string) => {
      if (!isEditable) return;

      // Используем callback если предоставлен
      if (onRemoveTrack) {
        onRemoveTrack(trackId);
      } else if (updateLocal) {
        // Fallback к старому способу
        const newTracks = tracks.filter((track) => track._id !== trackId);
        updateLocal({
          tracks: newTracks as Track[] | string[],
          trackCount: newTracks.length,
        });
      }

    },
    [tracks, updateLocal, onRemoveTrack, isEditable]
  );

  /**
   * Обработка воспроизведения плейлиста
   */
  const handlePlaylistPlayPause = useCallback(() => {
    if (isLoading || filteredTracks.length === 0) return;

    if (isCurrentTrackFromThisPlaylist) {
      dispatch(setIsPlaying(!currentTrackState.isPlaying));
    } else {
      dispatch(
        playTrackAndQueue({
          contextTracks: filteredTracks,
          startIndex: 0,
        })
      );
    }
  }, [
    isLoading,
    filteredTracks,
    isCurrentTrackFromThisPlaylist,
    currentTrackState.isPlaying,
    dispatch,
  ]);

  /**
   * Переключение режима shuffle
   */
  const handleShuffle = useCallback(() => {
    dispatch(toggleShuffle());
  }, [dispatch]);

  /**
   * Очистка поиска
   */
  const handleClearSearch = useCallback(() => {
    setSearchQuery("");
  }, []);

  // Обработка DragOver для контейнера
  const handleContainerDragOver = useCallback(
    (e: React.DragEvent) => {
      if (!isEditable) return;
      e.preventDefault();

      const rect = e.currentTarget.getBoundingClientRect();
      const y = e.clientY - rect.top;
      const trackElements =
        e.currentTarget.querySelectorAll("[data-track-index]");

      let closestIndex = 0;
      let closestDistance = Infinity;

      trackElements.forEach((element, index) => {
        const elementRect = element.getBoundingClientRect();
        const elementY = elementRect.top + elementRect.height / 2 - rect.top;
        const distance = Math.abs(y - elementY);

        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      });

      setDragOverIndex(closestIndex);
    },
    [isEditable]
  );

  /**
   * Рендер скелетонов для загрузки
   */
  const renderSkeletons = () =>
    Array.from({ length: 8 }).map((_, index) => (
      <DraggableTrackTemplate
        key={`skeleton-${index}`}
        track={{} as Track}
        index={index}
        isLoading={true}
        allTracks={[]}
        isEditable={false}
      />
    ));

  /**
   * Рендер ошибки
   */
  const renderError = () => (
    <div className="text-center py-8" role="alert">
      <div className="w-16 h-16 mx-auto rounded-full bg-red-500/20 flex items-center justify-center mb-3">
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
      <h3 className="text-white font-semibold mb-2">Failed to load tracks</h3>
      <p className="text-white/70 text-sm mb-4">{tracksError}</p>
      <button
        onClick={() => window.location.reload()}
        className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors duration-200"
      >
        Try again
      </button>
    </div>
  );

  /**
   * Рендер пустого состояния
   */
  const renderEmptyState = () => {
    const isSearchEmpty = searchQuery.trim() && filteredTracks.length === 0;

    return (
      <div className="text-center py-8" role="status">
        <div className="w-16 h-16 mx-auto rounded-full bg-white/10 flex items-center justify-center mb-3">
          <svg
            className="w-8 h-8 text-white/60"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d={
                isSearchEmpty
                  ? "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  : "M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
              }
            />
          </svg>
        </div>
        <h3 className="text-white/80 font-medium mb-2">
          {isSearchEmpty ? "No results found" : "No tracks found"}
        </h3>
        <p className="text-white/60 text-sm">
          {isSearchEmpty
            ? `No tracks match "${searchQuery}"`
            : "This playlist doesn't have any tracks yet"}
        </p>
        {isSearchEmpty && (
          <button
            onClick={handleClearSearch}
            className="mt-3 px-4 py-2 bg-white/10 hover:bg-white/20 text-white/80 rounded-lg transition-colors duration-200"
          >
            Clear search
          </button>
        )}
      </div>
    );
  };

  /**
   * Рендер панели управления
   */
  const renderControlPanel = () => (
    <div className="pt-3 px-3 flex-shrink-0">
      <div className="flex items-center justify-between mb-5 px-3 gap-4 flex-col sm:flex-row">
        {/* Элементы управления воспроизведением */}
        <div className="flex items-center gap-4 order-2 sm:order-1">
          <button
            className="bg-white/40 rounded-full w-[65px] h-[65px] flex items-center justify-center cursor-pointer hover:scale-110 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            onClick={handlePlaylistPlayPause}
            disabled={isLoading || !hasData}
            aria-label={isPlaylistPlaying ? "Pause" : "Play"}
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white" />
            ) : isPlaylistPlaying ? (
              <PauseOutlined style={{ fontSize: "40px", color: "white" }} />
            ) : (
              <CaretRightOutlined
                style={{ fontSize: "42px", color: "white" }}
                className="ml-[4px]"
              />
            )}
          </button>

          <button
            className="cursor-pointer hover:scale-110 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 rounded-full p-1"
            onClick={handleShuffle}
            disabled={isLoading || filteredTracks.length === 0}
            aria-label={shuffle ? "Disable shuffle" : "Enable shuffle"}
          >
            <SwapOutlined
              style={{
                color: shuffle ? "white" : "rgba(255, 255, 255, 0.3)",
                fontSize: "42px",
              }}
            />
          </button>
        </div>

        {/* Поиск */}
        <div className="relative order-1 sm:order-2 w-full sm:w-auto">
          <div className="relative flex items-center">
            <SearchOutlined
              className="absolute left-3 text-lg z-10"
              style={{ color: "white" }}
            />
            <input
              type="text"
              placeholder="Search tracks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white/20 border border-white/30 rounded-full px-10 py-2 text-white placeholder-white/40 focus:outline-none focus:border-white/40 focus:bg-white/15 transition-all duration-200 w-full sm:w-[300px]"
            />
            {searchQuery && (
              <button
                onClick={handleClearSearch}
                className="absolute right-3 text-white/40 hover:text-white/60 transition-colors text-xl"
              >
                ×
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col pb-10">
      {renderControlPanel()}

      {/* Информация о редактируемом режиме */}
      {isEditable && hasData && (
        <div className="px-6 mb-4">
          <div className="flex items-center gap-2 text-white/60 text-sm">
            <div className="w-1 h-4 bg-white/30 rounded-full"></div>
            <span>
              Drag tracks to reorder • Changes will be saved when you click Save
            </span>
          </div>
        </div>
      )}

      {/* Список треков */}
      <div className="space-y-2 mt-2 px-3" onDragOver={handleContainerDragOver}>
        {isLoading
          ? renderSkeletons()
          : tracksError
          ? renderError()
          : filteredTracks.length === 0
          ? renderEmptyState()
          : filteredTracks.map((track, index) => (
              <DraggableTrackTemplate
                key={index}
                track={track}
                index={index}
                allTracks={filteredTracks}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onRemove={handleRemoveTrack}
                isEditable={isEditable}
                isDragging={isDragging}
                dragOverIndex={dragOverIndex}
              />
            ))}
      </div>
    </div>
  );
};

export default DraggableTracksList;
