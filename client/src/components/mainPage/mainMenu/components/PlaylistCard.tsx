import {
  CaretRightOutlined,
  PauseOutlined,
} from "@ant-design/icons";
import { useState } from "react";
import { motion } from "framer-motion";
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

  // Mobile layout (below md)
  const MobileCard = () => (
    <div
      className="w-full h-48 rounded-2xl relative overflow-hidden cursor-pointer group"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={
        playHover ? () => {} : () => navigate(`/playlist/${playlist._id}`)
      }
    >
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
        style={{
          backgroundImage: `url(${playlist.coverUrl})`,
        }}
      />

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-end p-4">
        <div className="flex items-end justify-between">
          <div className="flex-1">
            <h1 className="text-white text-lg font-bold tracking-wider mb-1 line-clamp-2">
              {playlist.name}
            </h1>
            <div className="flex items-center gap-2 text-white/70 text-sm">
              <span>{playlist.trackCount} songs</span>
              <span>•</span>
              <span>
                {formatTimeString(useFormatTime(playlist.totalDuration))}
              </span>
            </div>
          </div>

          {/* Play Button */}
          <motion.button
            className="w-12 h-12 bg-[#5cec8c] rounded-full flex items-center justify-center shadow-lg ml-4"
            onClick={(e) => {
              e.stopPropagation();
              setIsPlaying(!isPlaying);
            }}
            onMouseEnter={() => setPlayHover(true)}
            onMouseLeave={() => setPlayHover(false)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            {isPlaying ? (
              <PauseOutlined style={{ fontSize: "20px", color: "black" }} />
            ) : (
              <CaretRightOutlined
                style={{ fontSize: "20px", color: "black" }}
                className="ml-1"
              />
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );

  // Tablet layout (md to xl)
  const TabletCard = () => (
    <div
      className="w-full h-56 rounded-3xl relative overflow-hidden cursor-pointer transition-all duration-300"
      style={{
        backgroundImage: `url(${playlist.coverUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={
        playHover ? () => {} : () => navigate(`/playlist/${playlist._id}`)
      }
    >
      {/* Glass overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 backdrop-blur-[1px]" />

      <div className="absolute inset-0 flex items-end justify-between p-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-white text-2xl xl:text-3xl font-bold tracking-wider">
            {playlist.name}
          </h1>
          <div className="flex items-center text-gray-300 text-lg">
            <span>{playlist.trackCount} songs</span>
            <span className="mx-2">⋅</span>
            <span>
              {formatTimeString(useFormatTime(playlist.totalDuration))}
            </span>
          </div>
        </div>

        {hover && (
          <motion.div
            className="mb-[-20px]"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
          >
            <button
              className="w-14 h-14 bg-black rounded-full flex items-center justify-center shadow-lg cursor-pointer transition-all duration-200 hover:scale-105"
              onClick={(e) => {
                e.stopPropagation();
                setIsPlaying(!isPlaying);
              }}
              onMouseEnter={() => setPlayHover(true)}
              onMouseLeave={() => setPlayHover(false)}
            >
              {isPlaying ? (
                <PauseOutlined style={{ fontSize: "28px", color: "#5cec8c" }} />
              ) : (
                <CaretRightOutlined
                  style={{ fontSize: "28px", color: "#5cec8c" }}
                  className="ml-1"
                />
              )}
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );

  // Desktop layout (xl and up) - original design
  const DesktopCard = () => (
    <div
      className={
        "w-full h-[35vh] rounded-3xl glass flex pl-10 pr-10 pb-4 items-end duration-300 transition-all cursor-pointer justify-between " +
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
        playHover ? () => {} : () => navigate(`/playlist/${playlist._id}`)
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
              onClick={(e) => {
                e.stopPropagation();
                setIsPlaying(!isPlaying);
              }}
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

  return (
    <>
      {/* Mobile version */}
      <div className="block md:hidden">
        <MobileCard />
      </div>

      {/* Tablet version */}
      <div className="hidden md:block xl:hidden">
        <TabletCard />
      </div>

      {/* Desktop version */}
      <div className="hidden xl:block">
        <DesktopCard />
      </div>
    </>
  );
}
