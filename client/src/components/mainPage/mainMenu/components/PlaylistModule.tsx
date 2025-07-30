import { RightOutlined } from "@ant-design/icons";
import PlaylistCard from "./PlaylistCard";
import type { Playlist } from "../../../../types/Playlist";
import type { FC } from "react";

type PlaylistModuleProps = {
  playlist: Playlist
}
const PlaylistModule:FC<PlaylistModuleProps> = ({playlist}) => {
  return (
    <>
      <div className="flex items-center justify-between mb-[15px]">
        <h1 className="text-3xl font-bold text-white tracking-wider mt-2">
          Playlists
        </h1>
        <div
          style={{ color: "rgba(255, 255, 255, 0.4)" }}
          className="flex items-center gap-1 cursor-pointer hover:underline  pt-3"
        >
          <h1
            style={{ color: "rgba(255, 255, 255, 0.5)" }}
            className="tracking-wider text-xl"
          >
            More{" "}
          </h1>
          <RightOutlined
            className="mt-[2.5px]"
            style={{ color: "rgba(255, 255, 255, 0.5)", fontSize: "12px" }}
          />
        </div>
      </div>
      <div className="hover:scale-102 transition-all duration-300">
        <PlaylistCard playlist={playlist} />
      </div>
    </>
  );
}

export default PlaylistModule
