import type { FC } from "react";
import type { Track } from "../../../types/TrackData";
import TrackTemplate from "./TrackTemplate";

type TracksListProps = {
  isLoading?: boolean;
  tracks?: Track[];
  tracksError?: string | null;
};

const TracksList: FC<TracksListProps> = ({
  isLoading = false,
  tracks = [],
  tracksError = null,
}) => {
  const hasData = tracks.length > 0;

  return (
    <div className="flex flex-col h-full">
      {/* Заголовок */}
      {isLoading ? (
        <div className="mb-6 flex-shrink-0">
          <div className="h-8 w-64 bg-gradient-to-r from-white/15 via-white/25 to-white/15 backdrop-blur-md border border-white/25 rounded-lg relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/35 to-transparent -skew-x-12 animate-shimmer"></div>
          </div>
        </div>
      ) : (
        <h1 className="text-white text-3xl font-bold mb-6 flex-shrink-0">
          Popular Tracks
        </h1>
      )}

      {/* Скроллируемая область треков */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full tracks-scroll-light pr-2">
          <div className="h-[2px] w-full bg-white/20"></div>
          <div className="space-y-2">
            {isLoading ? (
              // Во время загрузки показываем скелетоны
              Array.from({ length: 8 }).map((_, index) => (
                <TrackTemplate
                  key={`skeleton-${index}`}
                  track={{} as any}
                  isLoading={true}
                  allTracks={[]}
                  index={index}
                />
              ))
            ) : tracksError ? (
              // Показываем ошибку
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
              // Показываем пустое состояние
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
          <div className="h-[2px] w-full bg-white/20"></div>
      </div>
    </div>
  );
};

export default TracksList;
