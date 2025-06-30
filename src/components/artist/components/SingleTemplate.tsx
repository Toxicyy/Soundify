import type { FC } from "react";
import type { Track } from "../../../types/TrackData";

interface SingleTemplateProps {
  track: Track;
  index: number;
}

const SingleTemplate: FC<SingleTemplateProps> = ({ track, index }) => {
  function getYearFromDate(date: Date) {
    return date.getFullYear();
  }
  return (
    <div>
      <img
        src={track.coverUrl}
        alt={track.name}
        className="w-[160px] h-[160px] border-2 border-black mb-1"
      />
      <h1 className="text-lg text-white">{track.name}</h1>
      <div className="flex items-center text-white/60 gap-2">
        <h1>
          {index === 0 ? (
            <h1>latest release</h1>
          ) : (
            getYearFromDate(new Date(track.createdAt))
          )}
        </h1>
        <div className="w-[5px] h-[5px] bg-white/70 rounded-full"></div>
        <h1>Single</h1>
      </div>
    </div>
  );
};

export default SingleTemplate;
