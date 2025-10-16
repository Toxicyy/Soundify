import { type FC, memo, useCallback, useMemo } from "react";
import type { Album } from "../../../types/AlbumData";
import { Link } from "react-router-dom";

interface AlbumTemplateProps {
  album: Album;
  index: number;
  isLoading?: boolean;
}

/**
 * Album card displaying cover, title, and metadata
 * Shows "Latest release" for first album, otherwise shows year
 */
const AlbumTemplate: FC<AlbumTemplateProps> = ({
  album,
  index,
  isLoading = false,
}) => {
  const getYearFromDate = useCallback((date: string | Date) => {
    try {
      const dateObj = typeof date === "string" ? new Date(date) : date;
      return dateObj.getFullYear();
    } catch {
      return new Date().getFullYear();
    }
  }, []);

  const displayText = useMemo(() => {
    if (index === 0) {
      return "Latest release";
    }

    if (album.createdAt) {
      return getYearFromDate(album.createdAt);
    }

    return "Album";
  }, [index, album.createdAt, getYearFromDate]);

  const handleImageError = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      e.currentTarget.style.display = "none";
    },
    []
  );

  if (isLoading) {
    return (
      <div
        className="max-w-[140px] sm:max-w-[165px] animate-pulse"
        role="listitem"
      >
        <div className="w-[140px] h-[140px] sm:w-[160px] sm:h-[160px] bg-gradient-to-br from-white/10 via-white/20 to-white/5 border border-white/20 rounded-lg relative overflow-hidden mb-2">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-shimmer"></div>
        </div>

        <div className="h-4 sm:h-5 w-24 sm:w-32 bg-gradient-to-r from-white/10 via-white/20 to-white/10 border border-white/20 rounded-md relative overflow-hidden mb-1">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-shimmer-delayed"></div>
        </div>

        <div className="h-3 w-20 bg-gradient-to-r from-white/8 via-white/15 to-white/8 border border-white/15 rounded-md relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -skew-x-12 animate-shimmer-delayed-2"></div>
        </div>
      </div>
    );
  }

  return (
    <article
      className="max-w-[140px] sm:max-w-[165px] hover:scale-105 transition-all duration-300 group"
      role="listitem"
    >
      <Link
        to={`/album/${album._id}`}
        className="block focus:outline-none focus:ring-2 focus:ring-white/20 rounded-lg"
        aria-label={`View album ${album.name}`}
      >
        <div className="relative overflow-hidden rounded-lg">
          <img
            src={album.coverUrl}
            alt={`${album.name} album cover`}
            className="w-[140px] h-[140px] sm:w-[160px] sm:h-[160px] mb-1 rounded-lg cursor-pointer object-cover transition-transform duration-300 group-hover:scale-105"
            onError={handleImageError}
            loading="lazy"
          />

          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 rounded-lg" />
        </div>
      </Link>

      <Link
        to={`/album/${album._id}`}
        className="block focus:outline-none focus:ring-2 focus:ring-white/20 rounded"
      >
        <h3 className="text-sm sm:text-lg text-white truncate cursor-pointer hover:underline transition-colors duration-200 mb-1">
          {album.name || "Unknown Album"}
        </h3>
      </Link>

      <div className="flex items-center text-white/60 gap-2 text-xs sm:text-sm">
        <span className="truncate">{displayText}</span>

        <div
          className="w-[4px] h-[4px] sm:w-[5px] sm:h-[5px] bg-white/70 rounded-full flex-shrink-0"
          aria-hidden="true"
        />

        <span className="flex-shrink-0">Album</span>
      </div>

      <div className="sr-only">
        {album.artist && (
          <span>
            by{" "}
            {typeof album.artist === "string"
              ? album.artist
              : album.artist.name}
          </span>
        )}
        {album.genre && album.genre.length > 0 && (
          <span>, Genre: {album.genre.join(", ")}</span>
        )}
      </div>
    </article>
  );
};

export default memo(AlbumTemplate);
