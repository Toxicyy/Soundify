import { RightOutlined } from "@ant-design/icons";
import ArtistCard from "./ArtistCard";
import type { Track } from "../../../../types/TrackData";
import type { Artist } from "../../../../types/ArtistData";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface ArtistModuleProps {
  dailyTracks: { artist: Artist; tracks: Track[] }[];
  isLoading?: boolean;
}

export default function ArtistModule({
  dailyTracks,
  isLoading = false,
}: ArtistModuleProps) {
  useEffect(() => {
    console.log(dailyTracks);
  }, []);
  const navigate = useNavigate();

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center mt-2 md:mt-3 justify-between mb-3 md:mb-4 xl:mb-[15px] px-2 md:px-0">
        <h1 className="text-xl md:text-2xl xl:text-3xl font-bold text-white tracking-wider">
          Artists
        </h1>
        <div
          style={{ color: "rgba(255, 255, 255, 0.4)" }}
          className="flex items-center gap-1 cursor-pointer hover:underline transition-all duration-200"
        >
          <h1
            style={{ color: "rgba(255, 255, 255, 0.5)" }}
            className="tracking-wider text-sm md:text-lg xl:text-xl"
            onClick={() => navigate("/artists")}
          >
            More
          </h1>
          <RightOutlined
            className="mt-[1px] md:mt-[2.5px]"
            style={{ 
              color: "rgba(255, 255, 255, 0.5)", 
              fontSize: window.innerWidth < 768 ? "10px" : "12px" 
            }}
          />
        </div>
      </div>

      {/* Artists Grid */}
      <div className="flex flex-col gap-3 md:gap-4">
        {/* Mobile: Stack artists vertically */}
        <div className="block md:hidden space-y-4">
          <ArtistCard
            artist={isLoading ? null : dailyTracks[0] || null}
            isLoading={isLoading}
            isMobile={true}
          />
          <ArtistCard
            artist={isLoading ? null : dailyTracks[1] || null}
            isLoading={isLoading}
            isMobile={true}
          />
        </div>

        {/* Tablet and Desktop: Original layout */}
        <div className="hidden md:flex md:flex-col md:gap-4">
          <ArtistCard
            artist={isLoading ? null : dailyTracks[0] || null}
            isLoading={isLoading}
            isMobile={false}
          />
          <ArtistCard
            artist={isLoading ? null : dailyTracks[1] || null}
            isLoading={isLoading}
            isMobile={false}
          />
        </div>
      </div>
    </div>
  );
}