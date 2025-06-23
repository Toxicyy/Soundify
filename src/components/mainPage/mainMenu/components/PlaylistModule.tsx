import { RightOutlined } from "@ant-design/icons";
import PlaylistCard from "./PlaylistCard";
import playlistImage from "../../../../images/Playlist/JapaneseLofi.jpg";

export default function PlaylistModule() {
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
      <div>
        <PlaylistCard playlistImage={playlistImage} />
      </div>
    </>
  );
}
