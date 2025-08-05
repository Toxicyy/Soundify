import { RightOutlined } from "@ant-design/icons";
import PlaylistCard from "./PlaylistCard";
import type { Playlist } from "../../../../types/Playlist";
import type { FC } from "react";
import { useNavigate } from "react-router-dom";

type PlaylistModuleProps = {
  playlist: Playlist;
};

const PlaylistModule: FC<PlaylistModuleProps> = ({ playlist }) => {
    const navigate = useNavigate();
  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 md:mb-4 xl:mb-[15px] px-2 md:px-0">
        <h1 className="text-xl md:text-2xl xl:text-3xl font-bold text-white tracking-wider">
          Playlists
        </h1>
        <div
          style={{ color: "rgba(255, 255, 255, 0.4)" }}
          className="flex items-center gap-1 cursor-pointer hover:underline transition-all duration-200"
        >
          <h1
            style={{ color: "rgba(255, 255, 255, 0.5)" }}
            className="tracking-wider text-sm md:text-lg xl:text-xl"
            onClick={() => navigate("/playlists")}
          >
            More
          </h1>
          <RightOutlined
            className="mt-[1px] md:mt-[2.5px]"
            style={{
              color: "rgba(255, 255, 255, 0.5)",
              fontSize: window.innerWidth < 768 ? "10px" : "12px",
            }}
          />
        </div>
      </div>

      {/* Playlist Card */}
      <div className="hover:scale-102 transition-all duration-300">
        <PlaylistCard playlist={playlist} />
      </div>
    </div>
  );
};

export default PlaylistModule;
