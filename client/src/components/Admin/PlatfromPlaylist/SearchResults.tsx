import React from "react";
import type { Track } from "../../../types/TrackData";
import SearchResultItem from "./SearchResultItem";
import ArtistResultItem from "./ArtistResultItem";
import AlbumResultItem from "./AlbumResultItem";

interface SearchResultsProps {
  searchResults: {
    tracks: Track[];
    artists: any[];
    albums: any[];
  };
  isSearching: boolean;
  searchQuery: string;
  searchContext: {
    type: "search" | "artist" | "album";
    name?: string;
    id?: string;
  };
  onAddTrack: (track: Track) => void;
  onRemoveTrack: (trackId: string) => void;
  onShowArtistTracks: (artistId: string, artistName: string) => void;
  onShowAlbumTracks: (albumId: string, albumName: string) => void;
  onBackToSearch: () => void;
  isTrackInPlaylist: (trackId: string) => boolean;
  addingTrackIds: Set<string>;
}

const SearchResults: React.FC<SearchResultsProps> = ({
  searchResults,
  isSearching,
  searchQuery,
  searchContext,
  onAddTrack,
  onRemoveTrack,
  onShowArtistTracks,
  onShowAlbumTracks,
  onBackToSearch,
  isTrackInPlaylist,
  addingTrackIds,
}) => {
  return (
    <div className="mt-4 max-h-96 overflow-y-auto space-y-4 queue-scroll">
      {/* Context Header */}
      {searchContext.type !== "search" && (
        <div className="flex items-center justify-between p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
          <div className="flex items-center gap-2">
            <span className="text-blue-400 font-medium">
              {searchContext.type === "artist" ? "👨‍🎤" : "💿"}
              {searchContext.type === "artist" ? "Artist:" : "Album:"}{" "}
              {searchContext.name}
            </span>
          </div>
          <button
            onClick={onBackToSearch}
            className="px-3 py-1 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded-lg text-sm font-medium transition-all duration-200"
          >
            ← Back to Search
          </button>
        </div>
      )}

      {isSearching ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
          <p className="text-white/60 mt-2">Searching...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Tracks Section */}
          {searchResults.tracks.length > 0 && (
            <div>
              <h4 className="text-white font-medium text-sm mb-2 flex items-center gap-2">
                <span>🎵</span>
                {searchContext.type === "artist"
                  ? `Tracks by ${searchContext.name} (${searchResults.tracks.length})`
                  : searchContext.type === "album"
                  ? `Tracks from ${searchContext.name} (${searchResults.tracks.length})`
                  : `Tracks (${searchResults.tracks.length})`}
              </h4>
              <div className="space-y-2">
                {searchResults.tracks.map((track) => (
                  <SearchResultItem
                    key={track._id}
                    track={track}
                    onAdd={onAddTrack}
                    onRemove={onRemoveTrack}
                    isAlreadyInPlaylist={isTrackInPlaylist(track._id)}
                    isAdding={addingTrackIds.has(track._id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Artists Section - Only show in normal search */}
          {searchContext.type === "search" &&
            searchResults.artists.length > 0 && (
              <div>
                <h4 className="text-white font-medium text-sm mb-2 flex items-center gap-2">
                  <span>👨‍🎤</span>
                  Artists ({searchResults.artists.length})
                </h4>
                <div className="space-y-2">
                  {searchResults.artists.map((artist) => (
                    <ArtistResultItem
                      key={artist._id}
                      artist={artist}
                      onShowTracks={(artistId) =>
                        onShowArtistTracks(artistId, artist.name)
                      }
                    />
                  ))}
                </div>
              </div>
            )}

          {/* Albums Section - Only show in normal search */}
          {searchContext.type === "search" &&
            searchResults.albums.length > 0 && (
              <div>
                <h4 className="text-white font-medium text-sm mb-2 flex items-center gap-2">
                  <span>💿</span>
                  Albums ({searchResults.albums.length})
                </h4>
                <div className="space-y-2">
                  {searchResults.albums.map((album) => (
                    <AlbumResultItem
                      key={album._id}
                      album={album}
                      onShowTracks={(albumId) =>
                        onShowAlbumTracks(albumId, album.name)
                      }
                    />
                  ))}
                </div>
              </div>
            )}

          {/* No Results */}
          {searchResults.tracks.length === 0 &&
            (searchContext.type !== "search" ||
              (searchResults.artists.length === 0 &&
                searchResults.albums.length === 0)) && (
              <div className="text-center py-8">
                <p className="text-white/60">
                  {searchContext.type === "artist"
                    ? `No tracks found for ${searchContext.name}`
                    : searchContext.type === "album"
                    ? `No tracks found in ${searchContext.name}`
                    : `No results found for "${searchQuery}"`}
                </p>
              </div>
            )}
        </div>
      )}
    </div>
  );
};

export default SearchResults;
