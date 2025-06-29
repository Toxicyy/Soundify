import { useRef, useState, useEffect, type FC } from "react";
import type { Track } from "../../../types/TrackData";
import { useFormatTime } from "../../../hooks/useFormatTime";
import { useLike } from "../../../hooks/useLike";
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
import { addToQueue, playTrackAndQueue } from "../../../state/Queue.slice";
import {
  setCurrentTrack,
  setIsPlaying,
} from "../../../state/CurrentTrack.slice";

type TrackTemplateProps = {
  track: Track;
  index: number;
  isLoading?: boolean;
  allTracks?: Track[];
};

const TrackTemplate: FC<TrackTemplateProps> = ({
  track,
  index,
  isLoading = false,
  allTracks = [],
}) => {
  const [hover, setHover] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [likeHover, setLikeHover] = useState(false);

  // Состояния изображения
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const duration = useFormatTime(track?.duration || 0);
  const dispatch = useDispatch<AppDispatch>();
  const currentTrack = useSelector((state: AppState) => state.currentTrack);
  const isCurrentTrack = currentTrack.currentTrack?._id === track?._id;
  const isThisTrackPlaying = isCurrentTrack && currentTrack.isPlaying;
  const ellipsisRef = useRef<HTMLDivElement>(null);

  // Загрузка изображения
  useEffect(() => {
    if (!track?.coverUrl || isLoading) {
      setImageError(true);
      setImageLoaded(false);
      return;
    }

    setImageLoaded(false);
    setImageError(false);

    const img = new Image();

    img.onload = () => {
      console.log(`✅ Image loaded: ${track.name}`);
      setImageLoaded(true);
      setImageError(false);
    };

    img.onerror = (error) => {
      console.error(`❌ Image failed: ${track.name}`, error);
      setImageLoaded(false);
      setImageError(true);
    };

    img.src = track.coverUrl;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [track?.coverUrl, isLoading]);

  // Используем кастомный хук для лайков
  const {
    isLiked,
    isPending: likePending,
    toggleLike,
  } = useLike(isLoading ? "" : track._id);

  // Остальные функции...
  const playTrackWithContext = () => {
    if (!track || isLoading) return;
    if (allTracks && allTracks.length > 0) {
      dispatch(
        playTrackAndQueue({ contextTracks: allTracks, startIndex: index })
      );
    } else {
      dispatch(setCurrentTrack(track));
      dispatch(setIsPlaying(true));
    }
  };

  const togglePlayPause = () => {
    if (!track || isLoading) return;
    if (isCurrentTrack) {
      dispatch(setIsPlaying(!currentTrack.isPlaying));
    } else {
      playTrackWithContext();
    }
  };

  const handleEllipsisClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(!menuOpen);
  };

  const handleLikeClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isLoading) {
      await toggleLike();
    }
  };

  const handleAddToQueue = () => {
    if (!track || isLoading) return;
    dispatch(addToQueue(track));
  };

  const handleMenuItemClick = (index: number) => {
    const menuActions = [
      () => handleLikeClick({} as React.MouseEvent),
      handleAddToQueue,
      () => console.log("Hide track clicked"),
      () => console.log("Artist clicked"),
      () => console.log("Album clicked"),
      () => console.log("Info clicked"),
      () => console.log("Share clicked"),
    ];
    if (index < menuActions.length) {
      menuActions[index]();
      setMenuOpen(false);
    }
  };

  // Скелетон состояние
  if (isLoading) {
    return (
      <div className="grid grid-cols-[50px_1.47fr_1fr_0.1fr_0.1fr_40px] gap-4 items-center px-4 py-3 rounded-lg">
        <div className="h-6 w-6 bg-gradient-to-r from-white/10 via-white/20 to-white/10 backdrop-blur-md border border-white/20 rounded-md relative overflow-hidden mx-auto">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-shimmer"></div>
        </div>
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
        <div className="flex justify-center">
          <div className="h-4 w-16 bg-gradient-to-r from-white/8 via-white/15 to-white/8 backdrop-blur-md border border-white/15 rounded-md relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -skew-x-12 animate-shimmer"></div>
          </div>
        </div>
        <div className="flex justify-center">
          <div className="w-5 h-5 bg-gradient-to-r from-white/10 via-white/20 to-white/10 backdrop-blur-md border border-white/20 rounded-full relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-shimmer-delayed-2"></div>
          </div>
        </div>
        <div className="flex justify-center">
          <div className="h-4 w-8 bg-gradient-to-r from-white/8 via-white/15 to-white/8 backdrop-blur-md border border-white/15 rounded-md relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -skew-x-12 animate-shimmer"></div>
          </div>
        </div>
        <div className="flex justify-center">
          <div className="w-5 h-5 bg-gradient-to-r from-white/10 via-white/20 to-white/10 backdrop-blur-md border border-white/20 rounded-sm relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-shimmer-delayed"></div>
          </div>
        </div>
      </div>
    );
  }

  // Основное состояние с данными
  return (
    <div
      className="grid grid-cols-[50px_1.47fr_1fr_0.1fr_0.1fr_40px] gap-4 items-center px-4 pt-3 pb-2 hover:bg-white/5 rounded-lg transition-colors duration-200 group cursor-pointer"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={playTrackWithContext}
    >
      {/* Номер трека */}
      <div
        className={`text-2xl text-${
          isThisTrackPlaying ? "white" : "white/50"
        } text-center`}
      >
        {index + 1}
      </div>

      {/* Информация о треке */}
      <div className="flex items-center gap-4 min-w-0">
        <div className="w-[65px] h-[65px] rounded-lg flex items-center justify-center relative overflow-hidden">
          {/* ВСЕГДА показываем заглушку как базовый слой */}
          <div
            className="absolute inset-0 bg-gradient-to-br from-purple-500/70 via-blue-500/70 to-pink-500/70 rounded-lg flex items-center justify-center"
            style={{ zIndex: 1 }}
          >
            <svg
              className="w-8 h-8 text-white/80"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
              />
            </svg>
          </div>

          {/* Реальное изображение ПОВЕРХ заглушки (если загружено) */}
          {imageLoaded && !imageError && (
            <div
              className="absolute inset-0 bg-cover bg-center rounded-lg"
              style={{
                backgroundImage: `url(${track?.coverUrl})`,
                zIndex: 2,
              }}
            />
          )}

          {/* Overlay при hover - поверх изображения (z-index: 20) */}
          <div
            className={`absolute inset-0 transition bg-black rounded-lg ${
              hover ? "opacity-50" : "opacity-0"
            }`}
            style={{ zIndex: 20 }}
          />

          {/* Кнопка play/pause - самый верхний слой (z-index: 30) */}
          {hover && (
            <div
              className="flex items-center justify-center absolute inset-0"
              style={{ zIndex: 30 }}
            >
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
          <h1 className="text-lg font-medium truncate transition-colors text-white group-hover:text-white/90">
            {track.name}
          </h1>
          <h1 className="text-lg text-white/60 truncate">
            {track.artist?.name}
          </h1>
        </div>
      </div>

      {/* Прослушивания */}
      <div className="text-lg text-white/60 truncate text-center">
        {track.listenCount?.toLocaleString()}
      </div>

      {/* Сердечко */}
      <div
        className="flex justify-center transition-all duration-300"
        style={{ opacity: hover ? 1 : 0 }}
      >
        {likePending ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
        ) : isLiked ? (
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

      {/* Троеточие */}
      <div className="flex justify-center relative" ref={ellipsisRef}>
        <EllipsisOutlined
          style={{
            color: hover ? "rgba(255, 255, 255, 1)" : "transparent",
            fontSize: "18px",
          }}
          className="cursor-pointer transition-all duration-200"
          onClick={handleEllipsisClick}
        />
        <ContextMenu
          isOpen={menuOpen}
          onClose={() => setMenuOpen(false)}
          onMenuItemClick={handleMenuItemClick}
          anchorRef={ellipsisRef}
          isPlaying={isCurrentTrack}
          isLiked={isLiked}
        />
      </div>
    </div>
  );
};

export default TrackTemplate;
