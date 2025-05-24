import { MainBar } from "../mainBars/MainBar";
import { Player } from "./player/Player";

export default function Aside() {
  return (
    <div className="fixed h-screen flex-col w-[20vw] aside pl-10 pr-10">
      <div className="h-full flex flex-col justify-between">
        <div className="flex flex-col gap-5 justify-center pt-[7.5vh] items-center">
          <MainBar text="Home" animationDuration={0.5} />
          <MainBar text="Radio" animationDuration={0.6} />
          <MainBar text="Library" animationDuration={0.7} />
          <MainBar text="Liked Songs" animationDuration={0.8} />
          <MainBar text="Recently" animationDuration={0.9} />
          <MainBar text="New Playlist" animationDuration={1} />
        </div>

        <div>
          <Player max={204} />
        </div>
      </div>
    </div>
  );
}
