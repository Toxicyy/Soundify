import { useState } from "react";
import type { Track } from "../types/TrackData";
import { useImagePreloader } from "./useImagePreloader";
import { api } from "../shared/api";

/**
 * Hook for loading user's liked tracks with image preloading
 * Provides methods for adding/removing tracks and refreshing data
 */
export const useLikedTracksLoader = () => {
  const [likedTracks, setLikedTracks] = useState<Track[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [imageSrcs, setImageSrcs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const { allImagesLoaded } = useImagePreloader(imageSrcs);

  const isFullyLoaded = !dataLoading && allImagesLoaded;

  const loadLikedTracks = async (userId: string) => {
    if (!userId) {
      setError("User ID is required");
      setDataLoading(false);
      return;
    }

    setDataLoading(true);
    setError(null);

    try {
      const response = await api.user.getLikedSongs(userId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const tracks = data.data || [];

      setLikedTracks(tracks);

      const allImageSrcs: string[] = [];

      tracks.forEach((track: Track) => {
        if (track.coverUrl) {
          allImageSrcs.push(track.coverUrl);
        }
      });

      const uniqueImageSrcs = [...new Set(allImageSrcs)];
      setImageSrcs(uniqueImageSrcs);
      setDataLoading(false);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Unknown error occurred"
      );
      setDataLoading(false);
    }
  };

  const refreshLikedTracks = async (userId: string) => {
    try {
      const response = await api.user.getLikedSongs(userId);

      if (response.ok) {
        const data = await response.json();
        setLikedTracks(data.data || []);
      }
    } catch (error) {
      // Silent fail on refresh
    }
  };

  const addTrackToLiked = (track: Track) => {
    setLikedTracks((prev) => {
      if (prev.some((t) => t._id === track._id)) {
        return prev;
      }
      return [track, ...prev];
    });
  };

  const removeTrackFromLiked = (trackId: string) => {
    setLikedTracks((prev) => prev.filter((track) => track._id !== trackId));
  };

  const clearLikedTracks = () => {
    setLikedTracks([]);
    setImageSrcs([]);
    setError(null);
  };

  return {
    likedTracks,
    isLoading: !isFullyLoaded,
    dataLoading,
    imagesLoading: !allImagesLoaded,
    error,
    loadLikedTracks,
    refreshLikedTracks,
    addTrackToLiked,
    removeTrackFromLiked,
    clearLikedTracks,
    tracksCount: likedTracks.length,
  };
};
