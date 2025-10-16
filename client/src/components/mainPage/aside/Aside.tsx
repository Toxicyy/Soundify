import { useMemo, memo } from "react";
import { useQuickPlaylist } from "../../../hooks/useQuickPlaylist";
import { MainBar } from "./components/mainBars/MainBar";
import { Player } from "./components/player/Player";
import { MobilePlayer } from "./components/player/MobilePlayer";
import { MobileNavigation } from "./components/navigation/MobileNavigation";

interface NavigationItem {
  text: string;
  animationDuration: number;
  path: string;
  callback?: () => void;
}

/**
 * Sidebar navigation component
 * Renders desktop sidebar with navigation and player, plus mobile bottom navigation
 */
const Aside = () => {
  const { createQuickPlaylist } = useQuickPlaylist();

  const navigationItems: NavigationItem[] = useMemo(
    () => [
      { text: "Home", animationDuration: 0.5, path: "/" },
      { text: "Playlists", animationDuration: 0.6, path: "/playlists" },
      { text: "Artists", animationDuration: 0.7, path: "/artists" },
      { text: "Liked Songs", animationDuration: 0.8, path: "/liked" },
      { text: "Recently", animationDuration: 0.9, path: "/recently" },
      {
        text: "New Playlist",
        animationDuration: 1,
        path: "/",
        callback: createQuickPlaylist,
      },
    ],
    [createQuickPlaylist]
  );

  return (
    <>
      <div className="hidden xl:flex fixed h-screen flex-col w-[20vw] aside pl-10 pr-10">
        <div className="h-full flex flex-col justify-between">
          <div className="flex flex-col gap-[2vh] justify-center pt-[5vh] lg:pt-[5vh] 2xl:pt-[5vh] items-center">
            {navigationItems.map((item) => (
              <MainBar
                key={item.text}
                text={item.text}
                animationDuration={item.animationDuration}
                path={item.path}
                callback={item.callback}
              />
            ))}
          </div>

          <div className="pb-[1vh] lg:pb-[2vh] 2xl:pb-[2vh] pt-[2vh]">
            <Player />
          </div>
        </div>
      </div>

      <div className="xl:hidden">
        <MobilePlayer />
        <MobileNavigation navigationItems={navigationItems} />
      </div>
    </>
  );
};

export default memo(Aside);
