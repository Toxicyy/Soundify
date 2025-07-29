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

type MainMenuProps = {
  tracks: Track[];
  isLoading?: boolean;
};

const MainMenu: FC<MainMenuProps> = ({ tracks, isLoading }) => {
  const [searchQuery, setSearchQuery] = useState("");
  
  // Redux selectors
  const { shuffle } = useSelector((state: AppState) => state.queue);
  const currentTrackState = useSelector((state: AppState) => state.currentTrack);
  
  const dispatch = useDispatch<AppDispatch>();

  // Проверяем, принадлежит ли текущий трек к этому плейлисту
  const isCurrentTrackFromThisPlaylist = useMemo(() => {
    if (!currentTrackState.currentTrack) return false;
    
    // Проверяем наличие трека в текущем плейлисте
    return tracks.some(track => track._id === currentTrackState.currentTrack?._id);
  }, [currentTrackState.currentTrack, tracks]);

  // Определяем, должна ли кнопка показывать состояние "играет"
  const isPlaylistPlaying = useMemo(() => {
    return isCurrentTrackFromThisPlaylist && currentTrackState.isPlaying;
  }, [isCurrentTrackFromThisPlaylist, currentTrackState.isPlaying]);

  // Обработчик кнопки shuffle
  const handleShuffle = useCallback(() => {
    dispatch(toggleShuffle());
  }, [dispatch]);

  // Умная логика кнопки плейлиста
  const handlePlaylistPlayPause = useCallback(() => {
    if (isLoading || tracks.length === 0) return;

    if (isCurrentTrackFromThisPlaylist) {
      // Если текущий трек из этого плейлиста - переключаем play/pause
      dispatch(setIsPlaying(!currentTrackState.isPlaying));
    } else {
      // Если текущий трек НЕ из этого плейлиста или ничего не играет
      // Запускаем плейлист с первого трека
      dispatch(playTrackAndQueue({
        contextTracks: tracks,
        startIndex: 0,
      }));
    }
  }, [
    isLoading, 
    tracks.length, 
    isCurrentTrackFromThisPlaylist, 
    currentTrackState.isPlaying, 
    tracks, 
    dispatch
  ]);

  // Фильтрация треков по поисковому запросу
  const filteredTracks = useMemo(() => {
    if (!searchQuery.trim()) {
      return tracks;
    }

    const query = searchQuery.toLowerCase();
    return tracks.filter(
      (track) =>
        track.name.toLowerCase().includes(query) ||
        track.artist.name.toLowerCase().includes(query) ||
        (track.album !== "single" && track.album.name.toLowerCase().includes(query))
    );
  }, [tracks, searchQuery]);

  return (
    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg shadow-2xl w-[100%] h-full flex flex-col">
      <div className="pt-3 px-3 flex-shrink-0">
        {/* Верхняя панель с кнопками управления и поиском */}
        <div className="flex items-center justify-between mb-5 px-3">
          {/* Левая сторона - кнопки воспроизведения и перемешивания */}
          <div className="flex items-center gap-4">
            {/* УМНАЯ КНОПКА ПЛЕЙЛИСТА */}
            <div 
              className="bg-white/40 rounded-full w-[65px] h-[65px] flex items-center justify-center cursor-pointer hover:scale-110 transition-all duration-200" 
              onClick={handlePlaylistPlayPause}
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white" />
              ) : isPlaylistPlaying ? (
                // Показываем pause только если играет трек ИЗ ЭТОГО плейлиста
                <PauseOutlined style={{ fontSize: "40px", color: "white" }} />
              ) : (
                // Показываем play если ничего не играет ИЛИ играет трек из другого плейлиста
                <CaretRightOutlined
                  style={{ fontSize: "42px", color: "white" }}
                  className="ml-[4px]"
                />
              )}
            </div>

            <div>
              <SwapOutlined
                style={{
                  color: shuffle ? "white" : "rgba(255, 255, 255, 0.3)",
                  fontSize: "42px",
                }}
                className="cursor-pointer hover:scale-110 transition-all duration-200"
                onClick={handleShuffle}
              />
            </div>
          </div>

          {/* Правая сторона - поисковая строка */}
          <div className="relative">
            <div className="relative flex items-center">
              <SearchOutlined
                className="absolute left-3 text-lg z-10"
                style={{ color: "white" }}
              />
              <input
                type="text"
                placeholder="Search in liked tracks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="
                  bg-white/10 
                  backdrop-blur-md 
                  border 
                  border-white/20 
                  rounded-full 
                  px-10 
                  py-2 
                  text-white 
                  placeholder-white/40 
                  focus:outline-none 
                  focus:border-white/40 
                  focus:bg-white/15 
                  transition-all 
                  duration-200
                  w-[300px]
                "
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 text-white/40 hover:text-white/60 transition-colors text-xl"
                >
                  ×
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Заголовки таблицы с фиксированной сеткой */}
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

        <div className="h-[2px] w-[100%] bg-white/20"></div>
      </div>

      {/* Скроллируемая область с треками */}
      <div className="flex-1 overflow-hidden">
        <div
          className="h-full overflow-y-auto px-3 pb-2 scrollbar-thin scrollbar-track-white/5 scrollbar-thumb-white/20 hover:scrollbar-thumb-white/30 scrollbar-thumb-rounded-full scrollbar-track-rounded-full"
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
            <div className="flex flex-col items-center justify-center h-40 text-white/60">
              <SearchOutlined className="text-4xl mb-2" />
              <p className="text-lg">No tracks found</p>
              <p className="text-sm">Try changing your search query</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MainMenu;