import type { FC } from "react";
import type { Artist } from "../../../types/ArtistData";

interface ArtistInfoProps {
  artist: Artist;
}

const ArtistInfo: FC<ArtistInfoProps> = ({ artist }) => {
  return (
    <div>
        <h1 className="text-3xl font-bold text-white mb-3">About artist</h1>
      <div className="flex bg-white/10 rounded-2xl hover:bg-white/20  hover:scale-101 transition-all duration-300 p-3 gap-5">
        <div>
          <img
            src={artist.avatar}
            alt={artist.name}
            className="w-[230px] h-[230px] rounded-full mb-2"
          />
          <h1 className="text-white text-xl text-center">{artist.followerCount} followers</h1>
        </div>
        <div className="text-lg text-white max-w-[57vw]"><span className="font-semibold text-xl">bio:</span> {artist.bio}</div>
      </div>
    </div>
  );
};

export default ArtistInfo;
