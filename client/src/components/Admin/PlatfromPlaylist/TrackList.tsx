import React, { useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  DeleteOutlined,
  SearchOutlined,
  CaretRightOutlined,
  PauseOutlined,
} from "@ant-design/icons";
import { motion, AnimatePresence } from "framer-motion";
import type { Track } from "../../../types/TrackData";
import { playTrackAndQueue } from "../../../state/Queue.slice";
import { setIsPlaying } from "../../../state/CurrentTrack.slice";
import type { AppDispatch } from "../../../store";

interface TrackListProps {
  tracks: Track[];
  isEditing: boolean;
  onRemoveTrack: (trackId: string) => void;
  onReorderTracks: (fromIndex: number, toIndex: number) => void;
}

const TrackList: React.FC<TrackListProps> = ({
  tracks,
  isEditing,
  onRemoveTrack,
  onReorderTracks,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const [draggedTrack, setDraggedTrack] = useState<Track | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Get current playing state from Redux
  const { currentTrack, isPlaying } = useSelector(
    (state: any) => state.currentTrack
  );
  const queueState = useSelector((state: any) => state.queue);

  // Drag and drop handlers
  const handleDragStart = useCallback(
    (e: React.DragEvent, track: Track, index: number) => {
      if (!isEditing) return;

      setDraggedTrack(track);
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", index.toString());
    },
    [isEditing]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent, index: number) => {
      if (!isEditing) return;

      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      setDragOverIndex(index);
    },
    [isEditing]
  );

  const handleDragLeave = useCallback(() => {
    setDragOverIndex(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, dropIndex: number) => {
      if (!isEditing) return;

      e.preventDefault();
      const dragIndex = parseInt(e.dataTransfer.getData("text/plain"));

      if (dragIndex !== dropIndex && draggedTrack) {
        onReorderTracks(dragIndex, dropIndex);
      }

      setDraggedTrack(null);
      setDragOverIndex(null);
    },
    [isEditing, draggedTrack, onReorderTracks]
  );

  const handleDragEnd = useCallback(() => {
    setDraggedTrack(null);
    setDragOverIndex(null);
  }, []);

  // Handle play/pause
  const handlePlayPause = useCallback(
    (track: Track, index: number) => {
      const isCurrentTrack =
        currentTrack?._id === track._id ||
        queueState.currentTrack?._id === track._id;

      if (isCurrentTrack) {
        // Toggle current track
        dispatch(setIsPlaying(!isPlaying));
      } else {
        // Play new track with playlist context
        dispatch(
          playTrackAndQueue({
            contextTracks: tracks,
            startIndex: index,
          })
        );
      }
    },
    [currentTrack, queueState.currentTrack, isPlaying, dispatch, tracks]
  );

  // Format duration
  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  if (tracks.length === 0) {
    return (
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">
          Playlist Tracks (0)
        </h3>
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto rounded-full bg-white/10 flex items-center justify-center mb-4">
            <SearchOutlined className="text-2xl text-white/60" />
          </div>
          <h4 className="text-white/80 font-medium mb-2">
            No tracks added yet
          </h4>
          <p className="text-white/60 text-sm">
            {isEditing
              ? "Search and add tracks to build your playlist"
              : "This playlist is empty"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-lg font-semibold text-white mb-4">
        Playlist Tracks ({tracks.length})
      </h3>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        <AnimatePresence>
          {tracks.map((track, index) => {
            const isCurrentTrack =
              currentTrack?._id === track._id ||
              queueState.currentTrack?._id === track._id;
            const isTrackPlaying = isCurrentTrack && isPlaying;
            const isDraggedOver = dragOverIndex === index;

            return (
              <motion.div
                key={track._id}
                className={`${
                  isDraggedOver ? "ring-2 ring-blue-400/50 bg-blue-500/10" : ""
                } ${isEditing ? "cursor-move" : "cursor-default"}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <div
                  className="flex items-center gap-3 p-3 bg-white/5 rounded-lg group hover:bg-white/10 transition-colors"
                  draggable={isEditing}
                  onDragStart={(e) => handleDragStart(e, track, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                >
                  {/* Drag Handle */}
                  {isEditing && (
                    <div className="text-white/40 cursor-grab active:cursor-grabbing">
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 12 12"
                        fill="currentColor"
                      >
                        <circle cx="2" cy="2" r="1" />
                        <circle cx="6" cy="2" r="1" />
                        <circle cx="10" cy="2" r="1" />
                        <circle cx="2" cy="6" r="1" />
                        <circle cx="6" cy="6" r="1" />
                        <circle cx="10" cy="6" r="1" />
                        <circle cx="2" cy="10" r="1" />
                        <circle cx="6" cy="10" r="1" />
                        <circle cx="10" cy="10" r="1" />
                      </svg>
                    </div>
                  )}

                  {/* Track Number */}
                  <div className="text-white/60 font-medium w-8 text-center">
                    {index + 1}
                  </div>

                  {/* Cover with Play Button */}
                  <div
                    className="relative w-12 h-12 rounded-lg overflow-hidden group/cover cursor-pointer"
                    onClick={() => handlePlayPause(track, index)}
                  >
                    <img
                      src={track.coverUrl}
                      alt={track.name}
                      className="w-full h-full object-cover transition-transform duration-200 group-hover/cover:scale-105"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "/default-cover.jpg";
                      }}
                    />

                    {/* Play/Pause Overlay */}
                    <div
                      className={`absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity duration-200 ${
                        isTrackPlaying
                          ? "opacity-100"
                          : "opacity-0 group-hover/cover:opacity-100"
                      }`}
                    >
                      {isTrackPlaying ? (
                        <PauseOutlined className="text-white text-lg drop-shadow-lg hover:scale-110 transition-transform duration-200" />
                      ) : (
                        <CaretRightOutlined className="text-white text-lg drop-shadow-lg hover:scale-110 transition-transform duration-200" />
                      )}
                    </div>

                    {/* Playing Indicator */}
                    {isTrackPlaying && (
                      <div className="absolute bottom-1 right-1">
                        <div className="flex space-x-1">
                          <div className="w-1 h-3 bg-green-400 rounded-full animate-pulse"></div>
                          <div
                            className="w-1 h-2 bg-green-400 rounded-full animate-pulse"
                            style={{ animationDelay: "0.1s" }}
                          ></div>
                          <div
                            className="w-1 h-4 bg-green-400 rounded-full animate-pulse"
                            style={{ animationDelay: "0.2s" }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Track Info */}
                  <div className="flex-1 min-w-0">
                    <h4
                      className={`font-medium truncate transition-colors ${
                        isTrackPlaying ? "text-green-400" : "text-white"
                      }`}
                    >
                      {track.name}
                      {isTrackPlaying && (
                        <span className="ml-2 text-xs animate-pulse">
                          ♪ Playing
                        </span>
                      )}
                    </h4>
                    <p className="text-white/60 text-sm truncate">
                      {track.artist.name}
                    </p>
                  </div>

                  {/* Duration */}
                  <div className="text-white/60 text-sm">
                    {track.duration ? formatDuration(track.duration) : "0:00"}
                  </div>

                  {/* Remove Button */}
                  {isEditing && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveTrack(track._id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-500/20 rounded-lg transition-all duration-200"
                    >
                      <DeleteOutlined className="text-red-400" />
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default TrackList;
