import { useLocation } from "react-router-dom";
import Header from "../components/artist/Header";
import MainMenu from "../components/artist/MainMenu";
import type { Artist } from "../types/ArtistData";
import { useArtistData } from "../hooks/useArtistData";
import { useArtistTracks } from "../hooks/useArtistTracks";
import { useImagePreloader } from "../hooks/useImagePreloader";

export default function Artist() {
  const location = useLocation();
  const artistId = location.pathname.split("/artist/")[1];
  const {
    data: artist,
    loading: artistLoading,
    error: artistError,
    refetch: refetchArtist,
  } = useArtistData(artistId || "");

  const {
    tracks,
    loading: tracksLoading,
    error: tracksError,
  } = useArtistTracks(artist?._id || "");

  // Собираем все изображения для предзагрузки
  const imagesToPreload = [
    artist?.avatar,
    ...tracks.map((track) => track.coverUrl),
  ].filter(Boolean) as string[];

  const { allImagesLoaded } = useImagePreloader(imagesToPreload);

  // Определяем общее состояние загрузки
  const isDataLoading = artistLoading || tracksLoading;
  const isImagesLoading = !allImagesLoaded && imagesToPreload.length > 0;
  const isOverallLoading = isDataLoading || isImagesLoading;

  // ВАЖНО: Показываем скелетоны если ЧТО-ТО еще загружается
  if (isOverallLoading) {
    return (
      <div className="h-screen w-full mainMenu pl-[22vw] pr-[2vw] flex flex-col gap-5">
        <Header artist={{} as Artist} isLoading={true} />
        <MainMenu isLoading={true} artist={{} as Artist} />
      </div>
    );
  }

  // ТОЛЬКО после полной загрузки проверяем ошибки
  if (artistError) {
    return (
      <div className="h-screen w-full mainMenu pl-[22vw] pr-[2vw] flex items-center justify-center">
        <div className="flex flex-col items-center gap-6 text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
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

          <div>
            <h2 className="text-white text-xl font-semibold mb-2">
              {artistError.includes("не найден")
                ? "Артист не найден"
                : "Ошибка загрузки"}
            </h2>
            <p className="text-white/70 text-sm mb-1">
              {artistError.includes("не найден")
                ? `Артист с ID "${artistId}" не существует или был удален`
                : artistError}
            </p>
            <p className="text-white/50 text-xs">
              Проверьте правильность ссылки или попробуйте найти артиста через
              поиск
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={refetchArtist}
              className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors duration-200 flex items-center gap-2"
            >
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
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Попробовать снова
            </button>

            <button
              onClick={() => window.history.back()}
              className="px-6 py-2 bg-white/5 hover:bg-white/10 text-white/70 rounded-lg transition-colors duration-200"
            >
              Назад
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ТОЛЬКО после полной загрузки проверяем отсутствие артиста
  if (!artist) {
    return (
      <div className="h-screen w-full mainMenu pl-[22vw] pr-[2vw] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="text-white/60 text-lg">Данные артиста недоступны</div>
          <button
            onClick={refetchArtist}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors duration-200"
          >
            Обновить
          </button>
        </div>
      </div>
    );
  }

  // Основное содержимое - ВСЁ загружено (данные + изображения)
  return (
    <div className="w-full pl-[22vw] pr-[2vw] flex flex-col gap-5">
      <Header artist={artist} isLoading={false} />
      <MainMenu
        isLoading={false}
        tracks={tracks}
        tracksError={tracksError}
        artist={artist}
      />
    </div>
  );
}
