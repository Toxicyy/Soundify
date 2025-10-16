import { type FC, memo } from "react";
import { BaseHeader, HeaderContent } from "../../shared/BaseHeader";

interface ProfileHeaderProps {
  imageSrc: string;
  username: string;
  isLoading: boolean;
  playlists: string[];
  likedArtists: string[];
}

/**
 * Profile header component
 * Displays user avatar, username, and profile statistics
 */
const Header: FC<ProfileHeaderProps> = ({
  imageSrc,
  username,
  isLoading,
  playlists,
  likedArtists,
}) => {
  const subtitle = `${playlists.length} ${
    playlists.length === 1 ? "playlist" : "playlists"
  } • ${likedArtists.length} followed ${
    likedArtists.length === 1 ? "artist" : "artists"
  }`;

  return (
    <BaseHeader
      isLoading={isLoading}
      className="h-[140px] sm:h-[200px] lg:h-[230px] xl:h-[240px]"
    >
      <HeaderContent
        image={{
          src: imageSrc,
          alt: `${username}'s profile picture`,
          className: `
            w-24 h-24 
            sm:w-32 sm:h-32 
            md:w-36 md:h-36 
            lg:w-40 lg:h-40
            rounded-full object-cover
            mx-auto sm:mx-0
            border-3 border-white/20 shadow-lg
            transition-all duration-300
          `,
        }}
        badge={{
          show: true,
          text: "Profile",
          showVerified: false,
        }}
        title={{
          text: username,
          className: "text-center sm:text-left",
        }}
        subtitle={subtitle}
        isLoading={isLoading}
      />
    </BaseHeader>
  );
};

export default memo(Header);
