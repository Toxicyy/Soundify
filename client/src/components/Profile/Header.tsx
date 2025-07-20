import type { FC } from "react";
import { BaseHeader, HeaderContent } from "../../shared/BaseHeader";

type ProfileHeaderProps = {
  imageSrc: string;
  username: string;
  isLoading: boolean;
  playlists: string[];
  likedArtists: string[];
};

const Header: FC<ProfileHeaderProps> = ({
  imageSrc,
  username,
  isLoading,
  playlists,
  likedArtists,
}) => {
  return (
    <BaseHeader isLoading={isLoading}>
      <HeaderContent
        image={{
          src: imageSrc,
          alt: username,
          className:
            "w-[120px] h-[120px] sm:w-[8vw] sm:h-[8vw] lg:w-[10vw] lg:h-[10vw] rounded-full mx-auto sm:mx-0",
        }}
        badge={{ show: true, text: "Profile", showVerified: false }}
        title={{ text: username }}
        subtitle={`${playlists.length} ${
          playlists.length === 1 ? "playlist" : "playlists"
        } - ${likedArtists.length} followed ${
          likedArtists.length === 1 ? "artist" : "artists"
        }`}
        isLoading={isLoading}
      />
    </BaseHeader>
  );
};

export default Header;
