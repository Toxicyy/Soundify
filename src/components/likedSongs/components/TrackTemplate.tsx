import { useRef, useState, useEffect, type FC } from "react";
import type { Track } from "../../../types/TrackData";
import { useFormatTime } from "../../../hooks/useFormatTime";
import {
  HeartFilled,
  HeartOutlined,
  EllipsisOutlined,
  CaretRightOutlined,
  PauseOutlined,
} from "@ant-design/icons";
import ContextMenu from "../../mainPage/mainMenu/components/ContextMenu";
import type { AppDispatch, AppState } from "../../../store";
import { useDispatch, useSelector } from "react-redux";
import { useGetUserQuery } from "../../../state/UserApi.slice";
import { toggleLike } from "../../../state/LikeUpdate.slice";
import { addToQueue, playTrackAndQueue } from "../../../state/Queue.slice"; // Импортируем playTrackAndQueue
import {
  setCurrentTrack,
  setIsPlaying,
} from "../../../state/CurrentTrack.slice";

type TrackTemplateProps = {
  track: Track;
  index: number;
  isLoading?: boolean;
  allTracks?: Track[]; // Массив всех треков для создания очереди
};

function formatDate(dateStr: Date): string {
  const date = new Date(dateStr);
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

const TrackTemplate: FC<TrackTemplateProps> = ({
  track,
  index,
  isLoading,
  allTracks = [],
}) => {
  const [hover, setHover] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeHover, setLikeHover] = useState(false);

  const duration = useFormatTime(track?.duration || 0);
  const dispatch = useDispatch<AppDispatch>();
  const likeUpdated = useSelector((state: AppState) => state.likeUpdate);
  const { data: user, isFetching } = useGetUserQuery();
  const currentTrack = useSelector((state: AppState) => state.currentTrack);
  const isCurrentTrack = currentTrack.currentTrack?._id === track?._id;
  const isThisTrackPlaying = isCurrentTrack && currentTrack.isPlaying;
  const ellipsisRef = useRef<HTMLDivElement>(null);

  // Синхронизация состояния лайка
  useEffect(() => {
    if (!isFetching && user && track) {
      const isLiked =
        user.likedSongs.includes(track._id) ||
        likeUpdated.trackId.includes(track._id);
      setLiked(isLiked);
    }
  }, [isFetching, track, likeUpdated.isLiked, user]);

  // Функция для воспроизведения трека с созданием очереди
  const playTrackWithContext = () => {
    if (!track || isLoading) return;

    if (allTracks && allTracks.length > 0) {
      console.log("Creating queue from context:", {
        trackName: track.name,
        startIndex: index,
        totalTracks: allTracks.length,
      });

      // Используем playTrackAndQueue для создания правильной очереди
      // Треки с индексом startIndex и дальше идут в очередь
      // Треки с индексом меньше startIndex автоматически попадают в историю
      dispatch(
        playTrackAndQueue({
          contextTracks: allTracks,
          startIndex: index,
        })
      );
    } else {
      // Fallback: если нет контекста, просто играем трек
      console.log("No context tracks, playing single track");
      dispatch(setCurrentTrack(track));
      dispatch(setIsPlaying(true));
    }
  };

  const togglePlayPause = () => {
    if (!track || isLoading) return;

    if (isCurrentTrack) {
      // Если это текущий трек - просто переключаем play/pause
      dispatch(setIsPlaying(!currentTrack.isPlaying));
    } else {
      // Если это другой трек - запускаем с контекстом очереди
      playTrackWithContext();
    }
  };

  const handleEllipsisClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(!menuOpen);
  };

  const handleLikeClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isFetching || !user?._id || !track?._id) return;

    try {
      const url = `http://localhost:5000/api/users/${user._id}/${
        liked ? "unlike" : "like"
      }/${track._id}`;

      const response = await fetch(url, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        setLiked(!liked);
        dispatch(
          toggleLike({
            isLiked: !liked,
            trackId: !liked
              ? [...likeUpdated.trackId, track._id]
              : likeUpdated.trackId.filter((id) => id !== track._id),
          })
        );
      } else {
        console.error("Ошибка:", await response.json());
      }
    } catch (error) {
      console.error("Ошибка сети:", error);
    }
  };

  

  const handleAddToQueue = () => {
    if (!track) return;
    dispatch(addToQueue(track));
  };

  const handleHideTrack = () => {
    console.log("Hide track clicked");
  };

  const handleArtistClick = () => {
    console.log("Artist clicked");
  };

  const handleAlbumClick = () => {
    console.log("Album clicked");
  };

  const handleInfoClick = () => {
    console.log("Info clicked");
  };

  const handleShareClick = () => {
    console.log("Share clicked");
  };

  const handleMenuItemClick = (index: number) => {
    const menuActions = [
      () => handleLikeClick({} as React.MouseEvent),
      handleAddToQueue,
      handleHideTrack,
      handleArtistClick,
      handleAlbumClick,
      handleInfoClick,
      handleShareClick,
    ];

    if (index >= menuActions.length) return;
    menuActions[index]();
    setMenuOpen(false);
  };

  const handleCloseMenu = () => {
    setMenuOpen(false);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-[50px_1.47fr_1.57fr_0.8fr_50px_80px_40px] gap-4 items-center px-4 py-3 rounded-lg">
        {/* Номер трека - скелетон */}
        <div className="h-6 w-6 bg-gradient-to-r from-white/10 via-white/20 to-white/10 backdrop-blur-md border border-white/20 rounded-md relative overflow-hidden mx-auto">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-shimmer"></div>
        </div>

        {/* Информация о треке - скелетон */}
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-[65px] h-[65px] bg-gradient-to-br from-white/10 via-white/20 to-white/5 backdrop-blur-md border border-white/20 rounded-lg relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-shimmer"></div>
          </div>
          <div className="flex flex-col justify-center gap-2 min-w-0">
            <div className="h-5 w-36 bg-gradient-to-r from-white/10 via-white/20 to-white/10 backdrop-blur-md border border-white/20 rounded-md relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-shimmer-delayed"></div>
            </div>
            <div className="h-4 w-24 bg-gradient-to-r from-white/8 via-white/15 to-white/8 backdrop-blur-md border border-white/15 rounded-md relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -skew-x-12 animate-shimmer-delayed-2"></div>
            </div>
          </div>
        </div>

        {/* Альбом - скелетон */}
        <div className="flex justify-center">
          <div className="h-4 w-20 bg-gradient-to-r from-white/8 via-white/15 to-white/8 backdrop-blur-md border border-white/15 rounded-md relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -skew-x-12 animate-shimmer"></div>
          </div>
        </div>

        {/* Дата - скелетон */}
        <div className="flex justify-center">
          <div className="h-4 w-16 bg-gradient-to-r from-white/8 via-white/15 to-white/8 backdrop-blur-md border border-white/15 rounded-md relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -skew-x-12 animate-shimmer-delayed"></div>
          </div>
        </div>

        {/* Сердечко - скелетон */}
        <div className="flex justify-center">
          <div className="w-5 h-5 bg-gradient-to-r from-white/10 via-white/20 to-white/10 backdrop-blur-md border border-white/20 rounded-full relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-shimmer-delayed-2"></div>
          </div>
        </div>

        {/* Длительность - скелетон */}
        <div className="flex justify-center">
          <div className="h-4 w-8 bg-gradient-to-r from-white/8 via-white/15 to-white/8 backdrop-blur-md border border-white/15 rounded-md relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -skew-x-12 animate-shimmer"></div>
          </div>
        </div>

        {/* Троеточие - скелетон */}
        <div className="flex justify-center">
          <div className="w-5 h-5 bg-gradient-to-r from-white/10 via-white/20 to-white/10 backdrop-blur-md border border-white/20 rounded-sm relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-shimmer-delayed"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="grid grid-cols-[50px_1.47fr_1.57fr_0.8fr_50px_80px_40px] gap-4 items-center px-4 pt-3 pb-2 hover:bg-white/5 rounded-lg transition-colors duration-200 group cursor-pointer "
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={playTrackWithContext} // Используем новую функцию вместо togglePlayPause
    >
      {/* Номер трека */}
      <div className={`text-2xl text-${isThisTrackPlaying ? "white" : "white/50"} text-center`}>{index + 1}</div>

      {/* Информация о треке */}
      <div className="flex items-center gap-4 min-w-0">
        <div
          className="w-[65px] h-[65px] rounded-lg flex items-center justify-center relative overflow-hidden group"
        >
          <div
            className="absolute inset-0 bg-cover bg-center rounded-lg"
            style={{ backgroundImage: `url(${track?.coverUrl})` }}
          />

          <div
            className={`absolute inset-0 transition bg-black rounded-lg ${
              hover ? "opacity-50" : "opacity-0"
            }`}
            style={{ zIndex: 20 }}
          />

          {hover && (
            <div className="flex items-center justify-center absolute inset-0 z-30">
              {isThisTrackPlaying ? (
                <PauseOutlined
                  style={{
                    color: "white",
                    fontSize: "36px",
                    filter: "drop-shadow(0 2px 8px #222)",
                    cursor: "pointer",
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePlayPause();
                  }}
                />
              ) : (
                <CaretRightOutlined
                  style={{
                    color: "white",
                    fontSize: "40px",
                    filter: "drop-shadow(0 2px 8px #222)",
                    cursor: "pointer",
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePlayPause();
                  }}
                />
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col justify-center min-w-0">
          <h1
            className="text-lg font-medium truncate transition-colors text-white group-hover:text-white/90"
          >
            {track.name}
          </h1>
          <h1 className="text-lg text-white/60 truncate">
            {track.artist.name}
          </h1>
        </div>
      </div>

      {/* Альбом */}
      <div className="text-lg text-white/60 truncate text-center">
        {track.album || track.name}
      </div>

      {/* Дата добавления */}
      <div className="text-lg text-white/60 text-center">
        {formatDate(track.createdAt)}
      </div>

      {/* Сердечко - показываем состояние лайка */}
      <div className="flex justify-center transition-all duration-300" style={{ opacity: hover ? 1 : 0 }}>
        {liked ? (
          <HeartFilled
            style={{
              color: likeHover ? "#F93822" : "red",
              fontSize: "18px",
            }}
            className="cursor-pointer transition-all duration-200"
            onMouseEnter={() => setLikeHover(true)}
            onMouseLeave={() => setLikeHover(false)}
            onClick={handleLikeClick}
          />
        ) : (
          <HeartOutlined
            style={{
              color: hover
                ? likeHover
                  ? "#D3D3D3"
                  : "rgba(255, 255, 255, 0.6)"
                : "transparent",
              fontSize: "18px",
            }}
            className="cursor-pointer transition-all duration-200"
            onMouseEnter={() => setLikeHover(true)}
            onMouseLeave={() => setLikeHover(false)}
            onClick={handleLikeClick}
          />
        )}
      </div>

      {/* Длительность */}
      <div className="text-lg text-white/60 text-center">{duration}</div>

      {/* Троеточие - всегда занимает место, появляется при hover */}
      <div className="flex justify-center relative" ref={ellipsisRef}>
        <EllipsisOutlined
          style={{
            color: hover ? "rgba(255, 255, 255, 0.6)" : "transparent",
            fontSize: "18px",
          }}
          className="cursor-pointer transition-all duration-200"
          onClick={handleEllipsisClick}
        />

        <ContextMenu
          isOpen={menuOpen}
          onClose={handleCloseMenu}
          onMenuItemClick={handleMenuItemClick}
          anchorRef={ellipsisRef}
          isPlaying={isCurrentTrack}
          isLiked={liked}
        />
      </div>
    </div>
  );
};

export default TrackTemplate;
