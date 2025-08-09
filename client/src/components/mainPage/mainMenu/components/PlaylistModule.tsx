import { RightOutlined } from "@ant-design/icons";
import PlaylistCard from "./PlaylistCard";
import type { Playlist } from "../../../../types/Playlist";
import type { FC } from "react";
import { useNavigate } from "react-router-dom";

type PlaylistModuleProps = {
  playlist?: Playlist;
  isLoading?: boolean;
};

// Skeleton Component
const PlaylistSkeleton = () => {
  return (
    <div className="w-full animate-pulse">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between mb-3 md:mb-4 xl:mb-[15px] px-2 md:px-0">
        <div className="h-6 md:h-8 xl:h-9 bg-gradient-to-br from-white/10 via-white/20 to-white/5 rounded-lg w-24 md:w-32 xl:w-40"></div>
        <div className="flex items-center gap-1">
          <div className="h-4 md:h-5 xl:h-6 bg-gradient-to-br from-white/10 via-white/20 to-white/5 rounded w-12 md:w-16 xl:w-20"></div>
          <div className="w-2 h-2 md:w-3 md:h-3 bg-gradient-to-br from-white/10 via-white/20 to-white/5 rounded-full"></div>
        </div>
      </div>

      {/* Card Skeleton - Mobile */}
      <div className="block md:hidden">
        <div className="w-full h-48 rounded-2xl bg-gradient-to-br from-white/10 via-white/20 to-white/5 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-white/20 to-white/5" />
          <div className="absolute inset-0 flex flex-col justify-end p-4">
            <div className="flex items-end justify-between">
              <div className="flex-1">
                <div className="h-5 bg-gradient-to-br from-white/10 via-white/20 to-white/5 rounded-lg w-3/4 mb-2"></div>
                <div className="flex items-center gap-2">
                  <div className="h-4 bg-gradient-to-br from-white/10 via-white/20 to-white/5 rounded w-16"></div>
                  <div className="w-1 h-1 bg-gradient-to-br from-white/10 via-white/20 to-white/5 rounded-full"></div>
                  <div className="h-4 bg-gradient-to-br from-white/10 via-white/20 to-white/5 rounded w-12"></div>
                </div>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-white/10 via-white/20 to-white/5 rounded-full ml-4"></div>
            </div>
          </div>
          {/* Shimmer Effect */}
          <div className="absolute inset-0 -skew-x-12 bg-gradient-to-br from-white/10 via-white/20 to-white/5 animate-shimmer"></div>
        </div>
      </div>

      {/* Card Skeleton - Tablet */}
      <div className="hidden md:block xl:hidden">
        <div className="w-full h-56 rounded-3xl bg-gradient-to-br from-white/10 via-white/20 to-white/5 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-white/20 to-white/5" />
          <div className="absolute inset-0 flex items-end justify-between p-6">
            <div className="flex flex-col gap-2">
              <div className="h-6 xl:h-8 bg-gradient-to-br from-white/10 via-white/20 to-white/5 rounded-lg w-48 xl:w-64"></div>
              <div className="flex items-center gap-2">
                <div className="h-5 bg-gradient-to-br from-white/10 via-white/20 to-white/5 rounded w-20"></div>
                <div className="w-1 h-1 bg-gradient-to-br from-white/10 via-white/20 to-white/5 rounded-full"></div>
                <div className="h-5 bg-gradient-to-br from-white/10 via-white/20 to-white/5 rounded w-16"></div>
              </div>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-white/10 via-white/20 to-white/5 rounded-full mb-[-20px]"></div>
          </div>
          {/* Shimmer Effect */}
          <div className="absolute inset-0 -skew-x-12bg-gradient-to-br from-white/10 via-white/20 to-white/5 animate-shimmer"></div>
        </div>
      </div>

      {/* Card Skeleton - Desktop */}
      <div className="hidden xl:block">
        <div className="w-full h-[35vh] rounded-3xl bg-gradient-to-br from-white/10 via-white/20 to-white/5 flex pl-10 pr-10 pb-4 items-end justify-between relative overflow-hidden">
          <div className="flex flex-col gap-2">
            <div className="h-10 bg-gradient-to-br from-white/10 via-white/20 to-white/5 rounded-lg w-80"></div>
            <div className="flex items-center gap-2">
              <div className="h-6 bg-gradient-to-br from-white/10 via-white/20 to-white/5 rounded w-24"></div>
              <div className="w-1 h-1 bg-gradient-to-br from-white/10 via-white/20 to-white/5 rounded-full"></div>
              <div className="h-6 bg-gradient-to-br from-white/10 via-white/20 to-white/5 rounded w-20"></div>
            </div>
          </div>
          <div className="w-14 h-14 bg-gradient-to-br from-white/10 via-white/20 to-white/5 rounded-full mb-[-30px]"></div>
          {/* Shimmer Effect */}
          <div className="absolute inset-0 -skew-x-12 bg-gradient-to-br from-white/10 via-white/20 to-white/5 animate-shimmer"></div>
        </div>
      </div>
    </div>
  );
};

const PlaylistModule: FC<PlaylistModuleProps> = ({
  playlist,
  isLoading = false,
}) => {
  const navigate = useNavigate();

  if (isLoading) {
    return <PlaylistSkeleton />;
  }

  if (!playlist) {
    return null;
  }

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
