import { type FC } from "react";
import likedLogo from "../../images/liked/likedSongs.jpg";
import { useGetUserQuery } from "../../state/UserApi.slice";
import type { Track } from "../../types/TrackData";

type HeaderProps = {
    tracks: Track[]
}
const Header:FC<HeaderProps> = ({tracks}) => {
  const {data:user} = useGetUserQuery();



  return (
    <div className="w-[100%] h-[30vh] mt-12">
      <div className="flex gap-5 items-end">
        <img
          src={likedLogo}
          alt=""
          className="w-[10vw] h-[10vw] rounded-2xl drop-shadow-[0_7px_8px_rgba(0,0,0,0.3)]"
        />
        <div>
          <p className="text-md font-medium text-white">Playlist</p>
          <h1 className="text-[5rem] font-bold text-white">Liked Songs</h1>
          <div className="flex items-center gap-2">
            <p className="text-white">{user?.username}</p>
            <div className="w-[5px] h-[5px] rounded-full bg-white/60"></div>
            <p className="text-white/60">{tracks.length} tracks</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Header;
