import { useState, useCallback } from "react";
import { api } from "../shared/api";
import type { Artist } from "../types/ArtistData";
import type { Track } from "../types/TrackData";
import type { Playlist } from "../types/Playlist";
import { useImagePreloader } from "./useImagePreloader";

interface DailyData {
  artistsData: { artist: Artist; tracks: Track[] }[];
  featuredPlaylist: Playlist | null;
}

/**
 * Hook for loading daily content (featured artists and playlists)
 * Preloads all images before marking content as ready
 */
export const useDailyContentLoader = () => {
  const [dailyContent, setDailyContent] = useState<DailyData>({
    artistsData: [],
    featuredPlaylist: null,
  });
  const [dataLoading, setDataLoading] = useState(true);
  const [imageSrcs, setImageSrcs] = useState<string[]>([]);

  const { allImagesLoaded } = useImagePreloader(imageSrcs);

  const isFullyLoaded = !dataLoading && allImagesLoaded;

  const loadDailyContent = useCallback(async () => {
    setDataLoading(true);

    try {
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

      const getLatestFeaturedPlaylist = async () => {
        const response = await api.playlist.getFeatured({ limit: 1 });

        if (!response.ok) {
          throw new Error("Failed to fetch featured playlist");
        }

        const data = await response.json();
        return data.data?.[0] || null;
      };

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

      const allImageSrcs: string[] = [];

      artistsData.forEach((artistData) => {
        if (artistData.artist.avatar) {
          allImageSrcs.push(artistData.artist.avatar);
        }

        artistData.tracks.slice(0, 2).forEach((track: Track) => {
          if (track.coverUrl) {
            allImageSrcs.push(track.coverUrl);
          }
        });
      });

      if (featuredPlaylist?.coverUrl) {
        allImageSrcs.push(featuredPlaylist.coverUrl);
      }

      setImageSrcs(allImageSrcs);
      setDataLoading(false);
    } catch (error) {
      setDataLoading(false);
    }
  }, []);

  return {
    dailyTracks: dailyContent.artistsData,
    featuredPlaylist: dailyContent.featuredPlaylist,
    isLoading: !isFullyLoaded,
    loadDailyContent,
  };
};