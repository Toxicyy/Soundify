import {
  CaretRightOutlined,
  ClockCircleOutlined,
  PauseOutlined,
  SwapOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import type { Track } from "../../types/TrackData";
import { useState, useMemo, type FC } from "react";
import TrackTemplate from "./components/TrackTemplate";

type MainMenuProps = {
  tracks: Track[];
  loading: boolean;
};

const MainMenu: FC<MainMenuProps> = ({ tracks, loading }) => {
  const currentTrack = { isPlaying: false };
  const [shuffle, setShuffle] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleShuffle = () => {
    setShuffle(!shuffle);
  };

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
        (track.album && track.album.toLowerCase().includes(query))
    );
  }, [tracks, searchQuery]);

  return (
    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg shadow-2xl w-[100%] h-full flex flex-col">
      <div className="pt-3 px-3 flex-shrink-0">
        {/* Верхняя панель с кнопками управления и поиском */}
        <div className="flex items-center justify-between mb-5">
          {/* Левая сторона - кнопки воспроизведения и перемешивания */}
          <div className="flex items-center gap-4">
            <div className="bg-white/40 rounded-full w-[65px] h-[65px] flex items-center justify-center cursor-pointer hover:scale-110 transition-all duration-200">
              {loading ? (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white" />
              ) : currentTrack.isPlaying ? (
                <PauseOutlined style={{ fontSize: "40px", color: "white" }} />
              ) : (
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
              <SearchOutlined className="absolute left-3 text-lg z-10" style={{ color:"white" }}/>
              <input
                type="text"
                placeholder="Поиск в любимых треках..."
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
        <div className="grid grid-cols-[50px_1.47fr_1.57fr_0.8fr_50px_80px_52px] gap-4 items-center px-4 mb-2">
          <h1 className="text-white/50 text-xl text-center">#</h1>
          <h1 className="text-white/50 text-xl">Название</h1>
          <h1 className="text-white/50 text-xl text-center">Альбом</h1>
          <h1 className="text-white/50 text-xl text-center">Дата добавления</h1>
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
          className="h-full overflow-y-auto px-3 pb-3 scrollbar-thin scrollbar-track-white/5 scrollbar-thumb-white/20 hover:scrollbar-thumb-white/30 scrollbar-thumb-rounded-full scrollbar-track-rounded-full"
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
                isLoading={loading}
              />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-white/60">
              <SearchOutlined className="text-4xl mb-2" />
              <p className="text-lg">Треки не найдены</p>
              <p className="text-sm">Попробуйте изменить поисковый запрос</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MainMenu;
