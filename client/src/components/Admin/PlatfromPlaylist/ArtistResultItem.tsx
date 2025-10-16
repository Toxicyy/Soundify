import React, { memo, useCallback } from "react";

interface ArtistResultItemProps {
  artist: any;
  onShowTracks: (artistId: string) => void;
}

/**
 * Artist search result item with avatar, name, and follower count
 * Used in search results to display artist information
 */
const ArtistResultItem: React.FC<ArtistResultItemProps> = ({
  artist,
  onShowTracks,
}) => {
  const handleImageError = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      e.currentTarget.src = "/default-avatar.jpg";
    },
    []
  );

  const handleClick = useCallback(() => {
    onShowTracks(artist._id);
  }, [artist._id, onShowTracks]);

  return (
    <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
      <img
        src={artist.avatar || "/default-avatar.jpg"}
        alt={artist.name}
        className="w-12 h-12 rounded-full object-cover"
        onError={handleImageError}
      />
      <div className="flex-1 min-w-0">
        <h4 className="text-white font-medium truncate">{artist.name}</h4>
        <p className="text-white/60 text-sm">
          {artist.trackCount || 0} tracks • {artist.followerCount || 0}{" "}
          followers
        </p>
      </div>
      <button
        onClick={handleClick}
        className="px-4 py-2 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded-lg text-sm font-medium transition-all duration-200"
      >
        Show Tracks
      </button>
    </div>
  );
};

export default memo(ArtistResultItem);
