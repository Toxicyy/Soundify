import { useState } from "react";
import { api } from "../shared/api";
import { useImagePreloader } from "./useImagePreloader";
import type { Artist } from "../types/ArtistData";
import type { Track } from "../types/TrackData";
import type { Playlist } from "../types/Playlist";

interface DailyData {
  artistsData: { artist: Artist; tracks: Track[] }[];
  featuredPlaylist: Playlist | null;
}

export const useDailyContentLoader = () => {
  const [dailyContent, setDailyContent] = useState<DailyData>({
    artistsData: [],
    featuredPlaylist: null,
  });
  const [dataLoading, setDataLoading] = useState(true);
  const [imageSrcs, setImageSrcs] = useState<string[]>([]);

  const { allImagesLoaded } = useImagePreloader(imageSrcs);

  // Общее состояние загрузки - данные + изображения
  const isFullyLoaded = !dataLoading && allImagesLoaded;

  const loadDailyContent = async () => {
    setDataLoading(true);

    try {
      // Функция загрузки данных артистов
      const getArtistsTrack = async (slug: string) => {
        const artistResponse = await api.artist.getBySlug(slug);
        const artistData = await artistResponse.json();

        const trackResponse = await api.artist.getTracks(artistData.data._id);
        const trackData = await trackResponse.json();

        return {
          artist: artistData.data,
          tracks: trackData.data,
        };
      };

      // Функция получения последнего платформенного плейлиста
      const getLatestFeaturedPlaylist = async () => {
        // Используем существующий роут /playlists/featured
        const response = await api.playlist.getFeatured({limit: 1});
        
        if (!response.ok) {
          throw new Error("Failed to fetch featured playlist");
        }

        const data = await response.json();
        return data.data?.[0] || null; // Берем первый плейлист из списка
      };

      // Загружаем все данные параллельно
      const [artist1Data, artist2Data, featuredPlaylist] = await Promise.all([
        getArtistsTrack("kai-angel"),
        getArtistsTrack("9mice"),
        getLatestFeaturedPlaylist(),
      ]);

      const artistsData = [artist1Data, artist2Data];

      setDailyContent({
        artistsData,
        featuredPlaylist,
      });

      // Собираем все URL изображений для предзагрузки
      const allImageSrcs: string[] = [];

      // Изображения артистов и их треков
      artistsData.forEach((artistData) => {
        // Аватар артиста
        if (artistData.artist.avatar) {
          allImageSrcs.push(artistData.artist.avatar);
        }

        // Обложки треков (берем первые 2 трека каждого артиста)
        artistData.tracks.slice(0, 2).forEach((track: Track) => {
          if (track.coverUrl) {
            allImageSrcs.push(track.coverUrl);
          }
        });
      });

      // Обложка платформенного плейлиста
      if (featuredPlaylist?.coverUrl) {
        allImageSrcs.push(featuredPlaylist.coverUrl);
      }

      setImageSrcs(allImageSrcs);
      setDataLoading(false);
    } catch (error) {
      console.error("Ошибка загрузки данных:", error);
      setDataLoading(false);
    }
  };

  return {
    dailyTracks: dailyContent.artistsData,
    featuredPlaylist: dailyContent.featuredPlaylist,
    isLoading: !isFullyLoaded,
    loadDailyContent,
  };
};