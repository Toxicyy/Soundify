import React, { useState, useRef, useCallback } from "react";
import {
  CaretRightOutlined,
  PauseOutlined,
  EditOutlined,
  DeleteOutlined,
  DragOutlined,
} from "@ant-design/icons";
import { useSelector, useDispatch } from "react-redux";
import { setIsPlaying } from "../../state/CurrentTrack.slice";
import EditTrackModal from "./EditTrackModal";

interface LocalTrack {
  tempId: string;
  file: File;
  metadata: {
    name: string;
    genre: string;
    tags: string[];
  };
  coverFile: File;
  audioUrl: string;
  duration?: number;
}

interface AlbumTrackItemProps {
  track: LocalTrack;
  index: number;
  totalTracks: number;
  onPlay: () => void;
  onRemove: () => void;
  onEdit: (updates: Partial<LocalTrack["metadata"]>) => void;
  onDragStart: (index: number) => void;
  onDragEnd: (fromIndex: number, toIndex: number) => void;
  isDragging: boolean;
  dragOverIndex: number | null;
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
  isDragging,
  dragOverIndex,
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

  // Check both slices for current track (queue slice is more reliable)
  const isCurrentTrack =
    currentTrack?._id === track.tempId ||
    queueCurrentTrack?._id === track.tempId;
  const isTrackPlaying = isCurrentTrack && isPlaying;

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

  // Drag handlers
  const handleDragStart = useCallback(
    (e: React.DragEvent) => {
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
    [index, onDragStart]
  );

  const handleDragEnd = useCallback(() => {
    const fromIndex = dragStartIndex;
    const toIndex = dragOverIndex;

    if (fromIndex !== null && toIndex !== null && fromIndex !== toIndex) {
      onDragEnd(fromIndex, toIndex);
    }

    setDragStartIndex(null);
  }, [dragStartIndex, dragOverIndex, onDragEnd]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const fromIndex = parseInt(e.dataTransfer.getData("text/plain"));
      const toIndex = index;

      if (fromIndex !== toIndex) {
        onDragEnd(fromIndex, toIndex);
      }
    },
    [index, onDragEnd]
  );

  // Handle remove with confirmation
  const handleRemove = useCallback(() => {
    const confirmed = window.confirm(
      `Remove "${track.metadata.name}" from album?`
    );
    if (confirmed) {
      onRemove();
    }
  }, [track.metadata.name, onRemove]);

  const containerClasses = `
    grid grid-cols-[30px_50px_1fr_100px_80px_40px_40px] gap-4 items-center px-4 py-3 rounded-lg transition-all duration-200 group cursor-pointer
    ${isDragging ? "opacity-50 scale-95" : "opacity-100 scale-100"}
    ${
      isCurrentTrack
        ? "bg-green-500/10 border border-green-500/30"
        : "hover:bg-white/5"
    }
    ${dragOverIndex === index ? "ring-2 ring-blue-400/50" : ""}
  `;

  return (
    <>
      <div
        ref={dragRef}
        className={containerClasses}
        draggable
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={(e) => {
          e.stopPropagation();
          handlePlayPause();
        }}
        data-track-index={index}
      >
        {/* Drag Handle */}
        <div
          className="flex-shrink-0 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <DragOutlined
            style={{
              color: "rgba(255, 255, 255, 0.6)",
              transition: "color 0.2s ease",
            }}
            onMouseEnter={(e) =>
              ((e.target as HTMLElement).style.color = "white")
            }
            onMouseLeave={(e) =>
              ((e.target as HTMLElement).style.color =
                "rgba(255, 255, 255, 0.6)")
            }
          />
        </div>

        {/* Track Number / Play Button */}
        <div className="text-center">
          {isHovered || isCurrentTrack ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePlayPause();
              }}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              {isTrackPlaying ? (
                <PauseOutlined style={{ color: "white" }} />
              ) : (
                <CaretRightOutlined style={{ color: "white" }} />
              )}
            </button>
          ) : (
            <span
              className={`text-sm font-medium ${
                isCurrentTrack ? "text-green-400" : "text-white/60"
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
            className="w-10 h-10 rounded-md object-cover flex-shrink-0"
          />
          <div className="min-w-0 flex-1">
            <h4
              className={`font-medium truncate ${
                isCurrentTrack ? "text-green-400" : "text-white"
              }`}
            >
              {track.metadata.name}
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
        <div className="text-white/60 text-sm text-center">
          {formatFileSize(track.file.size)}
        </div>

        {/* Duration */}
        <div className="text-white/60 text-sm text-center">
          {formatDuration(track.duration)}
        </div>

        {/* Edit Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsEditModalOpen(true);
          }}
          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-white/10 transition-all"
          title="Edit track"
        >
          <EditOutlined
            style={{
              color: "rgba(255, 255, 255, 0.6)",
              transition: "color 0.2s ease",
            }}
            onMouseEnter={(e) =>
              ((e.target as HTMLElement).style.color = "white")
            }
            onMouseLeave={(e) =>
              ((e.target as HTMLElement).style.color =
                "rgba(255, 255, 255, 0.6)")
            }
          />
        </button>

        {/* Remove Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleRemove();
          }}
          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/20 transition-all"
          title="Remove track"
        >
          <DeleteOutlined
            style={{
              color: "rgba(248, 113, 113, 1)",
              transition: "color 0.2s ease",
            }}
            onMouseEnter={(e) =>
              ((e.target as HTMLElement).style.color = "rgba(252, 165, 165, 1)")
            }
            onMouseLeave={(e) =>
              ((e.target as HTMLElement).style.color =
                "rgba(248, 113, 113, 1)")
            }
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
