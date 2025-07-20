import { type FC, memo } from "react";
import type { Track } from "../../types/TrackData";
import type { Album } from "../../types/AlbumData";
import { BaseHeader, HeaderContent } from "../../shared/BaseHeader";

interface AlbumHeaderProps {
  tracks: Track[];
  album: Album;
  isLoading: boolean;
}

/**
 * Album header component displaying album artwork, title, artist, and track count
 * Uses base header components for consistent styling and loading states
 */
const AlbumHeader: FC<AlbumHeaderProps> = ({ tracks, album, isLoading }) => {
  // Generate subtitle with artist and track count information
  const subtitle =
    !isLoading && album.artist ? (
      <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
        <span className="text-white text-base sm:text-lg">
          {typeof album.artist === "string" ? album.artist : album.artist.name}
        </span>
        <div
          className="w-[5px] h-[5px] rounded-full bg-white/60"
          aria-hidden="true"
        />
        <span className="text-white/60 text-base sm:text-lg">
          {tracks.length} {tracks.length === 1 ? "track" : "tracks"}
        </span>
      </div>
    ) : null;

  return (
    <BaseHeader isLoading={isLoading}>
      <HeaderContent
        image={{
          src: album.coverUrl,
          alt: album.name || "Album cover",
          className:
            "w-[120px] h-[120px] lg:w-[12vw] lg:h-[12vw] xl:w-[10vw] xl:h-[10vw] rounded-xl mx-auto sm:mx-0",
        }}
        title={{ text: album.name || "Unknown Album" }}
        subtitle={subtitle}
        isLoading={isLoading}
      />
    </BaseHeader>
  );
};

export default memo(AlbumHeader);
