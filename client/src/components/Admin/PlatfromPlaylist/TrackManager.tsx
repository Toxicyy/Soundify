import React, { useState, useCallback, useMemo, memo } from "react";
import { SearchOutlined } from "@ant-design/icons";
import type { Track } from "../../../types/TrackData";
import { useNotification } from "../../../hooks/useNotification";
import SearchResults from "./SearchResults";
import TrackList from "./TrackList";
import { api } from "../../../shared/api";

interface TrackManagerProps {
  tracks: Track[];
  onTracksChange: (tracks: Track[]) => void;
  isEditing: boolean;
}

interface SearchData {
  tracks: Track[];
  artists: any[];
  albums: any[];
}

/**
 * Track manager with search functionality and track list
 * Handles adding, removing, and reordering tracks in playlist
 */
const TrackManager: React.FC<TrackManagerProps> = ({
  tracks,
  onTracksChange,
  isEditing,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchData>({
    tracks: [],
    artists: [],
    albums: [],
  });
  const [isSearching, setIsSearching] = useState(false);
  const [addingTrackIds, setAddingTrackIds] = useState<Set<string>>(new Set());
  const [searchContext, setSearchContext] = useState<{
    type: "search" | "artist" | "album";
    name?: string;
    id?: string;
  }>({ type: "search" });

  const { showError } = useNotification();

  const searchAPI = useCallback(
    async (query: string): Promise<SearchData> => {
      try {
        const response = await api.search.global(query, { limit: 10 });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return {
          tracks: data.data?.tracks || [],
          artists: data.data?.artists || [],
          albums: data.data?.albums || [],
        };
      } catch (error) {
        showError("Failed to search");
        return { tracks: [], artists: [], albums: [] };
      }
    },
    [showError]
  );

  const debouncedSearch = useMemo(() => {
    let timeout: number;
    return (searchQuery: string) => {
      clearTimeout(timeout);
      timeout = setTimeout(async () => {
        if (!searchQuery.trim()) {
          setSearchResults({ tracks: [], artists: [], albums: [] });
          setSearchContext({ type: "search" });
          return;
        }

        setIsSearching(true);
        setSearchContext({ type: "search" });
        try {
          const results = await searchAPI(searchQuery);
          setSearchResults(results);
        } catch (error) {
          setSearchResults({ tracks: [], artists: [], albums: [] });
        } finally {
          setIsSearching(false);
        }
      }, 500);
    };
  }, [searchAPI]);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const query = e.target.value;
      setSearchQuery(query);

      if (query.trim()) {
        debouncedSearch(query);
      } else {
        setSearchResults({ tracks: [], artists: [], albums: [] });
        setSearchContext({ type: "search" });
        setIsSearching(false);
      }
    },
    [debouncedSearch]
  );

  const handleShowArtistTracks = useCallback(
    async (artistId: string, artistName: string) => {
      try {
        setIsSearching(true);

        const response = await api.artist.getTracks(artistId, { limit: 20 });

        if (!response.ok) throw new Error("Failed to fetch artist tracks");

        const data = await response.json();
        const tracks = data.data?.tracks || data.tracks || data.data || [];

        setSearchResults({
          tracks,
          artists: [],
          albums: [],
        });

        setSearchContext({
          type: "artist",
          name: artistName,
          id: artistId,
        });
      } catch (error) {
        showError("Failed to load artist tracks");
      } finally {
        setIsSearching(false);
      }
    },
    [showError]
  );

  const handleShowAlbumTracks = useCallback(
    async (albumId: string, albumName: string) => {
      try {
        setIsSearching(true);
        const response = await api.album.getTracks(albumId, { limit: 50 });

        if (!response.ok) throw new Error("Failed to fetch album tracks");

        const data = await response.json();
        const tracks = data.data?.tracks || [];

        setSearchResults({
          tracks,
          artists: [],
          albums: [],
        });

        setSearchContext({
          type: "album",
          name: albumName,
          id: albumId,
        });
      } catch (error) {
        showError("Failed to load album tracks");
      } finally {
        setIsSearching(false);
      }
    },
    [showError]
  );

  const handleBackToSearch = useCallback(() => {
    if (searchQuery.trim()) {
      debouncedSearch(searchQuery);
    } else {
      setSearchResults({ tracks: [], artists: [], albums: [] });
      setSearchContext({ type: "search" });
    }
  }, [searchQuery, debouncedSearch]);

  const handleAddTrack = useCallback(
    (track: Track) => {
      const isAlreadyAdded = tracks.some((t) => t._id === track._id);
      if (!isAlreadyAdded) {
        setAddingTrackIds((prev) => new Set(prev).add(track._id));
        onTracksChange([...tracks, track]);

        setTimeout(() => {
          setAddingTrackIds((prev) => {
            const newSet = new Set(prev);
            newSet.delete(track._id);
            return newSet;
          });
        }, 500);
      }
    },
    [tracks, onTracksChange]
  );

  const handleRemoveTrack = useCallback(
    (trackId: string) => {
      onTracksChange(tracks.filter((t) => t._id !== trackId));
    },
    [tracks, onTracksChange]
  );

  const handleTrackReorder = useCallback(
    (fromIndex: number, toIndex: number) => {
      const newTracks = [...tracks];
      const [movedTrack] = newTracks.splice(fromIndex, 1);
      newTracks.splice(toIndex, 0, movedTrack);
      onTracksChange(newTracks);
    },
    [tracks, onTracksChange]
  );

  const isTrackInPlaylist = useCallback(
    (trackId: string) => {
      return tracks.some((t) => t._id === trackId);
    },
    [tracks]
  );

  return (
    <div className="bg-white/10 border border-white/20 rounded-2xl p-6">
      <h2 className="text-xl font-semibold text-white mb-6">
        {isEditing ? "Manage Tracks" : "Playlist Tracks"}
      </h2>

      {/* Search Tracks */}
      {isEditing && (
        <div className="mb-6">
          <div className="relative">
            <SearchOutlined className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/60 text-lg" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search tracks, artists, albums..."
              className="w-full pl-12 pr-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:border-white/40 focus:bg-white/15 transition-all duration-200"
            />
          </div>

          {/* Search Results */}
          {searchQuery && (
            <SearchResults
              searchResults={searchResults}
              isSearching={isSearching}
              searchQuery={searchQuery}
              searchContext={searchContext}
              onAddTrack={handleAddTrack}
              onRemoveTrack={handleRemoveTrack}
              onShowArtistTracks={handleShowArtistTracks}
              onShowAlbumTracks={handleShowAlbumTracks}
              onBackToSearch={handleBackToSearch}
              isTrackInPlaylist={isTrackInPlaylist}
              addingTrackIds={addingTrackIds}
            />
          )}
        </div>
      )}

      {/* Current Tracks */}
      <TrackList
        tracks={tracks}
        isEditing={isEditing}
        onRemoveTrack={handleRemoveTrack}
        onReorderTracks={handleTrackReorder}
      />
    </div>
  );
};

export default memo(TrackManager);
