import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  SearchOutlined,
  PlusOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import type { Track } from "../../../types/TrackData";
import { api } from "../../../shared/api";

interface TrackSearchLocalProps {
  /** Функция для локального добавления трека */
  onAddTrackLocal: (track: Track) => void;
  /** Массив треков уже в плейлисте для проверки дубликатов */
  existingTracks: Track[];
  /** Состояние загрузки плейлиста */
  isPlaylistLoading?: boolean;
}

interface SearchResultItemProps {
  track: Track;
  onAdd: (track: Track) => void;
  isAlreadyInPlaylist: boolean;
  isAdding: boolean;
}

interface SearchApiResponse {
  data: {
    tracks: Track[];
    query: string;
    pagination: {
      currentPage: number;
      totalPages: number;
      totalTracks: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  };
}

/**
 * Компонент элемента результата поиска трека
 */
const SearchResultItem: React.FC<SearchResultItemProps> = ({
  track,
  onAdd,
  isAlreadyInPlaylist,
  isAdding,
}) => {
  const handleAddClick = useCallback(() => {
    if (!isAlreadyInPlaylist && !isAdding) {
      onAdd(track);
    }
  }, [track, onAdd, isAlreadyInPlaylist, isAdding]);

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex items-center gap-3 p-3 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 hover:bg-white/10 transition-all duration-200 group">
      {/* Обложка трека */}
      <div className="flex-shrink-0">
        <img
          src={track.coverUrl || "/default-cover.jpg"}
          alt={track.name}
          className="w-12 h-12 rounded-lg object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = "/default-cover.jpg";
          }}
        />
      </div>

      {/* Информация о треке */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            {/* Название и артист */}
            <div className="mb-1">
              <h4 className="text-white font-medium text-sm truncate">
                {track.name}
              </h4>
              <p className="text-white/70 text-xs truncate">
                {track.artist?.name || "Unknown Artist"}
              </p>
            </div>
          </div>

          {/* Кнопка добавления */}
          <div className="self-end">
            <button
              onClick={handleAddClick}
              disabled={isAlreadyInPlaylist || isAdding}
              className={`
                flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200 text-xs font-medium
                ${
                  isAlreadyInPlaylist
                    ? "bg-green-500/20 text-green-400 cursor-not-allowed"
                    : isAdding
                    ? "bg-blue-500/20 text-blue-400 cursor-not-allowed"
                    : "bg-white/10 text-white hover:bg-white/20 hover:scale-105 active:scale-95"
                }
              `}
              aria-label={
                isAlreadyInPlaylist
                  ? "Already in playlist"
                  : isAdding
                  ? "Adding..."
                  : "Add to playlist"
              }
            >
              {isAdding ? (
                <LoadingOutlined className="text-xs" />
              ) : isAlreadyInPlaylist ? (
                <span className="text-xs">✓</span>
              ) : (
                <PlusOutlined className="text-xs" />
              )}
            </button>
          </div>
        </div>

        {/* Длительность */}
        {track.duration && (
          <div className="text-white/40 text-xs mt-1">
            {formatDuration(track.duration)}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Основной компонент поиска треков с локальным добавлением и динамической высотой
 */
const TrackSearchLocal: React.FC<TrackSearchLocalProps> = ({
  onAddTrackLocal,
  existingTracks,
  isPlaylistLoading = false,
}) => {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [addingTrackIds, setAddingTrackIds] = useState<Set<string>>(new Set());
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);

  // Получаем ID существующих треков для проверки дубликатов
  const existingTrackIds = useMemo(() => {
    return existingTracks.map((track) => track._id);
  }, [existingTracks]);

  // Вычисляем динамическую высоту для результатов поиска
  const calculateSearchResultsHeight = useMemo(() => {
    if (!isSearchExpanded || searchResults.length === 0) return 0;

    // Базовая высота одного элемента результата (примерно 84px с отступами)
    const itemHeight = 88;
    const headerHeight = 16; // padding сверху/снизу
    const maxVisibleItems = Math.min(searchResults.length, 5); // максимум 5 элементов видимых

    return headerHeight + maxVisibleItems * itemHeight;
  }, [isSearchExpanded, searchResults.length]);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        setIsSearchExpanded(false);
        return;
      }

      setIsSearching(true);
      setSearchError(null);

      try {
        const response = await api.track.search(searchQuery, { limit: 10 });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: SearchApiResponse = await response.json();
        setSearchResults(data.data.tracks || []);
        setIsSearchExpanded(true);
      } catch (error) {
        console.error("Search error:", error);
        setSearchError(
          error instanceof Error ? error.message : "Search failed"
        );
        setSearchResults([]);
        setIsSearchExpanded(false);
      } finally {
        setIsSearching(false);
      }
    }, 300),
    []
  );

  // Effect для запуска поиска при изменении query
  useEffect(() => {
    debouncedSearch(query);
  }, [query, debouncedSearch]);

  // Обработка локального добавления трека
  const handleAddTrackLocal = useCallback(
    async (track: Track) => {
      if (addingTrackIds.has(track._id)) return;

      setAddingTrackIds((prev) => new Set(prev).add(track._id));

      try {
        // Добавляем трек локально
        onAddTrackLocal(track);

        // Показываем уведомление
        console.log(`✅ Track "${track.name}" added to playlist locally`);

        // Небольшая задержка для визуального feedback
        setTimeout(() => {
          setAddingTrackIds((prev) => {
            const newSet = new Set(prev);
            newSet.delete(track._id);
            return newSet;
          });
        }, 1000);
      } catch (error) {
        console.error("Error adding track locally:", error);
        setAddingTrackIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(track._id);
          return newSet;
        });
      }
    },
    [onAddTrackLocal, addingTrackIds]
  );

  // Обработка изменения поискового запроса
  const handleQueryChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setQuery(e.target.value);
    },
    []
  );

  // Очистка поиска
  const handleClearSearch = useCallback(() => {
    setQuery("");
    setSearchResults([]);
    setIsSearchExpanded(false);
    setSearchError(null);
  }, []);

  // Обработка фокуса инпута
  const handleInputFocus = useCallback(() => {
    if (searchResults.length > 0) {
      setIsSearchExpanded(true);
    }
  }, [searchResults.length]);

  // Обработка потери фокуса
  const handleInputBlur = useCallback(() => {
    // Небольшая задержка чтобы можно было кликнуть по результатам
    setTimeout(() => {
      setIsSearchExpanded(false);
    }, 200);
  }, []);

  // Проверка, есть ли трек уже в плейлисте
  const isTrackInPlaylist = useMemo(() => {
    return (trackId: string) => existingTrackIds.includes(trackId);
  }, [existingTrackIds]);

  return (
    <div className="mt-6">
      {/* Заголовок секции */}
      <div className="mb-4 px-3">
        <h3 className="text-white font-medium mb-2">Add Tracks</h3>
        <p className="text-white/60 text-sm">
          Search and add tracks to your playlist. Changes will be saved when you
          click Save.
        </p>
      </div>

      {/* Поисковая строка */}
      <div className="px-3 mb-4">
        <div className="relative flex items-center">
          <SearchOutlined
            className="absolute left-4 text-lg z-10"
            style={{ color: "rgba(255, 255, 255, 0.7)" }}
            aria-hidden="true"
          />
          <input
            type="text"
            placeholder="Search tracks to add..."
            value={query}
            onChange={handleQueryChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            disabled={isPlaylistLoading}
            className={`
              w-full 
              bg-white/20  
              border 
              border-white/30 
              rounded-2xl 
              px-12 
              py-3 
              text-white 
              placeholder-white/50 
              focus:outline-none 
              focus:border-white/40 
              focus:bg-white/15 
              transition-all 
              duration-200
              disabled:opacity-50 
              disabled:cursor-not-allowed
              ${isSearching ? "pr-12" : query ? "pr-10" : "pr-4"}
            `}
            aria-label="Search tracks to add to playlist"
          />

          {/* Индикатор загрузки */}
          {isSearching && (
            <div className="absolute right-4">
              <LoadingOutlined className="text-white/60 animate-spin" />
            </div>
          )}

          {/* Кнопка очистки */}
          {!isSearching && query && (
            <button
              onClick={handleClearSearch}
              className="absolute right-4 text-white/40 hover:text-white/60 transition-colors text-xl focus:outline-none"
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Расширяющаяся область с результатами поиска */}
      <div
        className="px-3 transition-all duration-300 ease-in-out tracks-scroll-light"
        style={{
          height:
            isSearchExpanded &&
            (searchResults.length > 0 ||
              searchError ||
              (query.trim() && !isSearching))
              ? `${calculateSearchResultsHeight}px`
              : "0px",
        }}
      >
        <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl shadow-lg">
          {searchError ? (
            <div className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <svg
                  className="w-6 h-6 text-red-400"
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
              <p className="text-red-400 text-sm font-medium">Search Error</p>
              <p className="text-red-400/80 text-xs mt-1">{searchError}</p>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="overflow-y-auto">
              <div className="p-2 space-y-2">
                {searchResults.map((track) => (
                  <SearchResultItem
                    key={track._id}
                    track={track}
                    onAdd={handleAddTrackLocal}
                    isAlreadyInPlaylist={isTrackInPlaylist(track._id)}
                    isAdding={addingTrackIds.has(track._id)}
                  />
                ))}
              </div>

              {/* Индикатор если есть еще результаты */}
              {searchResults.length >= 10 && (
                <div className="px-4 py-2 border-t border-white/10 bg-white/5">
                  <p className="text-white/60 text-xs text-center">
                    Showing first 10 results. Refine your search for more
                    specific results.
                  </p>
                </div>
              )}
            </div>
          ) : query.trim() && !isSearching ? (
            <div className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <svg
                  className="w-6 h-6 text-white/60"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <p className="text-white/80 text-sm font-medium mb-1">
                No Results Found
              </p>
              <p className="text-white/60 text-xs">
                No tracks found for "
                <span className="font-medium">{query}</span>"
              </p>
              <button
                onClick={handleClearSearch}
                className="mt-2 px-3 py-1 bg-white/10 hover:bg-white/20 text-white/80 rounded text-xs transition-colors duration-200"
              >
                Clear search
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {/* Информационная панель снизу */}
      {isSearchExpanded && searchResults.length > 0 && (
        <div className="px-3 mt-4">
          <div className="flex items-center justify-between text-xs text-white/60 bg-white/5 rounded-lg px-3 py-2">
            <span>Found {searchResults.length} tracks</span>
            <span>Click + to add to playlist</span>
          </div>
        </div>
      )}
    </div>
  );
};

// Утилита debounce
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: number;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export default TrackSearchLocal;
