import React, { useState, useRef, useCallback } from "react";
import {
  CaretRightOutlined,
  PauseOutlined,
  HeartFilled,
  HeartOutlined,
  EllipsisOutlined,
} from "@ant-design/icons";
import type { Track } from "../../../types/TrackData";
import { useDispatch, useSelector } from "react-redux";
import { playTrackAndQueue, addToQueue } from "../../../state/Queue.slice";
import { setIsPlaying } from "../../../state/CurrentTrack.slice";
import type { AppDispatch, AppState } from "../../../store";
import { useFormatTime } from "../../../hooks/useFormatTime";
import { useLike } from "../../../hooks/useLike";
import ContextMenu from "../../mainPage/mainMenu/components/ContextMenu";
import { useNavigate } from "react-router-dom";

interface DraggableTrackTemplateProps {
  track: Track;
  index: number;
  isLoading?: boolean;
  allTracks: Track[];
  onDragStart?: (index: number) => void;
  onDragEnd?: (fromIndex: number, toIndex: number) => void;
  onRemove?: (trackId: string) => void;
  isEditable?: boolean;
  isDragging?: boolean;
  dragOverIndex?: number | null;
}

/**
 * Компонент трека с поддержкой Drag & Drop в стиле TrackTemplate
 */
const DraggableTrackTemplate: React.FC<DraggableTrackTemplateProps> = ({
  track,
  index,
  isLoading = false,
  allTracks,
  onDragStart,
  onDragEnd,
  onRemove,
  isEditable = false,
  isDragging = false,
  dragOverIndex = null,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const currentTrackState = useSelector(
    (state: AppState) => state.currentTrack
  );

  // Local state
  const [dragStartIndex, setDragStartIndex] = useState<number | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isLikeHovered, setIsLikeHovered] = useState(false);
  const [isContextMenuHovered, setIsContextMenuHovered] = useState(false);
  const dragRef = useRef<HTMLDivElement>(null);
  const ellipsisRef = useRef<HTMLDivElement>(null);

  // Computed values
  const isCurrentTrack = currentTrackState.currentTrack?._id === track._id;
  const isPlaying = isCurrentTrack && currentTrackState.isPlaying;
  const navigate = useNavigate();

  // Custom hooks
  const duration = useFormatTime(track?.duration || 0);
  const {
    isLiked,
    isPending: likePending,
    toggleLike,
  } = useLike(isLoading ? "" : track._id);

  /**
   * Обработка воспроизведения трека
   */
  const handlePlayTrack = useCallback(() => {
    if (isCurrentTrack) {
      dispatch(setIsPlaying(!currentTrackState.isPlaying));
    } else {
      dispatch(
        playTrackAndQueue({
          contextTracks: allTracks,
          startIndex: index,
        })
      );
    }
  }, [dispatch, isCurrentTrack, currentTrackState.isPlaying, allTracks, index]);

  /**
   * Drag & Drop обработчики
   */
  const handleDragStart = useCallback(
    (e: React.DragEvent) => {
      if (!isEditable) return;

      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", index.toString());

      // Создаем кастомный drag image
      const dragImage = dragRef.current?.cloneNode(true) as HTMLElement;
      if (dragImage) {
        dragImage.style.opacity = "0.8";
        dragImage.style.transform = "rotate(2deg)";
        dragImage.style.width = `${dragRef.current?.offsetWidth}px`;
        document.body.appendChild(dragImage);
        e.dataTransfer.setDragImage(dragImage, 0, 0);
        setTimeout(() => document.body.removeChild(dragImage), 0);
      }

      setDragStartIndex(index);
      onDragStart?.(index);
    },
    [index, isEditable, onDragStart]
  );

  const handleDragEnd = useCallback(() => {
    if (!isEditable) return;

    const fromIndex = dragStartIndex;
    const toIndex = dragOverIndex;

    if (fromIndex !== null && toIndex !== null && fromIndex !== toIndex) {
      onDragEnd?.(fromIndex, toIndex);
    }

    setDragStartIndex(null);
  }, [dragStartIndex, dragOverIndex, isEditable, onDragEnd]);

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      if (!isEditable) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
    },
    [isEditable]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      if (!isEditable) return;
      e.preventDefault();

      const fromIndex = parseInt(e.dataTransfer.getData("text/plain"));
      const toIndex = index;

      if (fromIndex !== toIndex) {
        onDragEnd?.(fromIndex, toIndex);
      }
    },
    [index, isEditable, onDragEnd]
  );

  /**
   * Обработка лайка
   */
  const handleLikeClick = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!isLoading && !likePending) {
        await toggleLike();
      }
    },
    [isLoading, likePending, toggleLike]
  );

  /**
   * Добавление в очередь
   */
  const handleAddToQueue = useCallback(() => {
    if (!track || isLoading) return;
    dispatch(addToQueue(track));
  }, [track, isLoading, dispatch]);

  /**
   * Обработка контекстного меню
   */
  const handleEllipsisClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsMenuOpen(!isMenuOpen);
    },
    [isMenuOpen]
  );

  /**
   * Обработка удаления трека
   */
  const handleRemoveTrack = useCallback(() => {
    if (onRemove) {
      onRemove(track._id);
    }
    setIsMenuOpen(false);
  }, [track._id, onRemove]);

  const handleArtistClick = () => {
    if (!track) return;
    navigate(`/artist/${track.artist._id}`);
  };

  const handleAlbumClick = () => {
    if (!track) return;
    if (track.album == "single") {
      navigate(`/single/${track._id}`);
    } else {
      navigate(`/album/${track.album}`);
    }
  };

  const handleInfoClick = () => {
    console.log("Info clicked");
  };

  const handleShareClick = () => {
    console.log("Share clicked");
  };
  /**
   * Обработка действий контекстного меню
   */
  const handleMenuItemClick = useCallback(
    (index: number) => {
      const menuActions = [
        () => handleLikeClick({} as React.MouseEvent), // Like/Unlike
        handleAddToQueue, // Add to queue
        handleArtistClick, // Go to artist
        handleAlbumClick, // Go to album
        handleInfoClick, // Track info
        handleShareClick, // Share
        () => handleRemoveTrack(), // Remove from playlist (новый пункт)
      ];

      if (index < menuActions.length) {
        menuActions[index]();
        setIsMenuOpen(false);
      }
    },
    [handleLikeClick, handleAddToQueue, handleRemoveTrack]
  );

  /**
   * Handle image loading errors
   */
  const handleImageError = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      e.currentTarget.style.display = "none";
    },
    []
  );

  // Render skeleton loading state
  if (isLoading) {
    return (
      <div
        className="grid grid-cols-[20px_50px_1.47fr_1fr_0.1fr_0.1fr_40px] gap-2 sm:gap-4 items-center px-2 sm:px-4 py-3 rounded-lg"
        role="listitem"
        aria-label="Loading track"
      >
        {/* Drag handle skeleton */}
        <div className="w-1 h-8 bg-white/10 rounded animate-pulse"></div>

        {/* Track number skeleton */}
        <div className="h-6 w-6 bg-gradient-to-r from-white/10 via-white/20 to-white/10 backdrop-blur-md border border-white/20 rounded-md relative overflow-hidden mx-auto">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-shimmer"></div>
        </div>

        {/* Track info skeleton */}
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <div className="w-[50px] h-[50px] sm:w-[65px] sm:h-[65px] bg-gradient-to-br from-white/10 via-white/20 to-white/5 backdrop-blur-md border border-white/20 rounded-lg relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-shimmer"></div>
          </div>
          <div className="flex flex-col justify-center gap-2 min-w-0 flex-1">
            <div className="h-4 sm:h-5 w-24 sm:w-36 bg-gradient-to-r from-white/10 via-white/20 to-white/10 backdrop-blur-md border border-white/20 rounded-md relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-shimmer-delayed"></div>
            </div>
            <div className="h-3 sm:h-4 w-16 sm:w-24 bg-gradient-to-r from-white/8 via-white/15 to-white/8 backdrop-blur-md border border-white/15 rounded-md relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -skew-x-12 animate-shimmer-delayed-2"></div>
            </div>
          </div>
        </div>

        {/* Listen count skeleton */}
        <div className="flex justify-center">
          <div className="h-4 w-12 sm:w-16 bg-gradient-to-r from-white/8 via-white/15 to-white/8 backdrop-blur-md border border-white/15 rounded-md relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -skew-x-12 animate-shimmer"></div>
          </div>
        </div>

        {/* Like button skeleton */}
        <div className="flex justify-center">
          <div className="w-4 h-4 sm:w-5 sm:h-5 bg-gradient-to-r from-white/10 via-white/20 to-white/10 backdrop-blur-md border border-white/20 rounded-full relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-shimmer-delayed-2"></div>
          </div>
        </div>

        {/* Duration skeleton */}
        <div className="flex justify-center">
          <div className="h-4 w-8 bg-gradient-to-r from-white/8 via-white/15 to-white/8 backdrop-blur-md border border-white/15 rounded-md relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -skew-x-12 animate-shimmer"></div>
          </div>
        </div>

        {/* Menu button skeleton */}
        <div className="flex justify-center">
          <div className="w-4 h-4 sm:w-5 sm:h-5 bg-gradient-to-r from-white/10 via-white/20 to-white/10 backdrop-blur-md border border-white/20 rounded-sm relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-shimmer-delayed"></div>
          </div>
        </div>
      </div>
    );
  }

  const containerClasses = `
    grid grid-cols-[20px_50px_1.47fr_1fr_0.1fr_0.1fr_40px] gap-2 sm:gap-4 items-center px-2 sm:px-4 py-3 rounded-lg transition-all duration-200 group
    ${isDragging ? "opacity-50 scale-95" : "opacity-100 scale-100"}
    ${isCurrentTrack ? "bg-white/5" : "hover:bg-white/5"}
    ${dragOverIndex === index ? "ring-2 ring-blue-400/50" : ""}
  `;

  return (
    <div
      ref={dragRef}
      className={containerClasses}
      draggable={isEditable}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={isContextMenuHovered ? () => {} : handlePlayTrack}
      data-track-index={index}
      role="listitem"
      aria-label={`${track.name} by ${track.artist?.name || "Unknown Artist"}`}
    >
      {/* Drag Handle - полосочка слева */}
      {isEditable ? (
        <div
          className="flex-shrink-0 cursor-grab active:cursor-grabbing"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-1 h-8 bg-white/30 rounded-full hover:bg-white/50 transition-colors duration-200">
            <div className="w-full h-full bg-gradient-to-b from-white/20 to-white/40 rounded-full"></div>
          </div>
        </div>
      ) : (
        <div className="w-5"></div> // Placeholder для выравнивания
      )}

      {/* Индекс трека */}
      <div
        className={`text-lg sm:text-2xl text-center transition-colors duration-200 ${
          isPlaying ? "text-white" : "text-white/50"
        }`}
        aria-label={`Track ${index + 1}`}
      >
        {index + 1}
      </div>

      {/* Track information and cover */}
      <div className="flex items-center gap-2 sm:gap-4 min-w-0">
        <div className="w-[50px] h-[50px] sm:w-[65px] sm:h-[65px] rounded-lg flex items-center justify-center relative overflow-hidden group/cover">
          {/* Track cover image */}
          <img
            src={track?.coverUrl || ""}
            alt={`${track?.name} cover`}
            className="w-full h-full object-cover rounded-lg transition-opacity duration-200"
            onError={handleImageError}
          />

          {/* Play/pause overlay on hover */}
          <div
            className={`absolute inset-0 transition-opacity duration-200 bg-black rounded-lg ${
              isHovered ? "opacity-50" : "opacity-0"
            }`}
            style={{ zIndex: 20 }}
            aria-hidden="true"
          />

          {/* Play/pause button */}
          {isHovered && (
            <button
              className="absolute inset-0 flex items-center justify-center z-30 focus:outline-none focus:ring-2 focus:ring-white/20 rounded-lg"
              onClick={(e) => {
                e.stopPropagation();
                handlePlayTrack();
              }}
              aria-label={isPlaying ? "Pause track" : "Play track"}
            >
              {isPlaying ? (
                <PauseOutlined
                  style={{
                    color: "white",
                    fontSize: "28px",
                    filter: "drop-shadow(0 2px 8px #222)",
                  }}
                />
              ) : (
                <CaretRightOutlined
                  style={{
                    color: "white",
                    fontSize: "32px",
                    filter: "drop-shadow(0 2px 8px #222)",
                  }}
                />
              )}
            </button>
          )}
        </div>

        {/* Track title and artist */}
        <div className="flex flex-col justify-center min-w-0 flex-1">
          <h3 className="text-sm sm:text-lg font-medium truncate transition-colors text-white group-hover:text-white/90">
            {track.name}
          </h3>
          <p className="text-sm sm:text-lg text-white/60 truncate">
            {track.artist?.name || "Unknown Artist"}
          </p>
        </div>
      </div>

      {/* Listen count */}
      <div className="text-sm sm:text-lg text-white/60 truncate text-center">
        {track.listenCount?.toLocaleString() || "0"}
      </div>

      {/* Like button */}
      <div
        className="flex justify-center transition-opacity duration-300"
        style={{ opacity: isHovered || isLiked ? 1 : 0 }}
      >
        {likePending ? (
          <div
            className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-white"
            aria-label="Loading like status"
          />
        ) : (
          <button
            onClick={handleLikeClick}
            onMouseEnter={() => setIsLikeHovered(true)}
            onMouseLeave={() => setIsLikeHovered(false)}
            className="transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/20 rounded-full p-1"
            aria-label={isLiked ? "Unlike track" : "Like track"}
          >
            {isLiked ? (
              <HeartFilled
                style={{
                  color: isLikeHovered ? "#F93822" : "red",
                  fontSize: "16px",
                }}
              />
            ) : (
              <HeartOutlined
                style={{
                  color: isLikeHovered ? "#D3D3D3" : "rgba(255, 255, 255, 0.6)",
                  fontSize: "16px",
                }}
              />
            )}
          </button>
        )}
      </div>

      {/* Duration */}
      <div className="text-sm sm:text-lg text-white/60 text-center">
        {duration}
      </div>

      {/* Menu действий */}
      <div
        className="flex justify-center relative"
        ref={ellipsisRef}
        onMouseEnter={() => setIsContextMenuHovered(true)}
        onMouseLeave={() => setIsContextMenuHovered(false)}
      >
        <button
          onClick={handleEllipsisClick}
          className="transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/20 rounded-full p-1"
          style={{ opacity: isHovered ? 1 : 0 }}
          aria-label="Track options"
          aria-expanded={isMenuOpen}
          aria-haspopup="menu"
        >
          <EllipsisOutlined
            style={{
              color: "rgba(255, 255, 255, 1)",
              fontSize: "16px",
            }}
          />
        </button>

        {/* Контекстное меню */}
        <ContextMenu
          isOpen={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
          onMenuItemClick={handleMenuItemClick}
          anchorRef={ellipsisRef}
          isPlaying={isCurrentTrack}
          isLiked={isLiked}
          isPending={likePending}
          usePortal={true}
          showRemoveFromPlaylist={isEditable} // Показываем пункт только в режиме редактирования
        />
      </div>
    </div>
  );
};

export default DraggableTrackTemplate;
