import { type FC, memo } from "react";
import type { Artist } from "../../types/ArtistData";
import { BaseHeader, HeaderContent } from "../../shared/BaseHeader";

interface ArtistHeaderProps {
  artist: Artist;
  isLoading?: boolean;
}

/**
 * Artist header component displaying avatar, name, verification, and follower count
 * Uses gradient styling for verified artists
 */
const ArtistHeader: FC<ArtistHeaderProps> = ({ artist, isLoading = false }) => {
  const followerCount = artist.followerCount?.toLocaleString() || "0";

  const subtitle = !isLoading ? (
    <span className="text-base sm:text-lg font-medium text-white">
      {followerCount} {artist.followerCount === 1 ? "follower" : "followers"}
    </span>
  ) : null;

  const titleClassName = artist.isVerified
    ? "bg-gradient-to-br from-white via-pink-300 to-purple-400 bg-clip-text text-transparent"
    : "text-white";

  return (
    <BaseHeader isLoading={isLoading}>
      <HeaderContent
        image={{
          src: artist.avatar,
          alt: artist.name || "Artist avatar",
          className:
            "w-[120px] h-[120px] lg:w-[12vw] lg:h-[12vw] xl:w-[10vw] xl:h-[10vw] rounded-full mx-auto sm:mx-0",
        }}
        badge={
          artist.isVerified
            ? {
                show: true,
                text: "Confirmed artist",
                showVerified: true,
              }
            : undefined
        }
        title={{
          text: (
            <span className={titleClassName}>
              {artist.name || "Unknown Artist"}
            </span>
          ),
        }}
        subtitle={subtitle}
        isLoading={isLoading}
      />
    </BaseHeader>
  );
};

export default memo(ArtistHeader);
