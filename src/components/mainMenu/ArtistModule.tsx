import { RightOutlined } from "@ant-design/icons";
import ArtistCard from "./ArtistCard";
import type { Track } from "../../types/TrackData";
import type { Artist } from "../../types/ArtistData";

interface ArtistModuleProps {
  dailyTracks: { artist: Artist; tracks: Track[] }[];
  isLoading?: boolean;
}

export default function ArtistModule({
  dailyTracks,
  isLoading = false,
}: ArtistModuleProps) {
  return (
    <div>
      <div className="flex items-center mt-3 justify-between mb-[15px]">
        <h1 className="text-3xl font-bold text-white tracking-wider mt-2">
          Artists
        </h1>
        <div
          style={{ color: "rgba(255, 255, 255, 0.4)" }}
          className="flex items-center gap-1 cursor-pointer hover:underline pt-3"
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

      <div className="flex flex-col gap-4">
        <ArtistCard
          artist={isLoading ? null : dailyTracks[0] || null}
          isLoading={isLoading}
        />
        <ArtistCard
          artist={isLoading ? null : dailyTracks[1] || null}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
