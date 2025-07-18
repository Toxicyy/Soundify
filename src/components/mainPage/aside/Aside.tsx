import { useQuickPlaylist } from "../../../hooks/useQuickPlaylist";
import { MainBar } from "./components/mainBars/MainBar";
import { Player } from "./components/player/Player";
import { MobilePlayer } from "./components/player/MobilePlayer";
import { MobileNavigation } from "./components/navigation/MobileNavigation";

export default function Aside() {
  const { createQuickPlaylist } = useQuickPlaylist();

  const navigationItems = [
    { text: "Home", animationDuration: 0.5, path: "/" },
    { text: "Playlists", animationDuration: 0.6, path: "/radio" },
    { text: "Artists", animationDuration: 0.7, path: "/library" },
    { text: "Liked Songs", animationDuration: 0.8, path: "/liked" },
    { text: "Recently", animationDuration: 0.9, path: "/recently" },
    {
      text: "New Playlist",
      animationDuration: 1,
      path: "/",
      callback: createQuickPlaylist,
    },
  ];

  return (
    <>
      {/* Desktop Aside - скрыт на мобильных */}
      <div className="hidden xl:flex fixed h-screen flex-col w-[20vw] aside pl-10 pr-10">
        <div className="h-full flex flex-col justify-between">
          <div className="flex flex-col gap-5 justify-center pt-[7.5vh] items-center">
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

          <div className="pb-[2vh]">
            <Player />
          </div>
        </div>
      </div>

      {/* Mobile Bottom Player - виден только на мобильных */}
      <div className="xl:hidden">
        <MobilePlayer />
        <MobileNavigation navigationItems={navigationItems} />
      </div>

      <div className=""></div>
    </>
  );
}
