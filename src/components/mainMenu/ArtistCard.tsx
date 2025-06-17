import TrackLayout from "./TrackLayout";


import type { Artist } from "../../types/ArtistData";
import type { Track } from "../../types/TrackData";

export default function ArtistCard({
  artist
}: {
  artist: {artist: Artist; tracks: Track[]} | null
}) {
  console.log(artist)
  return (
    <div className="flex justify-between gap-[20px]">
      <div className="flex flex-col items-center gap-2">
        <img
          src={artist?.artist.avatar}
          alt="Artist image"
          className="w-[140px] h-[140px] rounded-[45px]"
        />
        <h1 className="text-black text-lg font-bold tracking-wider">
          {artist?.artist.name}
        </h1>
      </div>
        <div className="flex flex-col gap-[10px]">
          <TrackLayout
            track={artist?.tracks[0]}
          />
          <TrackLayout
            track={artist?.tracks[1]}
          />
        </div>
      </div>
  );
}
