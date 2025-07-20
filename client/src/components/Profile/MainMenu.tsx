import type { FC } from "react";
import ProfileContentSlider from "./components/ProfileContentSlider";
import ProfileArtistsSlider from "./components/ProfileArtistsSlider";

type MainMenuProps = {
  userId: string;
  isLoading?: boolean;
  access: boolean;
};

const MainMenu: FC<MainMenuProps> = ({ userId, isLoading = false, access }) => {
  return (
    <div className="bg-white/10 p-6 sm:p-8 lg:p-10 rounded-3xl border border-white/20 space-y-8">
      {/* Playlists Section */}
      <ProfileContentSlider
        userId={userId}
        isLoading={isLoading}
        hasAccess={access}
      />

      {/* Artists Section */}
      <ProfileArtistsSlider userId={userId} isLoading={isLoading} />
    </div>
  );
};

export default MainMenu;
