import { type FC, memo } from "react";
import type { Track } from "../../types/TrackData";
import { useFormatTime } from "../../hooks/useFormatTime";
import { BaseHeader, HeaderContent } from "../../shared/BaseHeader";

interface SingleHeaderProps {
  track: Track;
  isLoading: boolean;
}

/**
 * Single track header component displaying track artwork, title, artist, and duration
 * Uses base header components for consistent styling and loading states
 */
const SingleHeader: FC<SingleHeaderProps> = ({ track, isLoading }) => {
  // Format track duration using custom hook
  const formattedDuration = useFormatTime(track?.duration || 0);

  // Generate subtitle with artist and duration information
  const subtitle =
    !isLoading && track.artist ? (
      <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
        <span className="text-white text-base sm:text-lg">
          {typeof track.artist === "string" ? track.artist : track.artist.name}
        </span>
        {track.duration && (
          <>
            <div
              className="w-[5px] h-[5px] rounded-full bg-white/60"
              aria-hidden="true"
            />
            <span className="text-white/60 text-base sm:text-lg">
              {formattedDuration}
            </span>
          </>
        )}
      </div>
    ) : null;

  return (
    <BaseHeader isLoading={isLoading}>
      <HeaderContent
        image={{
          src: track.coverUrl,
          alt: track.name || "Track cover",
          className:
            "w-[120px] h-[120px] sm:w-[8vw] sm:h-[8vw] lg:w-[10vw] lg:h-[10vw] rounded-2xl mx-auto sm:mx-0",
        }}
        badge={{
          show: true,
          text: "Single",
        }}
        title={{ text: track.name || "Unknown Track" }}
        subtitle={subtitle}
        isLoading={isLoading}
      />
    </BaseHeader>
  );
};

export default memo(SingleHeader);
