import { CaretRightOutlined, PauseOutlined } from "@ant-design/icons";
import { useState } from "react";

export default function PlaylistCard({
  playlistImage,
}: {
  playlistImage: string;
}) {
  const [hover, setHover] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const playlistName = "Japanese Lofi";
  const playlistSongs = 47;
  const playlistDuration = "3 hours 37 mins";
  return (
    <div
      className={
        "w-[100%] h-[35vh] rounded-3xl glass flex pl-10 pr-10 pb-4 items-end duration-300 transition-all justify-between " + (hover ? "drop-shadow-[0_7px_7px_rgba(0,0,0,0.4)]" : "")
        // +
        // (hover
        //   ? "contrast-100 drop-shadow-[0_7px_7px_rgba(0,0,0,0.4)]"
        //   : "contrast-50")
      }
      style={{
        backgroundImage: `url(${playlistImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div className="flex flex-col gap-2">
        <h1 className="text-white text-4xl font-bold tracking-wider">
          {playlistName}
        </h1>
        <div className="flex">
          <h1 className="text-gray-400 text-xl tracking-wide">
            {playlistSongs} songs ⋅ {playlistDuration}
          </h1>
        </div>
      </div>
      {hover && (
        <div className="mb-[-30px]">
          <button className="w-14 h-14 bg-black rounded-full flex items-center justify-center shadow-lg cursor-pointer">
            <div
              className="bg-black rounded-full w-14 h-14 flex items-center justify-center cursor-pointer transition-all duration-200"
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {isPlaying ? (
                <PauseOutlined style={{ fontSize: "34px", color: "#5cec8c" }} />
              ) : (
                <CaretRightOutlined
                  style={{ fontSize: "34px", color: "#5cec8c" }}
                  className="ml-[4px]"
                />
              )}
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
