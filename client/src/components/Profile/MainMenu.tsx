// MainMenu.tsx - Responsive Main Content Area
import type { FC } from "react";
import ProfileContentSlider from "./components/ProfileContentSlider";
import ProfileArtistsSlider from "./components/ProfileArtistsSlider";

/**
 * Main Menu Component - Responsive content container
 *
 * RESPONSIVE DESIGN:
 * - Adaptive padding and spacing for all screen sizes
 * - Flexible container that works with sidebar layout
 * - Optimized gap spacing between sections
 * - Mobile-first approach with proper breakpoints
 *
 * LAYOUT FEATURES:
 * - Glass morphism design with backdrop blur
 * - Proper spacing between content sections
 * - Responsive border radius and padding
 * - Accessible focus states and navigation
 */

type MainMenuProps = {
  userId: string;
  isLoading?: boolean;
  access: boolean;
};

const MainMenu: FC<MainMenuProps> = ({ userId, isLoading = false, access }) => {
  return (
    <div className="w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl sm:rounded-3xl overflow-hidden">
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
        {/* Playlists Section */}
        <ProfileContentSlider
          userId={userId}
          isLoading={isLoading}
          hasAccess={access}
        />

        {/* Artists Section */}
        <ProfileArtistsSlider userId={userId} isLoading={isLoading} />
      </div>
    </div>
  );
};

export default MainMenu;
