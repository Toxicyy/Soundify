import React, { useState, useRef, useCallback } from "react";
import {
  CaretRightOutlined,
  PauseOutlined,
  EditOutlined,
  DeleteOutlined,
  DragOutlined,
} from "@ant-design/icons";
import { useSelector, useDispatch } from "react-redux";
import { setCurrentTrack, setIsPlaying } from "../../state/CurrentTrack.slice";
import EditTrackModal from "./EditTrackModal";
import { type LocalTrack } from "../../types/LocalTrack";

interface AlbumTrackItemProps {
  track: LocalTrack;
  index: number;
  totalTracks: number;
  onPlay: () => void;
  onRemove: () => void;
  onEdit: (updates: Partial<LocalTrack["metadata"]>) => void;
  onDragStart?: (index: number) => void; // Опциональный для случая с одним треком
  onDragEnd?: (fromIndex: number, toIndex: number) => void; // Опциональный
  isDragging?: boolean;
  dragOverIndex?: number | null;
}

const AlbumTrackItem: React.FC<AlbumTrackItemProps> = ({
  track,
  index,
  totalTracks,
  onPlay,
  onRemove,
  onEdit,
  onDragStart,
  onDragEnd,
  isDragging = false,
  dragOverIndex = null,
}) => {
  const dispatch = useDispatch();
  const dragRef = useRef<HTMLDivElement>(null);
  const [dragStartIndex, setDragStartIndex] = useState<number | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Get current playing state from Redux
  const { currentTrack, isPlaying } = useSelector(
    (state: any) => state.currentTrack
  );
  const { currentTrack: queueCurrentTrack } = useSelector(
    (state: any) => state.queue
  );

  // Debug: проверяем ID треков
  console.log("Track Debug:", {
    trackTempId: track.tempId,
    expectedId: `temp_${track.tempId}`,
    currentTrackId: currentTrack?._id,
    queueCurrentTrackId: queueCurrentTrack?._id,
    isPlaying,
  });

  // Check both slices for current track (проверяем разные варианты ID)
  const isCurrentTrack =
    currentTrack?._id === `temp_${track.tempId}` ||
    queueCurrentTrack?._id === `temp_${track.tempId}` ||
    currentTrack?._id === track.tempId ||
    queueCurrentTrack?._id === track.tempId;

  const isTrackPlaying = isCurrentTrack && isPlaying;

  // Debug: итоговые значения
  console.log("Track State:", {
    trackName: track.metadata.name,
    isCurrentTrack,
    isTrackPlaying,
    isPlaying,
  });

  // Показывать drag только если треков больше одного
  const shouldShowDrag = totalTracks > 1;

  // Format duration
  const formatDuration = useCallback((seconds?: number) => {
    if (!seconds) return "--:--";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }, []);

  // Format file size
  const formatFileSize = useCallback((bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  }, []);

  // Handle play/pause click
  const handlePlayPause = useCallback(() => {
    if (isCurrentTrack) {
      // If this track is currently playing, toggle play/pause
      dispatch(setIsPlaying(!isPlaying));
    } else {
      // If this is a different track, start playing it
      onPlay();
    }
  }, [isCurrentTrack, isPlaying, onPlay, dispatch]);

  // Drag handlers (только если drag разрешен)
  const handleDragStart = useCallback(
    (e: React.DragEvent) => {
      if (!shouldShowDrag || !onDragStart) {
        e.preventDefault();
        return;
      }

      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", index.toString());

      // Create custom drag image
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
      onDragStart(index);
    },
    [index, onDragStart, shouldShowDrag]
  );

  const handleDragEnd = useCallback(() => {
    if (!shouldShowDrag || !onDragEnd) return;

    const fromIndex = dragStartIndex;
    const toIndex = dragOverIndex;

    if (fromIndex !== null && toIndex !== null && fromIndex !== toIndex) {
      onDragEnd(fromIndex, toIndex);
    }

    setDragStartIndex(null);
  }, [dragStartIndex, dragOverIndex, onDragEnd, shouldShowDrag]);

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      if (!shouldShowDrag) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
    },
    [shouldShowDrag]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      if (!shouldShowDrag || !onDragEnd) return;

      e.preventDefault();
      const fromIndex = parseInt(e.dataTransfer.getData("text/plain"));
      const toIndex = index;

      if (fromIndex !== toIndex) {
        onDragEnd(fromIndex, toIndex);
      }
    },
    [index, onDragEnd, shouldShowDrag]
  );

  // Handle remove with confirmation
  const handleRemove = useCallback(() => {
    const confirmed = window.confirm(
      `Remove "${track.metadata.name}" from album?`
    );
    dispatch(setIsPlaying(false));
    dispatch(setCurrentTrack(null));
    if (confirmed) {
      onRemove();
    }
  }, [track.metadata.name, onRemove]);

  // Динамические grid колонки в зависимости от наличия drag
  const gridCols = shouldShowDrag
    ? "grid-cols-[30px_50px_1fr_100px_80px_40px_40px]"
    : "grid-cols-[50px_1fr_100px_80px_40px_40px]";

  const containerClasses = `
    grid ${gridCols} gap-4 items-center px-4 py-3 rounded-lg transition-all duration-200 group cursor-pointer hover:bg-white/5
    ${isDragging ? "opacity-50 scale-95" : "opacity-100 scale-100"}
    ${dragOverIndex === index ? "ring-2 ring-blue-400/50" : ""}
  `;

  return (
    <>
      <div
        ref={dragRef}
        className={containerClasses}
        draggable={shouldShowDrag}
        onDragStart={shouldShowDrag ? handleDragStart : undefined}
        onDragEnd={shouldShowDrag ? handleDragEnd : undefined}
        onDragOver={shouldShowDrag ? handleDragOver : undefined}
        onDrop={shouldShowDrag ? handleDrop : undefined}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={(e) => {
          e.stopPropagation();
          handlePlayPause();
        }}
        data-track-index={index}
      >
        {/* Drag Handle - показываем только если треков больше одного */}
        {shouldShowDrag && (
          <div
            className="flex-shrink-0 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <DragOutlined
              style={{
                color: "rgba(255, 255, 255, 0.6)",
                fontSize: "18px",
              }}
              className="hover:!text-white transition-colors duration-200"
            />
          </div>
        )}

        {/* Track Number / Play Button */}
        <div className="text-center">
          {isHovered ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                console.log("Play button clicked:", {
                  isCurrentTrack,
                  isPlaying,
                });
                handlePlayPause();
              }}
              className={`w-8 h-8 flex items-center justify-center transition-all duration-200
              }`}
            >
              {isTrackPlaying ? (
                <PauseOutlined
                  style={{
                    color: "rgba(255, 255, 255, 0.8)",
                    fontSize: "24px",
                  }}
                  className="hover:scale-130 cursor-pointer transition-all duration-300"
                />
              ) : (
                <CaretRightOutlined
                  style={{
                    color: "rgba(255, 255, 255, 0.8)",
                    fontSize: "24px",
                  }}
                  className="hover:scale-130 cursor-pointer transition-all duration-300"
                />
              )}
            </button>
          ) : (
            <span
              className={`text-sm font-medium transition-colors duration-200 text-white/60
              }`}
            >
              {index + 1}
            </span>
          )}
        </div>

        {/* Track Info */}
        <div className="flex items-center gap-3 min-w-0">
          <img
            src={URL.createObjectURL(track.coverFile)}
            alt={track.metadata.name}
            className={`w-10 h-10 rounded-md object-cover flex-shrink-0 transition-all duration-200
            }`}
          />
          <div className="min-w-0 flex-1">
            <h4
              className={`font-medium truncate transition-colors duration-200 text-white
              }`}
            >
              {track.metadata.name}
              {isTrackPlaying && (
                <span className="ml-2 animate-pulse text-sm">♪ Playing</span>
              )}
            </h4>
            <div className="flex items-center gap-2 text-xs text-white/60">
              <span>{track.metadata.genre}</span>
              {track.metadata.tags.length > 0 && (
                <>
                  <span>•</span>
                  <span>{track.metadata.tags.slice(0, 2).join(", ")}</span>
                  {track.metadata.tags.length > 2 && (
                    <span>+{track.metadata.tags.length - 2}</span>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* File Size */}
        <div
          className={`text-sm text-center transition-colors duration-200 text-white/60
          }`}
        >
          {formatFileSize(track.file.size)}
        </div>

        {/* Duration */}
        <div
          className={`text-sm text-center transition-colors duration-200 text-white/60
          }`}
        >
          {formatDuration(track.duration)}
        </div>

        {/* Edit Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsEditModalOpen(true);
          }}
          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-white/10 transition-all duration-200"
          title="Edit track"
        >
          <EditOutlined
            style={{
              color: "rgba(255, 255, 255, 0.6)",
              fontSize: "18px",
            }}
            className="hover:!text-white transition-colors duration-200"
          />
        </button>

        {/* Remove Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleRemove();
          }}
          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/20 transition-all duration-200"
          title="Remove track"
        >
          <DeleteOutlined
            style={{
              color: "rgba(248, 113, 113, 1)",
              fontSize: "18px",
            }}
            className="hover:!text-red-300 transition-colors duration-200"
          />
        </button>
      </div>

      {/* Edit Modal */}
      <EditTrackModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        track={track}
        onSave={onEdit}
        trackNumber={index + 1}
        totalTracks={totalTracks}
      />
    </>
  );
};

export default AlbumTrackItem;
