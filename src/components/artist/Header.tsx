import { type FC } from "react";
import type { Artist } from "../../types/ArtistData";
import VerifiedBadge from "./components/VerifiedBadge";

type HeaderProps = {
  artist: Artist;
  isLoading?: boolean;
};

const Header: FC<HeaderProps> = ({ artist, isLoading }) => {
  return (
    <div className="w-[100%] h-[30vh] mt-12 bg-white/10 p-10 rounded-3xl border border-white/20">
      <div className="flex gap-5 items-end">
        {/* Аватар - скелетон или реальное изображение */}
        {isLoading ? (
          <div className="w-[10vw] h-[10vw] rounded-full bg-gradient-to-br from-white/10 via-white/20 to-white/5 backdrop-blur-md border border-white/20 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-shimmer"></div>
          </div>
        ) : (
          <img
            src={artist.avatar}
            alt={artist.name}
            className="w-[10vw] h-[10vw] rounded-full drop-shadow-[0_7px_8px_rgba(0,0,0,0.3)]"
          />
        )}

        <div className="flex-1">
          {/* Verified badge и статус - скелетон или реальные данные */}
          {isLoading ? (
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-gradient-to-r from-white/10 via-white/20 to-white/10 backdrop-blur-md border border-white/20 rounded-full relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-shimmer"></div>
              </div>
              <div className="h-5 w-48 bg-gradient-to-r from-white/10 via-white/20 to-white/10 backdrop-blur-md border border-white/20 rounded-md relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-shimmer-delayed"></div>
              </div>
            </div>
          ) : (
            artist.isVerified && (
              <div className="flex items-center gap-2 mb-2">
                <VerifiedBadge size={30} />
                <p className="text-lg font-medium text-white">
                  Подтвержденный исполнитель
                </p>
              </div>
            )
          )}

          {/* Имя артиста - скелетон или реальное имя */}
          {isLoading ? (
            <div className="mb-2">
              <div className="h-20 w-96 bg-gradient-to-br from-white/15 via-white/25 to-white/10 backdrop-blur-md border border-white/25 rounded-2xl relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-12 animate-shimmer-delayed-2"></div>
              </div>
            </div>
          ) : (
            <h1 className="text-[5rem] font-bold bg-gradient-to-br from-white via-pink-300 to-purple-400 bg-clip-text text-transparent mb-2">
              {artist.name}
            </h1>
          )}

          {/* Количество подписчиков - скелетон или реальные данные */}
          {isLoading ? (
            <div className="h-5 w-32 bg-gradient-to-r from-white/8 via-white/15 to-white/8 backdrop-blur-md border border-white/15 rounded-md relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -skew-x-12 animate-shimmer"></div>
            </div>
          ) : (
            <h1 className="text-lg font-medium text-white">
              {artist.followerCount?.toLocaleString()} подписчиков
            </h1>
          )}
        </div>
      </div>
    </div>
  );
};

export default Header;
