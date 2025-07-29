import { useCallback, useRef, useState, type FC } from "react";
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
import { Link, useNavigate } from "react-router-dom";
import { useNotification } from "../../../hooks/useNotification";

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
  const [likeHover, setLikeHover] = useState(false);
  const [noClickHover, setNoClickHover] = useState(false);

  const duration = useFormatTime(track?.duration || 0);
  const dispatch = useDispatch<AppDispatch>();
  const currentTrack = useSelector((state: AppState) => state.currentTrack);
  const isCurrentTrack = currentTrack.currentTrack?._id === track?._id;
  const isThisTrackPlaying = isCurrentTrack && currentTrack.isPlaying;
  const ellipsisRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { showError, showSuccess } = useNotification();

  // Используем кастомный хук для лайков только если трек существует
  const {
    isLiked,
    isPending: likePending,
    toggleLike,
  } = useLike(track?._id || "");

  // Функция для воспроизведения трека с созданием очереди
  const playTrackWithContext = () => {
    if (!track || isLoading) return;

    if (allTracks && allTracks.length > 0) {
      console.log("Creating queue from context:", {
        trackName: track.name,
        startIndex: index,
        totalTracks: allTracks.length,
      });

      dispatch(
        playTrackAndQueue({
          contextTracks: allTracks,
          startIndex: index,
        })
      );
    } else {
      console.log("No context tracks, playing single track");
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
    setNoClickHover(!menuOpen);
  };

  const handleLikeClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (track?._id) {
      await toggleLike();
    }
  };

  const handleAddToQueue = () => {
    if (!track) return;
    dispatch(addToQueue(track));
  };

  const handleArtistClick = () => {
    if (!track?.artist?._id) return;
    navigate(`/artist/${track.artist._id}`);
  };

  const handleAlbumClick = () => {
    if (!track) return;
    if (track.album === "single") {
      navigate(`/single/${track._id}`);
    } else {
      navigate(`/album/${track.album?._id}`);
    }
  };

  const handleInfoClick = () => {
    if (!track?._id) return;
    navigate(`/track/${track._id}`);
  };

  const handleShareClick = useCallback(async () => {
    try {
      if (!track?._id) return;
      const url = `${window.location.origin}/track/${track._id}`;

      // Проверяем поддержку Web Share API (для мобильных устройств)
      if (navigator.share && /Mobi|Android/i.test(navigator.userAgent)) {
        const artistName =
          typeof track.artist === "string" ? track.artist : track.artist?.name;

        await navigator.share({
          title: `${track.name} - ${artistName}`,
          text: `Listen to "${track.name}" by ${artistName} on Soundify`,
          url: url,
        });

        showSuccess("Track shared successfully!");
      } else {
        await navigator.clipboard.writeText(url);
        showSuccess("Track link copied to clipboard!");
      }
    } catch (error) {
      // Обработка ошибок
      if (error === "AbortError") {
        return;
      }

      console.error("Share failed:", error);

      try {
        if (!track?._id) return;
        const url = `${window.location.origin}/track/${track._id}`;
        await navigator.clipboard.writeText(url);
        showSuccess("Track link copied to clipboard!");
      } catch (clipboardError) {
        showError("Failed to share track. Please copy the URL manually.");
      }
    }
  }, [track, showSuccess, showError]);

  const handleMenuItemClick = (index: number) => {
    const menuActions = [
      () => handleLikeClick({} as React.MouseEvent),
      handleAddToQueue,
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

  // Ранняя проверка на отсутствие трека
  if (!track) {
    return (
      <div className="grid grid-cols-[50px_1.47fr_1.57fr_0.8fr_50px_80px_40px] gap-4 items-center px-4 py-3 rounded-lg">
        <div className="text-2xl text-white/50 text-center">-</div>
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-[65px] h-[65px] bg-white/10 rounded-lg"></div>
          <div className="flex flex-col justify-center min-w-0">
            <h1 className="text-lg font-medium text-white/50">
              Track not found
            </h1>
            <h1 className="text-lg text-white/30">Unknown artist</h1>
          </div>
        </div>
        <div className="text-lg text-white/30 text-center">-</div>
        <div className="text-lg text-white/30 text-center">-</div>
        <div className="flex justify-center"></div>
        <div className="text-lg text-white/30 text-center">-</div>
        <div className="flex justify-center"></div>
      </div>
    );
  }

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
      className="grid grid-cols-[50px_1.47fr_1.57fr_0.8fr_50px_80px_40px] gap-4 items-center px-4 pt-3 pb-2 hover:bg-white/5 rounded-lg transition-colors duration-200 group cursor-pointer"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={noClickHover ? () => {} : playTrackWithContext}
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
        <div className="w-[65px] h-[65px] rounded-lg flex items-center justify-center relative overflow-hidden group">
          {/* Изображение обложки */}
          <img
            src={track?.coverUrl || "/default-cover.jpg"}
            alt={track?.name || "Unknown track"}
            className="w-full h-full object-cover rounded-lg"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />

          {/* Overlay при hover */}
          <div
            className={`absolute inset-0 transition bg-black rounded-lg ${
              hover ? "opacity-50" : "opacity-0"
            }`}
            style={{ zIndex: 20 }}
          />

          {/* Кнопки play/pause при hover */}
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
          <h1 className="text-lg font-medium truncate transition-colors text-white group-hover:text-white/90">
            {track?.name || "Unknown track"}
          </h1>
          {track?.artist?._id && (
            <Link to={`/artist/${track.artist._id}`} className="mt-1">
              <h1
                className="text-lg text-white/60 truncate hover:underline cursor-pointer"
                onMouseEnter={() => setNoClickHover(true)}
                onMouseLeave={() => setNoClickHover(false)}
              >
                {track?.artist?.name || "Unknown artist"}
              </h1>
            </Link>
          )}
        </div>
      </div>

      {/* Альбом */}
      <div className="text-lg text-white/60 truncate text-center">
        {track?.album === "single"
          ? track?.name
          : track?.album?.name || "Unknown album"}
      </div>

      {/* Дата добавления */}
      <div className="text-lg text-white/60 text-center">
        {track?.createdAt ? formatDate(track.createdAt) : "-"}
      </div>

      {/* Сердечко - показываем состояние лайка */}
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
          isLiked={isLiked}
        />
      </div>
    </div>
  );
};

export default TrackTemplate;
