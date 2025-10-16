import React, { memo, useCallback } from "react";

interface AlbumResultItemProps {
  album: any;
  onShowTracks: (albumId: string) => void;
}

/**
 * Album search result item with cover, name, artist, and track count
 * Used in search results to display album information
 */
const AlbumResultItem: React.FC<AlbumResultItemProps> = ({
  album,
  onShowTracks,
}) => {
  const handleImageError = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      e.currentTarget.src = "/default-cover.jpg";
    },
    []
  );

  const handleClick = useCallback(() => {
    onShowTracks(album._id);
  }, [album._id, onShowTracks]);

  return (
    <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
      <img
        src={album.coverUrl || "/default-cover.jpg"}
        alt={album.name}
        className="w-12 h-12 rounded-lg object-cover"
        onError={handleImageError}
      />
      <div className="flex-1 min-w-0">
        <h4 className="text-white font-medium truncate">{album.name}</h4>
        <p className="text-white/60 text-sm truncate">
          {album.artist?.name} • {album.trackCount || 0} tracks
        </p>
        <p className="text-white/40 text-xs">{album.type || "Album"}</p>
      </div>
      <button
        onClick={handleClick}
        className="px-4 py-2 bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 rounded-lg text-sm font-medium transition-all duration-200"
      >
        Show Tracks
      </button>
    </div>
  );
};

export default memo(AlbumResultItem);
