import { type FC, memo } from "react";
import type { Track } from "../../types/TrackData";
import { useFormatTime } from "../../hooks/useFormatTime";
import { BaseHeader, HeaderContent } from "../../shared/BaseHeader";

interface SingleHeaderProps {
  track: Track;
  isLoading: boolean;
}

/**
 * Header component for single track page
 * Displays track cover, title, artist, and duration
 */
const SingleHeader: FC<SingleHeaderProps> = ({ track, isLoading }) => {
  const formattedDuration = useFormatTime(track?.duration || 0);

  const subtitle =
    !isLoading && track.artist ? (
      <div className="flex items-center gap-2 flex-wrap">
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
          showVerified: false,
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