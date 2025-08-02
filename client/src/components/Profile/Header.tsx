// Header.tsx - Responsive Profile Header
import type { FC } from "react";
import { BaseHeader, HeaderContent } from "../../shared/BaseHeader";

/**
 * Profile Header Component - Responsive design with optimized layout
 * 
 * RESPONSIVE FEATURES:
 * - Avatar sizes adapt to screen size and available space
 * - Typography scales appropriately across devices
 * - Improved mobile layout with better spacing
 * - Centered avatar on mobile, left-aligned on larger screens
 * 
 * DESIGN IMPROVEMENTS:
 * - Better use of Tailwind responsive prefixes
 * - Optimized image loading with proper aspect ratios
 * - Enhanced accessibility with proper alt texts
 * - Smooth transitions for all interactive elements
 */

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
          showVerified: false 
        }}
        title={{ 
          text: username,
          className: "text-center sm:text-left"
        }}
        subtitle={`${playlists.length} ${
          playlists.length === 1 ? "playlist" : "playlists"
        } • ${likedArtists.length} followed ${
          likedArtists.length === 1 ? "artist" : "artists"
        }`}
        isLoading={isLoading}
      />
    </BaseHeader>
  );
};

export default Header;