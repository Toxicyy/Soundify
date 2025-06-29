import { useState } from "react";
import { useImagePreloader } from "./useImagePreloader";
import type { Artist } from "../types/ArtistData";
import type { Track } from "../types/TrackData";

export const useDailyArtistsDataLoader = () => {
  const [dailyTracks, setDailyTracks] = useState<
    { artist: Artist; tracks: Track[] }[]
  >([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [imageSrcs, setImageSrcs] = useState<string[]>([]);

  const { allImagesLoaded } = useImagePreloader(imageSrcs);

  // Общее состояние загрузки - данные + изображения
  const isFullyLoaded = !dataLoading && allImagesLoaded;

  const loadArtistsData = async () => {
    setDataLoading(true);

    try {
      // Ваша функция загрузки данных
      const getArtistsTrack = async (slug: string) => {
        const artistResponse = await fetch(
          `http://localhost:5000/api/artists/slug/${slug}`
        );
        const artistData = await artistResponse.json();
        const trackResponse = await fetch(
          `http://localhost:5000/api/artists/${artistData.data._id}/tracks`
        );
        const trackData = await trackResponse.json();
        return {
          artist: artistData.data,
          tracks: trackData.data,
        };
      };

      const dailyArtist1 = getArtistsTrack("kai-angel");
      const dailyArtist2 = getArtistsTrack("9mice");
      const results = await Promise.all([dailyArtist1, dailyArtist2]);

      setDailyTracks(results);

      // Собираем все URL изображений для предзагрузки
      const allImageSrcs: string[] = [];

      results.forEach((artistData) => {
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

      setImageSrcs(allImageSrcs);
      setDataLoading(false);
    } catch (error) {
      console.error("Ошибка загрузки данных:", error);
      setDataLoading(false);
    }
  };

  return {
    dailyTracks,
    isLoading: !isFullyLoaded, 
    loadArtistsData,
  };
};
