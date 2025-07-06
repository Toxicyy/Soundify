
import { useQuickPlaylist } from "../../../hooks/useQuickPlaylist";
import { MainBar } from "./components/mainBars/MainBar";
import { Player } from "./components/player/Player";

export default function Aside() {
  const { createQuickPlaylist} = useQuickPlaylist();

  return (
    <div className="fixed h-screen flex-col w-[20vw] aside pl-10 pr-10">
      <div className="h-full flex flex-col justify-between">
        <div className="flex flex-col gap-5 justify-center pt-[7.5vh] items-center">
          <MainBar text="Home" animationDuration={0.5} path="/" />
          <MainBar text="Radio" animationDuration={0.6} path="/radio" />
          <MainBar text="Library" animationDuration={0.7} path="/library" />
          <MainBar text="Liked Songs" animationDuration={0.8} path="/liked" />
          <MainBar text="Recently" animationDuration={0.9} path="/recently" />
          <MainBar text="New Playlist" animationDuration={1} path="/" callback={createQuickPlaylist} />
        </div> 

        <div className="pb-[2vh]">
          <Player />
        </div>
      </div>
    </div>
  );
}
