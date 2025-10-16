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

interface TrackTemplateProps {
  track: Track;
  index: number;
  isLoading?: boolean;
  allTracks?: Track[];
}

/**
 * Formats date to DD/MM/YYYY
 */
function formatDate(dateStr: Date): string {
  const date = new Date(dateStr);
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Track item component for liked songs list
 * Supports desktop table and mobile compact layouts
 */
const TrackTemplate: FC<TrackTemplateProps> = ({
  track,
  index,
  isLoading = false,
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

  const {
    isLiked,
    isPending: likePending,
    toggleLike,
  } = useLike(track?._id || "");

  const playTrackWithContext = useCallback(() => {
    if (!track || isLoading) return;

    if (allTracks && allTracks.length > 0) {
      dispatch(
        playTrackAndQueue({
          contextTracks: allTracks,
          startIndex: index,
        })
      );
    } else {
      dispatch(setCurrentTrack(track));
      dispatch(setIsPlaying(true));
    }
  }, [track, isLoading, allTracks, index, dispatch]);

  const togglePlayPause = useCallback(() => {
    if (!track || isLoading) return;

    if (isCurrentTrack) {
      dispatch(setIsPlaying(!currentTrack.isPlaying));
    } else {
      playTrackWithContext();
    }
  }, [
    track,
    isLoading,
    isCurrentTrack,
    currentTrack.isPlaying,
    playTrackWithContext,
    dispatch,
  ]);

  const handleEllipsisClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setMenuOpen(!menuOpen);
      setNoClickHover(!menuOpen);
    },
    [menuOpen]
  );

  const handleLikeClick = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (track?._id) {
        await toggleLike();
      }
    },
    [track?._id, toggleLike]
  );

  const handleAddToQueue = useCallback(() => {
    if (!track) return;
    dispatch(addToQueue(track));
  }, [track, dispatch]);

  const handleArtistClick = useCallback(() => {
    if (!track?.artist?._id) return;
    navigate(`/artist/${track.artist._id}`);
  }, [track?.artist?._id, navigate]);

  const handleAlbumClick = useCallback(() => {
    if (!track) return;
    if (track.album === "single") {
      navigate(`/single/${track._id}`);
    } else {
      navigate(`/album/${track.album?._id}`);
    }
  }, [track, navigate]);

  const handleInfoClick = useCallback(() => {
    if (!track?._id) return;
    navigate(`/track/${track._id}`);
  }, [track?._id, navigate]);

  const handleShareClick = useCallback(async () => {
    try {
      if (!track?._id) return;
      const url = `${window.location.origin}/track/${track._id}`;

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
      if (error === "AbortError") return;

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

  const handleMenuItemClick = useCallback(
    (index: number) => {
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
    },
    [
      handleLikeClick,
      handleAddToQueue,
      handleArtistClick,
      handleAlbumClick,
      handleInfoClick,
      handleShareClick,
    ]
  );

  const handleCloseMenu = useCallback(() => {
    setMenuOpen(false);
  }, []);

  if (!track) {
    return (
      <div className="grid grid-cols-[50px_1.47fr_1.57fr_0.8fr_50px_80px_40px] xl:grid-cols-[50px_1.47fr_1.57fr_0.8fr_50px_80px_40px] gap-4 items-center px-4 py-3 rounded-lg">
        <div className="text-2xl text-white/50 text-center">-</div>
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-[65px] h-[65px] bg-white/10 rounded-lg" />
          <div className="flex flex-col justify-center min-w-0">
            <h1 className="text-lg font-medium text-white/50">
              Track not found
            </h1>
            <h1 className="text-lg text-white/30">Unknown artist</h1>
          </div>
        </div>
      </div>
    );
  }

  const MobileLayout = () => (
    <div
      className={`flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 rounded-lg transition-colors duration-200 cursor-pointer ${
        isCurrentTrack ? "bg-white/10" : ""
      }`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={noClickHover ? () => {} : playTrackWithContext}
    >
      <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
        <img
          src={track?.coverUrl || "/default-cover.jpg"}
          alt={track?.name || "Unknown track"}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />

        {track?.artist?._id && (
          <Link to={`/artist/${track.artist._id}`}>
            <h2
              className="text-xs text-white/60 truncate hover:underline cursor-pointer mt-0.5"
              onMouseEnter={() => setNoClickHover(true)}
              onMouseLeave={() => setNoClickHover(false)}
            >
              {track?.artist?.name || "Unknown artist"}
            </h2>
          </Link>
        )}
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-xs text-white/50">{duration}</span>

        <div className="w-6 flex justify-center">
          {likePending ? (
            <div className="animate-spin rounded-full h-3 w-3 border-b border-white" />
          ) : isLiked ? (
            <HeartFilled
              style={{ color: likeHover ? "#F93822" : "red", fontSize: "14px" }}
              className="cursor-pointer transition-colors duration-200"
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
                fontSize: "14px",
              }}
              className="cursor-pointer transition-colors duration-200"
              onMouseEnter={() => setLikeHover(true)}
              onMouseLeave={() => setLikeHover(false)}
              onClick={handleLikeClick}
            />
          )}
        </div>

        <div className="relative w-6 flex justify-center" ref={ellipsisRef}>
          <EllipsisOutlined
            style={{
              color: hover ? "rgba(255, 255, 255, 0.6)" : "transparent",
              fontSize: "14px",
            }}
            className="cursor-pointer transition-colors duration-200"
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
    </div>
  );

  const DesktopLayout = () => (
    <div
      className="grid grid-cols-[50px_1.47fr_1.57fr_0.8fr_50px_80px_40px] gap-4 items-center px-4 pt-3 pb-2 hover:bg-white/5 rounded-lg transition-colors duration-200 group cursor-pointer"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={noClickHover ? () => {} : playTrackWithContext}
    >
      <div
        className={`text-2xl text-${
          isThisTrackPlaying ? "white" : "white/50"
        } text-center`}
      >
        {index + 1}
      </div>

      <div className="flex items-center gap-4 min-w-0">
        <div className="w-[65px] h-[65px] rounded-lg flex items-center justify-center relative overflow-hidden group">
          <img
            src={track?.coverUrl || "/default-cover.jpg"}
            alt={track?.name || "Unknown track"}
            className="w-full h-full object-cover rounded-lg"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
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

      <div className="text-lg text-white/60 truncate text-center">
        {track?.album === "single"
          ? track?.name
          : track?.album?.name || "Unknown album"}
      </div>

      <div className="text-lg text-white/60 text-center">
        {track?.createdAt ? formatDate(track.createdAt) : "-"}
      </div>

      <div
        className="flex justify-center transition-all duration-300"
        style={{ opacity: hover ? 1 : 0 }}
      >
        {likePending ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
        ) : isLiked ? (
          <HeartFilled
            style={{ color: likeHover ? "#F93822" : "red", fontSize: "18px" }}
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

      <div className="text-lg text-white/60 text-center">{duration}</div>

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

  if (isLoading) {
    return (
      <div className="block xl:hidden">
        <div className="flex items-center gap-3 px-3 py-2.5">
          <div className="w-12 h-12 bg-gradient-to-br from-white/10 via-white/20 to-white/5 rounded-lg animate-pulse" />
          <div className="flex-1 min-w-0">
            <div className="h-4 bg-white/10 rounded mb-1 animate-pulse" />
            <div className="h-3 bg-white/5 rounded w-3/4 animate-pulse" />
          </div>
          <div className="w-8 h-3 bg-white/5 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="block xl:hidden">
        <MobileLayout />
      </div>

      <div className="hidden xl:block">
        <DesktopLayout />
      </div>
    </>
  );
};

export default TrackTemplate;