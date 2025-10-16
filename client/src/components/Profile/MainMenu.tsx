import { type FC, memo } from "react";
import ProfileContentSlider from "./components/ProfileContentSlider";
import ProfileArtistsSlider from "./components/ProfileArtistsSlider";

interface MainMenuProps {
  userId: string;
  isLoading?: boolean;
  access: boolean;
}

/**
 * Main content container for profile page
 * Contains playlists and artists sections
 */
const MainMenu: FC<MainMenuProps> = ({ userId, isLoading = false, access }) => {
  return (
    <div className="w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl sm:rounded-3xl overflow-hidden">
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
        <ProfileContentSlider
          userId={userId}
          isLoading={isLoading}
          hasAccess={access}
        />

        <ProfileArtistsSlider userId={userId} isLoading={isLoading} />
      </div>
    </div>
  );
};

export default memo(MainMenu);
