import type { FC } from "react";

type MainMenuProps = {
  playlists: string[];
  isLoading?: boolean;
  likedPlaylists: string[];
  likedArtists: string[];
  access: boolean;
};

const MainMenu: FC<MainMenuProps> = ({
  playlists,
  isLoading,
  likedPlaylists,
  likedArtists,
  access,
}) => {
  return (
    <div className="bg-white/10 p-6 sm:p-8 lg:p-10 rounded-3xl border border-white/20">
      <h1>{access}</h1>
      <h1 className="text-2xl font-bold mb-4 text-white">Playlists</h1>
    </div>
  );
};

export default MainMenu;
