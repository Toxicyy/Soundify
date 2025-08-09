import { type FC } from "react";
import likedLogo from "../../images/liked/likedSongs.jpg";
import { useGetUserQuery } from "../../state/UserApi.slice";
import type { Track } from "../../types/TrackData";

/**
 * Props for the Header component
 */
interface HeaderProps {
  /** Array of liked tracks for displaying count */
  tracks: Track[];
}

/**
 * Header component for the liked songs page
 * Features responsive design with different layouts for mobile/tablet/desktop
 *
 * @param tracks - Array of tracks for count calculation
 * @returns JSX.Element - Page header with playlist information
 */
const Header: FC<HeaderProps> = ({ tracks }) => {
  const { data: user } = useGetUserQuery();

  return (
    <>
      {/* Desktop Layout (xl and above) */}
      <div className="hidden xl:block w-full h-[30vh] mt-12 bg-white/10 p-10 rounded-3xl border border-white/20">
        <div className="flex gap-5 items-end">
          {/* Playlist Cover Image */}
          <img
            src={likedLogo}
            alt="Liked Songs playlist cover"
            className="w-[10vw] h-[10vw] rounded-2xl drop-shadow-[0_7px_8px_rgba(0,0,0,0.3)]"
          />

          {/* Playlist Information */}
          <div>
            <p className="text-lg font-medium text-white">Playlist</p>
            <h1 className="text-[5rem] font-bold bg-gradient-to-br from-white via-pink-300 to-purple-400 bg-clip-text text-transparent">
              Liked tracks
            </h1>
            <div className="flex items-center gap-2">
              <p className="text-white text-lg">{user?.username}</p>
              <div
                className="w-[5px] h-[5px] rounded-full bg-white/60"
                aria-hidden="true"
              ></div>
              <p className="text-white/60 text-lg">
                {tracks.length} {tracks.length === 1 ? "track" : "tracks"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tablet Layout (md to xl) */}
      <div className="hidden md:block xl:hidden w-full bg-white/10 p-6 rounded-2xl border border-white/20">
        <div className="flex gap-4 items-end">
          {/* Playlist Cover Image */}
          <img
            src={likedLogo}
            alt="Liked Songs playlist cover"
            className="w-24 h-24 rounded-xl drop-shadow-[0_5px_6px_rgba(0,0,0,0.3)]"
          />

          {/* Playlist Information */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white/80">Playlist</p>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-br from-white via-pink-300 to-purple-400 bg-clip-text text-transparent truncate">
              Liked tracks
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <p
                className="text-white text-base truncate max-w-[150px]"
                title={user?.username}
              >
                {user?.username}
              </p>
              <div
                className="w-1 h-1 rounded-full bg-white/60 flex-shrink-0"
                aria-hidden="true"
              ></div>
              <p className="text-white/60 text-base flex-shrink-0">
                {tracks.length} {tracks.length === 1 ? "track" : "tracks"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Layout (below md) */}
      <div className="block md:hidden w-full bg-white/10 p-4 rounded-xl border border-white/20">
        <div className="flex flex-col items-center text-center gap-3">
          {/* Playlist Cover Image */}
          <img
            src={likedLogo}
            alt="Liked Songs playlist cover"
            className="w-20 h-20 rounded-lg drop-shadow-[0_4px_5px_rgba(0,0,0,0.3)]"
          />

          {/* Playlist Information */}
          <div className="w-full">
            <p className="text-xs font-medium text-white/70 mb-1">Playlist</p>
            <h1 className="text-2xl font-bold bg-gradient-to-br from-white via-pink-300 to-purple-400 bg-clip-text text-transparent mb-2">
              Liked tracks
            </h1>
            <div className="flex items-center justify-center gap-2 text-sm">
              <p
                className="text-white/90 truncate max-w-[120px]"
                title={user?.username}
              >
                {user?.username}
              </p>
              <div
                className="w-1 h-1 rounded-full bg-white/50 flex-shrink-0"
                aria-hidden="true"
              ></div>
              <p className="text-white/60 flex-shrink-0">
                {tracks.length} {tracks.length === 1 ? "track" : "tracks"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Header;
