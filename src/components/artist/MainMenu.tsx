import type { FC } from "react";
import type { Track } from "../../types/TrackData";
import { CaretRightOutlined, SwapOutlined } from "@ant-design/icons";
import TracksList from "./components/TrackList";
import LikedTracksInfo from "./components/LikedTracksInfo";
import type { Artist } from "../../types/ArtistData";
import MusicList from "./components/MusicList";
import ArtistInfo from "./components/ArtistInfo";

type MainMenuProps = {
  isLoading?: boolean;
  tracks?: Track[];
  tracksError?: string | null;
  artist: Artist
};

const MainMenu: FC<MainMenuProps> = ({
  isLoading = false,
  tracks = [],
  tracksError = null,
  artist
}) => {
  return (
    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl shadow-2xl w-[100%] h-full flex flex-col">
      <div className="pt-3 px-3 flex-shrink-0">
        {/* Верхняя панель с кнопками управления */}
        <div className="flex items-center justify-between mb-5 px-3">
          <div className="flex items-center gap-4">
            {/* Play/Pause кнопка */}
            {isLoading ? (
              <div className="w-[65px] h-[65px] rounded-full bg-gradient-to-br from-white/15 via-white/25 to-white/10 backdrop-blur-md border border-white/25 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-shimmer"></div>
              </div>
            ) : (
              <div className="bg-white/40 rounded-full w-[65px] h-[65px] flex items-center justify-center cursor-pointer hover:scale-110 transition-all duration-200">
                <CaretRightOutlined
                  style={{ fontSize: "42px", color: "white" }}
                  className="ml-[4px]"
                />
              </div>
            )}

            {/* Shuffle кнопка */}
            {isLoading ? (
              <div className="w-[42px] h-[42px] bg-gradient-to-r from-white/10 via-white/20 to-white/10 backdrop-blur-md border border-white/20 rounded-lg relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-shimmer-delayed"></div>
              </div>
            ) : (
              <SwapOutlined
                style={{
                  color: "rgba(255, 255, 255, 0.3)",
                  fontSize: "42px",
                }}
                className="cursor-pointer hover:scale-110 transition-all duration-200"
              />
            )}

            {/* Кнопка подписаться */}
            {isLoading ? (
              <div className="h-10 w-32 bg-gradient-to-r from-white/10 via-white/20 to-white/10 backdrop-blur-md border border-white/20 rounded-full relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-shimmer-delayed-2"></div>
              </div>
            ) : (
              <button className="bg-transparent border-2 border-white/60 rounded-full px-4 py-2 text-white hover:scale-105 transition-all duration-200 cursor-pointer">
                Follow
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Секция треков с ограниченной высотой */}
      <div className="px-6 py-1 flex-1 min-h-0">
        <TracksList
          isLoading={isLoading}
          tracks={tracks}
          tracksError={tracksError}
        />
      </div>
      <div className="px-6 py-3">
        <LikedTracksInfo artist={artist} />
      </div>
      <div className="px-6 py-5">
        <MusicList tracks={tracks} />
      </div>
      <div className="px-6 py-5 mb-5">
        <ArtistInfo artist={artist} />
      </div>
    </div>
  );
};

export default MainMenu;
