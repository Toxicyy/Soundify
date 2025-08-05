import {
  CaretRightOutlined,
  ClockCircleOutlined,
  PauseOutlined,
  SwapOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import type { Track } from "../../types/TrackData";
import { useState, useMemo, type FC, useCallback } from "react";
import TrackTemplate from "./components/TrackTemplate";
import { playTrackAndQueue, toggleShuffle } from "../../state/Queue.slice";
import { setIsPlaying } from "../../state/CurrentTrack.slice";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, AppState } from "../../store";

/**
 * Props для MainMenu компонента
 */
interface MainMenuProps {
  /** Массив треков для отображения */
  tracks: Track[];
  /** Флаг загрузки данных */
  isLoading?: boolean;
}

/**
 * Главный компонент для отображения списка любимых треков
 * Включает поиск, управление воспроизведением и адаптивную таблицу треков
 *
 * Features:
 * - Умная кнопка воспроизведения (play/pause based on context)
 * - Поиск по треку, артисту и альбому
 * - Shuffle функционал
 * - Адаптивный дизайн для всех устройств
 * - Skeleton loading состояния
 */
const MainMenu: FC<MainMenuProps> = ({ tracks, isLoading = false }) => {
  // Локальные состояния
  const [searchQuery, setSearchQuery] = useState("");

  // Redux селекторы
  const { shuffle } = useSelector((state: AppState) => state.queue);
  const currentTrackState = useSelector(
    (state: AppState) => state.currentTrack
  );

  const dispatch = useDispatch<AppDispatch>();

  /**
   * Проверяет, принадлежит ли текущий трек к этому плейлисту
   */
  const isCurrentTrackFromThisPlaylist = useMemo(() => {
    if (!currentTrackState.currentTrack) return false;

    return tracks.some(
      (track) => track._id === currentTrackState.currentTrack?._id
    );
  }, [currentTrackState.currentTrack, tracks]);

  /**
   * Определяет, должна ли кнопка показывать состояние "играет"
   */
  const isPlaylistPlaying = useMemo(() => {
    return isCurrentTrackFromThisPlaylist && currentTrackState.isPlaying;
  }, [isCurrentTrackFromThisPlaylist, currentTrackState.isPlaying]);

  /**
   * Обработчик кнопки shuffle
   */
  const handleShuffle = useCallback(() => {
    dispatch(toggleShuffle());
  }, [dispatch]);

  /**
   * Умная логика кнопки плейлиста
   * - Если играет трек из этого плейлиста: переключает play/pause
   * - Если играет другой трек или ничего не играет: запускает плейлист
   */
  const handlePlaylistPlayPause = useCallback(() => {
    if (isLoading || tracks.length === 0) return;

    if (isCurrentTrackFromThisPlaylist) {
      // Переключаем play/pause для текущего трека из плейлиста
      dispatch(setIsPlaying(!currentTrackState.isPlaying));
    } else {
      // Запускаем плейлист с первого трека
      dispatch(
        playTrackAndQueue({
          contextTracks: tracks,
          startIndex: 0,
        })
      );
    }
  }, [
    isLoading,
    tracks.length,
    isCurrentTrackFromThisPlaylist,
    currentTrackState.isPlaying,
    tracks,
    dispatch,
  ]);

  /**
   * Фильтрация треков по поисковому запросу
   * Поиск осуществляется по названию трека, артисту и альбому
   */
  const filteredTracks = useMemo(() => {
    if (!searchQuery.trim()) {
      return tracks;
    }

    const query = searchQuery.toLowerCase();
    return tracks.filter(
      (track) =>
        track.name.toLowerCase().includes(query) ||
        track.artist.name.toLowerCase().includes(query) ||
        (track.album !== "single" &&
          track.album.name.toLowerCase().includes(query))
    );
  }, [tracks, searchQuery]);

  /**
   * Очищает поисковый запрос
   */
  const clearSearch = useCallback(() => {
    setSearchQuery("");
  }, []);

  /**
   * Рендерит кнопку воспроизведения с правильной иконкой
   */
  const renderPlayButton = () => {
    if (isLoading) {
      return (
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white" />
      );
    }

    if (isPlaylistPlaying) {
      return (
        <PauseOutlined
          style={{
            fontSize: window.innerWidth < 768 ? "24px" : "40px",
            color: "white",
          }}
        />
      );
    }

    return (
      <CaretRightOutlined
        style={{
          fontSize: window.innerWidth < 768 ? "26px" : "42px",
          color: "white",
        }}
        className={window.innerWidth < 768 ? "ml-[2px]" : "ml-[4px]"}
      />
    );
  };

  return (
    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg md:rounded-xl shadow-2xl w-full h-full flex flex-col">
      {/* Control Panel */}
      <div className="pt-2 md:pt-3 px-2 md:px-3 flex-shrink-0">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-3 md:mb-5 px-2 md:px-3 gap-3 md:gap-4">
          {/* Left side - Play controls */}
          <div className="flex items-center gap-2 md:gap-4 order-2 md:order-1">
            {/* Smart Play Button */}
            <button
              className={`bg-white/40 rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-all duration-200 ${
                window.innerWidth < 768 ? "w-12 h-12" : "w-[65px] h-[65px]"
              }`}
              onClick={handlePlaylistPlayPause}
              disabled={isLoading}
            >
              {renderPlayButton()}
            </button>

            {/* Shuffle Button */}
            <button
              onClick={handleShuffle}
              className="cursor-pointer hover:scale-110 transition-all duration-200"
              disabled={isLoading}
            >
              <SwapOutlined
                style={{
                  color: shuffle ? "white" : "rgba(255, 255, 255, 0.3)",
                  fontSize: window.innerWidth < 768 ? "24px" : "42px",
                }}
              />
            </button>
          </div>

          {/* Right side - Search */}
          <div className="relative order-1 md:order-2 w-full md:w-auto">
            <div className="relative flex items-center">
              <SearchOutlined
                className={`absolute left-3 z-10 ${
                  window.innerWidth < 768 ? "text-base" : "text-lg"
                }`}
                style={{ color: "white" }}
              />
              <input
                type="text"
                placeholder={
                  window.innerWidth < 768
                    ? "Search tracks..."
                    : "Search in liked tracks..."
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="
    bg-white/8
    md:bg-white/10 
    md:backdrop-blur-md 
    border 
    border-white/20 
    rounded-full 
    px-8 md:px-10 
    py-2 
    text-white 
    placeholder-white/40 
    focus:outline-none 
    focus:border-white/40 
    focus:bg-white/12
    md:focus:bg-white/15
    transition-all 
    duration-200
    w-full md:w-[300px] 
    text-sm md:text-base
  "
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 text-white/40 hover:text-white/60 transition-colors text-lg md:text-xl"
                >
                  ×
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Table Headers - Desktop Only */}
        <div className="hidden xl:block">
          <div className="grid grid-cols-[50px_1.47fr_1.57fr_0.8fr_50px_80px_50px] gap-4 items-center px-4 mb-2">
            <h1 className="text-white/50 text-xl text-center">#</h1>
            <h1 className="text-white/50 text-xl">Title</h1>
            <h1 className="text-white/50 text-xl text-center">Album</h1>
            <h1 className="text-white/50 text-xl text-center">Date added</h1>
            <div className="text-white/50 text-xl text-center"></div>
            <div className="text-white/50 text-xl text-center">
              <ClockCircleOutlined />
            </div>
            <div className="text-white/50 text-xl text-center"></div>
          </div>
          <div className="h-[2px] w-full bg-white/20"></div>
        </div>

        {/* Mobile Table Headers */}
        <div className="block xl:hidden">
          <div className="flex items-center justify-between px-3 mb-2 text-white/50">
            <span className="text-sm font-medium">Track</span>
            <span className="text-sm font-medium">Duration</span>
          </div>
          <div className="h-[1px] w-full bg-white/20"></div>
        </div>
      </div>

      {/* Scrollable Track List */}
      <div className="flex-1 overflow-hidden">
        <div
          className="h-full overflow-y-auto px-2 md:px-3 pb-2 scrollbar-thin scrollbar-track-white/5 scrollbar-thumb-white/20 hover:scrollbar-thumb-white/30 scrollbar-thumb-rounded-full scrollbar-track-rounded-full"
          style={{
            scrollbarWidth: "thin",
            scrollbarColor:
              "rgba(255, 255, 255, 0.2) rgba(255, 255, 255, 0.05)",
          }}
        >
          {filteredTracks.length > 0 ? (
            filteredTracks.map((track, index) => (
              <TrackTemplate
                key={track._id || index}
                track={track}
                index={index}
                isLoading={isLoading}
                allTracks={filteredTracks}
              />
            ))
          ) : (
            /* Empty State */
            <div className="flex flex-col items-center justify-center h-40 text-white/60">
              <SearchOutlined className="text-3xl md:text-4xl mb-2" />
              <p className="text-base md:text-lg font-medium">
                No tracks found
              </p>
              <p className="text-xs md:text-sm mt-1">
                Try changing your search query
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MainMenu;
