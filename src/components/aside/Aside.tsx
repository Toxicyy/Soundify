import { MainBar } from "../mainBars/MainBar";
import { Player } from "./player/Player";

export default function Aside(){
    return (
        <div className="h-[100vh] flex flex-col w-[20vw] aside gap-[80px] pl-10 pr-10">
            <div className="flex flex-col gap-5 justify-center pt-18 items-center">
                <MainBar text="Home"/>
                <MainBar text="Radio"/>
                <MainBar text="Library"/>
                <MainBar text="Liked Songs"/>
                <MainBar text="Recently"/>
                <MainBar text="New Playlist"/>
            </div>

            <div>
                <Player />
            </div>
        </div>
    )
}
