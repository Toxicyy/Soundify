import React, { useCallback, memo } from "react";
import { LoadingOutlined } from "@ant-design/icons";
import type { Track } from "../../../types/TrackData";

interface SearchResultItemProps {
  track: Track;
  onAdd: (track: Track) => void;
  onRemove: (trackId: string) => void;
  isAlreadyInPlaylist: boolean;
  isAdding: boolean;
}

/**
 * Track search result item with add/remove functionality
 * Shows track cover, name, artist, and duration
 */
const SearchResultItem: React.FC<SearchResultItemProps> = ({
  track,
  onAdd,
  onRemove,
  isAlreadyInPlaylist,
  isAdding,
}) => {
  const handleButtonClick = useCallback(() => {
    if (!isAdding) {
      if (isAlreadyInPlaylist) {
        onRemove(track._id);
      } else {
        onAdd(track);
      }
    }
  }, [track, onAdd, onRemove, isAlreadyInPlaylist, isAdding]);

  const formatDuration = useCallback((seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  }, []);

  const handleImageError = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      e.currentTarget.src = "/default-cover.jpg";
    },
    []
  );

  return (
    <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
      <img
        src={track.coverUrl}
        alt={track.name}
        className="w-12 h-12 rounded-lg object-cover"
        onError={handleImageError}
      />
      <div className="flex-1 min-w-0">
        <h4 className="text-white font-medium truncate">{track.name}</h4>
        <p className="text-white/60 text-sm truncate">{track.artist.name}</p>
        {track.duration && (
          <p className="text-white/40 text-xs">
            {formatDuration(track.duration)}
          </p>
        )}
      </div>
      <button
        onClick={handleButtonClick}
        disabled={isAdding}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
          isAlreadyInPlaylist
            ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
            : isAdding
            ? "bg-blue-500/20 text-blue-400 cursor-not-allowed"
            : "bg-emerald-500 hover:bg-emerald-600 text-white"
        }`}
      >
        {isAdding ? (
          <LoadingOutlined className="animate-spin" />
        ) : isAlreadyInPlaylist ? (
          "Remove"
        ) : (
          "Add"
        )}
      </button>
    </div>
  );
};

export default memo(SearchResultItem);
