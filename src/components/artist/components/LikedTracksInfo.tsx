import type { FC } from "react";
import type { Artist } from "../../../types/ArtistData";
import { Link } from "react-router-dom";
import useArtistLikedTracksCount from "../../../hooks/useArtistLikedTracksCount";

interface LikedTracksInfoProps {
  artist: Artist;
}

const LikedTracksInfo: FC<LikedTracksInfoProps> = ({ artist }) => {
  const { count } = useArtistLikedTracksCount(artist._id);
  return (
    <div className="flex flex-col h-full">
      <h1 className="text-white text-3xl font-bold mb-3">Liked Tracks</h1>
      <div className="flex hover:scale-[1.005] transition-all duration-300">
        <Link to={"/liked"}>
          <img
            src={artist?.avatar}
            alt={artist?.name}
            className="w-[100px] h-[100px] rounded-full cursor-pointer"
          />
        </Link>
        <div className="flex flex-col justify-center ml-5">
          <Link to={"/liked"}>
            <h1 className="text-white text-xl hover:underline cursor-pointer">
              You liked {count} tracks
            </h1>
          </Link>
          <h1 className="text-white text-xl">from: {artist?.name}</h1>
        </div>
      </div>
    </div>
  );
};

export default LikedTracksInfo;
