import {
  CaretRightOutlined,
  ClockCircleOutlined,
  PauseOutlined,
} from "@ant-design/icons";
import type { Track } from "../../types/TrackData";
import type { FC } from "react";
import { useFormatTime } from "../../hooks/useFormatTime";

type MainMenuProps = {
  tracks: Track[];
};
const MainMenu: FC<MainMenuProps> = ({ tracks }) => {
  const currentTrack = { isPlaying: false };
  const isLoading = false;

  function formatDate(dateStr: Date): string {
    const date = new Date(dateStr);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }
  return (
    <div className="bg-black/30 backdrop-blur-md border border-white/20 rounded-lg shadow-2xl w-[100%] h-[100%]">
      <div className="p-3">
        <div className=" bg-white/40 rounded-full w-[65px] h-[65px] flex items-center justify-center cursor-pointer hover:scale-110 transition-all duration-200 mb-5">
          {isLoading ? (
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white" />
          ) : currentTrack.isPlaying ? (
            <PauseOutlined style={{ fontSize: "40px", color: "white" }} />
          ) : (
            <CaretRightOutlined
              style={{ fontSize: "42px", color: "white" }}
              className="ml-[4px]"
            />
          )}
        </div>
        <div className="flex items-center mx-4 mb-2">
          <h1 className="text-white/50 text-2xl mr-5">#</h1>
          <div className="flex justify-between w-[100%]">
            <h1 className="text-white/50  text-2xl">Title</h1>
            <h1 className="text-white/50  text-2xl">Album</h1>
            <h1 className="text-white/50  text-2xl">Date</h1>
            <div className="text-white/50  text-2xl">
              <ClockCircleOutlined />
            </div>
          </div>
        </div>
        <div className="h-[2px] w-[100%] bg-gray-400/40"></div>
        <div>
          {tracks.map((tracks, index) => (
            <div
              key={index}
              className="flex items-center mx-4 mb-2"
            >
              <h1 className="text-white/50 text-2xl mr-5">{index + 1}</h1>
              <div className="flex justify-between w-[100%]">
                <h1 className="text-white/50  text-2xl">{tracks.name}</h1>
                <h1 className="text-white/50  text-2xl">{"none"}</h1>
                <h1 className="text-white/50  text-2xl">
                  {formatDate(tracks.createdAt)}
                </h1>
                <div className="text-white/50  text-2xl">
                  {useFormatTime(tracks.duration)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MainMenu;
