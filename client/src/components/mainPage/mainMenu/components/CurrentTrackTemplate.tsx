import { memo, useState, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  PauseOutlined,
  CaretRightOutlined,
  EllipsisOutlined,
} from "@ant-design/icons";
import { useFormatTime } from "../../../../hooks/useFormatTime";
import { useLike } from "../../../../hooks/useLike";
import { useNotification } from "../../../../hooks/useNotification";
import { type AppDispatch, type AppState } from "../../../../store";
import { setIsPlaying } from "../../../../state/CurrentTrack.slice";
import { addToQueue } from "../../../../state/Queue.slice";
import type { Track } from "../../../../types/TrackData";
import ContextMenu from "../../../mainPage/mainMenu/components/ContextMenu";

interface CurrentTrackTemplateProps {
  track: Track;
}

/**
 * Template for currently playing track in queue
 * Shows play controls, track info, and context menu
 */
const CurrentTrackTemplate = ({ track }: CurrentTrackTemplateProps) => {
  const [hover, setHover] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const ellipsisRef = useRef<HTMLDivElement>(null);

  const dispatch = useDispatch<AppDispatch>();
  const currentTrack = useSelector((state: AppState) => state.currentTrack);
  const isCurrentTrack = currentTrack.currentTrack?._id === track?._id;
  const isPlaying = currentTrack.isPlaying && isCurrentTrack;
  const navigate = useNavigate();
  const { showError, showSuccess } = useNotification();

  const { isLiked, isPending: likePending, toggleLike } = useLike(track._id);

  const togglePlayPause = useCallback(() => {
    dispatch(setIsPlaying(!isPlaying));
  }, [dispatch, isPlaying]);

  const handleEllipsisClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen((prev) => !prev);
  }, []);

  const handleLikeClick = useCallback(async () => {
    if (!track?._id) return;
    await toggleLike();
  }, [track, toggleLike]);

  const handleAddToQueue = useCallback(() => {
    if (!track) return;
    dispatch(addToQueue(track));
  }, [track, dispatch]);

  const handleArtistClick = useCallback(() => {
    navigate(`/artist/${track.artist._id}`);
  }, [navigate, track.artist._id]);

  const handleAlbumClick = useCallback(() => {
    if (track.album === "single") {
      navigate(`/single/${track._id}`);
    } else {
      navigate(`/album/${track.album}`);
    }
  }, [navigate, track.album, track._id]);

  const handleInfoClick = useCallback(() => {
    if (!track) return;
    navigate(`/track/${track._id}`);
  }, [navigate, track]);

  const handleShareClick = useCallback(async () => {
    try {
      if (!track) return;
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
      if (error === "AbortError") {
        return;
      }

      try {
        if (!track) return;
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
        handleLikeClick,
        handleAddToQueue,
        handleArtistClick,
        handleAlbumClick,
        handleInfoClick,
        handleShareClick,
      ];

      if (index >= menuActions.length) return;
      menuActions[index]();
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

  return (
    <div
      className="pr-4 pl-3 ml-6 py-3 bg-white/5 rounded-lg border border-white/10"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
            <img
              src={track.coverUrl}
              alt="Album Cover"
              className="w-full h-full object-cover"
            />
          </div>

          <div
            className="flex items-center justify-center cursor-pointer"
            onClick={togglePlayPause}
          >
            {isPlaying ? (
              <PauseOutlined
                style={{
                  color: "#5cec8c",
                  fontSize: "20px",
                  cursor: "pointer",
                }}
              />
            ) : (
              <CaretRightOutlined
                style={{
                  color: "#5cec8c",
                  fontSize: "20px",
                  cursor: "pointer",
                }}
              />
            )}
          </div>

          <div className="flex flex-col min-w-0 flex-1">
            <h1 className="text-white font-medium truncate">{track.name}</h1>
            <Link to={`/artist/${track.artist._id}`}>
              <h2 className="text-white/60 text-sm truncate hover:underline cursor-pointer">
                {track.artist.name}
              </h2>
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-white/50 text-sm">
            {useFormatTime(track.duration)}
          </span>

          <div className="relative" ref={ellipsisRef}>
            <EllipsisOutlined
              style={{ color: hover ? "white" : "rgba(255, 255, 255, 0.4)" }}
              className="cursor-pointer transition-all duration-200 hover:scale-110"
              onClick={handleEllipsisClick}
            />

            <ContextMenu
              isOpen={menuOpen}
              onClose={handleCloseMenu}
              onMenuItemClick={handleMenuItemClick}
              anchorRef={ellipsisRef}
              isPlaying={isCurrentTrack}
              isLiked={isLiked}
              isPending={likePending}
            />
          </div>
        </div>
      </div>

      {isPlaying && (
        <div className="flex items-center gap-2 mt-2 pl-16">
          <div className="flex items-center gap-1">
            <div className="w-1 h-3 bg-[#5cec8c] rounded-full animate-pulse" />
            <div className="w-1 h-2 bg-[#5cec8c] rounded-full animate-pulse delay-100" />
            <div className="w-1 h-4 bg-[#5cec8c] rounded-full animate-pulse delay-200" />
          </div>
          <span className="text-[#5cec8c] text-xs font-medium">
            NOW PLAYING
          </span>
        </div>
      )}
    </div>
  );
};

export default memo(CurrentTrackTemplate);
