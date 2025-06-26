import {
  CaretRightOutlined,
  EllipsisOutlined,
  HeartFilled,
  HeartOutlined,
  PauseOutlined,
} from "@ant-design/icons";
import { useState, useRef, useEffect } from "react";
import type { Track } from "../../../../types/TrackData";
import { useFormatTime } from "../../../../hooks/useFormatTime";
import type { AppDispatch, AppState } from "../../../../store";
import { useDispatch, useSelector } from "react-redux";
import {
  setCurrentTrack,
  setIsPlaying,
} from "../../../../state/CurrentTrack.slice";
import ContextMenu from "./ContextMenu";
import { addToQueue } from "../../../../state/Queue.slice";
import { useGetUserQuery } from "../../../../state/UserApi.slice";
import { toggleLike } from "../../../../state/LikeUpdate.slice";

interface TrackLayoutProps {
  track: Track | undefined;
  isLoading?: boolean;
}

export default function TrackLayout({
  track,
  isLoading = false,
}: TrackLayoutProps) {
  const [liked, setLiked] = useState(false);
  const [likeHover, setLikeHover] = useState(false);
  const [hover, setHover] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { data: user, isFetching } = useGetUserQuery();

  const ellipsisRef = useRef<HTMLDivElement>(null);

  const duration = useFormatTime(track?.duration || 0);
  const dispatch = useDispatch<AppDispatch>();
  const currentTrack = useSelector((state: AppState) => state.currentTrack);
  const likeUpdated = useSelector((state: AppState) => state.likeUpdate);

  const isCurrentTrack = currentTrack.currentTrack?._id === track?._id;
  const isThisTrackPlaying = isCurrentTrack && currentTrack.isPlaying;

  const togglePlayPause = () => {
    if (!track || isLoading) return;

    if (isCurrentTrack) {
      dispatch(setIsPlaying(!currentTrack.isPlaying));
    } else {
      dispatch(setCurrentTrack(track));
      setTimeout(() => {
        dispatch(setIsPlaying(true));
      }, 50);
    }
  };

  useEffect(() => {
    console.log("Like effect:", {
      isFetching,
      user,
      currentTrack,
      likeUpdated,
    });
    if (!isFetching && user && track) {
      const isLiked =
        user.likedSongs.includes(track._id) ||
        likeUpdated.trackId.includes(track._id);
      setLiked(isLiked);
    }
  }, [isFetching, track, likeUpdated.isLiked]);

  const handleEllipsisClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(!menuOpen);
  };

  const handleLikeClick = async () => {
    if (isFetching || !user?._id || !track?._id) return; // Защита от пустых ID
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
        setLiked(!liked); // Инвертируем состояние
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
      handleLikeClick,
      handleAddToQueue,
      handleHideTrack,
      handleArtistClick,
      handleAlbumClick,
      handleInfoClick,
      handleShareClick,
    ];

    if (index >= menuActions.length) return;

    menuActions[index]();

    console.log(`Clicked: ${menuActions[index]} for track: ${track?.name}`);
  };

  const handleCloseMenu = () => {
    setMenuOpen(false);
  };

  return (
    <div
      className={`flex justify-between items-center w-[40vw] ${
        isLoading ? "pointer-events-none" : "cursor-pointer"
      }`}
      onMouseEnter={() => !isLoading && setHover(true)}
      onMouseLeave={() => !isLoading && setHover(false)}
    >
      <div className="flex gap-3 items-end justify-center">
        <div className="w-[65px] h-[65px] rounded-[10px] flex items-center justify-center relative overflow-hidden group">
          {isLoading ? (
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-white/20 to-white/5 backdrop-blur-md border border-white/20 rounded-[10px]">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-shimmer"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-white/40 text-2xl">🎵</div>
              </div>
            </div>
          ) : (
            <>
              <div
                className="absolute inset-0 bg-cover bg-center rounded-[10px]"
                style={{ backgroundImage: `url(${track?.coverUrl})` }}
              />

              <div
                className={`absolute inset-0 transition bg-black rounded-[10px] ${
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
                        fontSize: "32px",
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
                        fontSize: "32px",
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
            </>
          )}
        </div>

        <div className="flex flex-col gap-2">
          {isLoading ? (
            <div className="h-5 w-36 bg-gradient-to-r from-white/10 via-white/20 to-white/10 backdrop-blur-md border border-white/20 rounded-md relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-shimmer-delayed"></div>
            </div>
          ) : (
            <h1 className="text-white text-lg tracking-wider">{track?.name}</h1>
          )}

          {isLoading ? (
            <div className="h-4 w-16 bg-gradient-to-r from-white/8 via-white/15 to-white/8 backdrop-blur-md border border-white/15 rounded-md relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -skew-x-12 animate-shimmer-delayed-2"></div>
            </div>
          ) : (
            <h1
              className="text-sm tracking-wider"
              style={{ color: "rgba(255, 255, 255, 0.6)" }}
            >
              {track?.listenCount}
            </h1>
          )}
        </div>
      </div>

      <div className="flex gap-4 items-center relative">
        {isLoading ? (
          <div className="h-4 w-12 mr-20 bg-gradient-to-r from-white/8 via-white/15 to-white/8 backdrop-blur-md border border-white/15 rounded-md relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -skew-x-12 animate-shimmer"></div>
          </div>
        ) : (
          <h1 style={{ color: "rgba(255, 255, 255, 0.6)" }} className="mr-20">
            {duration}
          </h1>
        )}

        {isLoading ? (
          <div className="w-5 h-5 bg-gradient-to-r from-white/10 via-white/20 to-white/10 backdrop-blur-md border border-white/20 rounded-full relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-shimmer-delayed"></div>
          </div>
        ) : liked ? (
          <HeartFilled
            style={{
              color: likeHover ? "#F93822" : "red",
              fontSize: "1.1rem",
            }}
            className="pb-1 cursor-pointer transition-all duration-200"
            onMouseEnter={() => setLikeHover(true)}
            onMouseLeave={() => setLikeHover(false)}
            onClick={handleLikeClick}
          />
        ) : (
          <HeartOutlined
            style={{
              color: likeHover ? "#D3D3D3" : "white",
              fontSize: "1.1rem",
            }}
            className="pb-1 cursor-pointer transition-all duration-200"
            onMouseEnter={() => setLikeHover(true)}
            onMouseLeave={() => setLikeHover(false)}
            onClick={handleLikeClick}
          />
        )}

        {isLoading ? (
          <div className="w-5 h-5 bg-gradient-to-r from-white/10 via-white/20 to-white/10 backdrop-blur-md border border-white/20 rounded-sm relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-shimmer-delayed-2"></div>
          </div>
        ) : (
          <div className="relative" ref={ellipsisRef}>
            <EllipsisOutlined
              style={{ color: "white" }}
              className="cursor-pointer transition-all duration-200 hover:scale-110"
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
        )}
      </div>
    </div>
  );
}
