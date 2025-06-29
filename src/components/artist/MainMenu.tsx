import type { FC } from "react";
import type { Track } from "../../types/TrackData";
import {
  CaretRightOutlined,
  SwapOutlined,
} from "@ant-design/icons";
import TrackTemplate from "./components/TrackTemplate";

type MainMenuProps = {
  isLoading?: boolean;
  tracks?: Track[];
  tracksError?: string | null;
};

const MainMenu: FC<MainMenuProps> = ({
  isLoading = false,
  tracks = [],
  tracksError = null,
}) => {
  // Если передали треки извне - используем их, иначе показываем скелетоны
  const hasData = tracks.length > 0;

  return (
    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg shadow-2xl w-[100%] h-full flex flex-col">
      <div className="pt-3 px-3 flex-shrink-0">
        {/* Верхняя панель с кнопками управления */}
        <div className="flex items-center justify-between mb-5 px-3">
          <div className="flex items-center gap-4">
            {/* Play/Pause кнопка */}
            {isLoading ? (
              <div className="w-[65px] h-[65px] rounded-full bg-gradient-to-br from-white/15 via-white/25 to-white/10 backdrop-blur-md border border-white/25 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-shimmer"></div>
              </div>
            ) : (
              <div className="bg-white/40 rounded-full w-[65px] h-[65px] flex items-center justify-center cursor-pointer hover:scale-110 transition-all duration-200">
                <CaretRightOutlined
                  style={{ fontSize: "42px", color: "white" }}
                  className="ml-[4px]"
                />
              </div>
            )}

            {/* Shuffle кнопка */}
            {isLoading ? (
              <div className="w-[42px] h-[42px] bg-gradient-to-r from-white/10 via-white/20 to-white/10 backdrop-blur-md border border-white/20 rounded-lg relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-shimmer-delayed"></div>
              </div>
            ) : (
              <SwapOutlined
                style={{
                  color: "rgba(255, 255, 255, 0.3)",
                  fontSize: "42px",
                }}
                className="cursor-pointer hover:scale-110 transition-all duration-200"
              />
            )}

            {/* Кнопка подписаться */}
            {isLoading ? (
              <div className="h-10 w-32 bg-gradient-to-r from-white/10 via-white/20 to-white/10 backdrop-blur-md border border-white/20 rounded-full relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-shimmer-delayed-2"></div>
              </div>
            ) : (
              <button className="bg-transparent border-2 border-white/60 rounded-full px-4 py-2 text-white hover:scale-105 transition-all duration-200">
                Подписаться
              </button>
            )}
          </div>
        </div>

        {/* Секция треков */}
        <div className="px-3 py-5">
          {/* Заголовок */}
          {isLoading ? (
            <div className="mb-6">
              <div className="h-8 w-64 bg-gradient-to-r from-white/15 via-white/25 to-white/15 backdrop-blur-md border border-white/25 rounded-lg relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/35 to-transparent -skew-x-12 animate-shimmer"></div>
              </div>
            </div>
          ) : (
            <h1 className="text-white text-3xl font-bold mb-6">
              Популярные треки
            </h1>
          )}

          {/* Список треков с ПРАВИЛЬНОЙ логикой */}
          <div className="space-y-2">
            {isLoading ? (
              // Во время загрузки ВСЕГДА показываем скелетоны
              Array.from({ length: 5 }).map((_, index) => (
                <TrackTemplate
                  key={`skeleton-${index}`}
                  track={{} as any}
                  isLoading={true}
                  allTracks={[]}
                  index={index}
                />
              ))
            ) : tracksError ? (
              // ТОЛЬКО после загрузки показываем ошибку
              <div className="text-center py-8">
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
                <h3 className="text-white font-semibold mb-2">
                  Ошибка загрузки треков
                </h3>
                <p className="text-white/70 text-sm mb-4">{tracksError}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors duration-200"
                >
                  Попробовать снова
                </button>
              </div>
            ) : !hasData ? (
              // ТОЛЬКО после загрузки показываем пустое состояние
              <div className="text-center py-8">
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
                      d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                    />
                  </svg>
                </div>
                <h3 className="text-white/80 font-medium mb-2">
                  Треки не найдены
                </h3>
                <p className="text-white/60 text-sm">
                  У этого артиста пока нет треков
                </p>
              </div>
            ) : (
              // Показываем реальные треки
              tracks.map((track, index) => (
                <TrackTemplate
                  key={track._id}
                  track={track}
                  isLoading={false}
                  allTracks={tracks}
                  index={index}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainMenu;
