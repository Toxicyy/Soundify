import { CaretRightOutlined, PauseOutlined } from "@ant-design/icons";
import { useState } from "react";
import type { Playlist } from "../../../../types/Playlist";
import { useFormatTime } from "../../../../hooks/useFormatTime";
import { useNavigate } from "react-router-dom";

export default function PlaylistCard({ playlist }: { playlist: Playlist }) {
  const [hover, setHover] = useState(false);
  const [playHover, setPlayHover] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const navigate = useNavigate();

  function formatTimeString(timeStr: string) {
    const parts = timeStr.split(":");
    let result = [];

    if (parts.length === 2) {
      const [minutes] = parts;
      if (minutes !== "0") {
        result.push(`${minutes} min${minutes !== "1" ? "s" : ""}`);
      }
    } else if (parts.length === 3) {
      const [hours, minutes] = parts;
      if (hours !== "0") {
        result.push(`${hours} hour${hours !== "1" ? "s" : ""}`);
      }
      if (minutes !== "00") {
        result.push(`${minutes} min${minutes !== "1" ? "s" : ""}`);
      }
    }

    return result.join(" ") || "0 mins";
  }
  return (
    <div
      className={
        "w-[100%] h-[35vh] rounded-3xl glass flex pl-10 pr-10 pb-4 items-end duration-300 transition-all cursor-pointer justify-between " +
        (hover ? "drop-shadow-[0_7px_7px_rgba(0,0,0,0.4)]" : "")
      }
      style={{
        backgroundImage: `url(${playlist.coverUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={
        playHover
          ? () => {}
          : () => {
              navigate(`/playlist/${playlist._id}`);
            }
      }
    >
      <div className="flex flex-col gap-2">
        <h1 className="text-white text-4xl font-bold tracking-wider">
          {playlist.name}
        </h1>
        <div className="flex">
          <h1 className="text-gray-400 text-xl tracking-wide">
            {playlist.trackCount} songs ⋅{" "}
            {formatTimeString(useFormatTime(playlist.totalDuration))}
          </h1>
        </div>
      </div>
      {hover && (
        <div className="mb-[-30px]">
          <button className="w-14 h-14 bg-black rounded-full flex items-center justify-center shadow-lg cursor-pointer">
            <div
              className="bg-black rounded-full w-14 h-14 flex items-center justify-center cursor-pointer transition-all duration-200"
              onClick={() => setIsPlaying(!isPlaying)}
              onMouseEnter={() => setPlayHover(true)}
              onMouseLeave={() => setPlayHover(false)}
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
