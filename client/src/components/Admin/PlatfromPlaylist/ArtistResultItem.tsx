import React from "react";

interface ArtistResultItemProps {
  artist: any;
  onShowTracks: (artistId: string) => void;
}

const ArtistResultItem: React.FC<ArtistResultItemProps> = ({
  artist,
  onShowTracks,
}) => {
  return (
    <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
      <img
        src={artist.avatar || "/default-avatar.jpg"}
        alt={artist.name}
        className="w-12 h-12 rounded-full object-cover"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.src = "/default-avatar.jpg";
        }}
      />
      <div className="flex-1 min-w-0">
        <h4 className="text-white font-medium truncate">{artist.name}</h4>
        <p className="text-white/60 text-sm">
          {artist.trackCount || 0} tracks • {artist.followerCount || 0} followers
        </p>
      </div>
      <button
        onClick={() => onShowTracks(artist._id)}
        className="px-4 py-2 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded-lg text-sm font-medium transition-all duration-200"
      >
        Show Tracks
      </button>
    </div>
  );
};

export default ArtistResultItem;