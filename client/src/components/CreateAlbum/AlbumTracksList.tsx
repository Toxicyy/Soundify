import React, { useState, useCallback } from "react";
import { useDispatch } from "react-redux";
import { PlusOutlined, SoundOutlined } from "@ant-design/icons";
import { motion, AnimatePresence } from "framer-motion";
import AlbumTrackItem from "./AlbumTrackItem";
import { playTrackAndQueue } from "../../state/Queue.slice";
import type { AppDispatch } from "../../store";

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

interface AlbumData {
  name: string;
  description: string;
  releaseDate: Date | null;
  type: "album" | "ep" | "single";
  coverFile: File | null;
  coverPreview: string | null;
}

interface AlbumTracksListProps {
  tracks: LocalTrack[];
  albumData: AlbumData;
  onTrackRemove: (tempId: string) => void;
  onTrackReorder: (fromIndex: number, toIndex: number) => void;
  onTrackEdit: (
    tempId: string,
    updates: Partial<LocalTrack["metadata"]>
  ) => void;
  onAddTrack: () => void;
}

const AlbumTracksList: React.FC<AlbumTracksListProps> = ({
  tracks,
  albumData,
  onTrackRemove,
  onTrackReorder,
  onTrackEdit,
  onAddTrack,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Handle drag and drop
  const handleDragStart = useCallback((index: number) => {
    setIsDragging(true);
    setDragOverIndex(index);
  }, []);

  const handleDragEnd = useCallback(
    (fromIndex: number, toIndex: number) => {
      setIsDragging(false);
      setDragOverIndex(null);

      if (fromIndex !== toIndex) {
        onTrackReorder(fromIndex, toIndex);
      }
    },
    [onTrackReorder]
  );

  const handleContainerDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();

    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const trackElements =
      e.currentTarget.querySelectorAll("[data-track-index]");

    let closestIndex = 0;
    let closestDistance = Infinity;

    trackElements.forEach((element, index) => {
      const elementRect = element.getBoundingClientRect();
      const elementY = elementRect.top + elementRect.height / 2 - rect.top;
      const distance = Math.abs(y - elementY);

      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    setDragOverIndex(closestIndex);
  }, []);

  // Handle track play (integrate with Redux queue)
  const handleTrackPlay = useCallback(
    (_selectedTrack: LocalTrack, trackIndex: number) => {
      // Create fresh blob URLs for Redux (важно создавать свежие!)
      const convertedTracks = tracks.map((localTrack) => {
        // Создаем новые blob URLs каждый раз для надежности
        const freshAudioUrl = URL.createObjectURL(localTrack.file);
        const freshCoverUrl = URL.createObjectURL(localTrack.coverFile);

        return {
          _id: localTrack.tempId,
          name: localTrack.metadata.name,
          artist: {
            _id: "temp-artist",
            name: "You",
          },
          coverUrl: freshCoverUrl,
          audioUrl: freshAudioUrl,
          album: null,
          preview: freshAudioUrl, // Используем тот же свежий URL
          duration: localTrack.duration || 0,
          genre: localTrack.metadata.genre,
          tags: localTrack.metadata.tags,
          listenCount: 0,
          likeCount: 0,
          isPublic: false,
          uploadedBy: "temp-user",
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      });

      console.log(
        "Playing track with fresh blob URLs:",
        convertedTracks[trackIndex]
      );

      // Dispatch to Redux queue
      dispatch(
        playTrackAndQueue({
          contextTracks: convertedTracks,
          startIndex: trackIndex,
        })
      );
    },
    [tracks, dispatch]
  );

  // Calculate total duration
  const totalDuration = tracks.reduce(
    (sum, track) => sum + (track.duration || 0),
    0
  );

  const formatTotalDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // Empty state component
  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mb-4">
        <SoundOutlined className="text-white/40 text-2xl" />
      </div>
      <h3 className="text-white/80 font-semibold mb-2">No tracks yet</h3>
      <p className="text-white/60 text-sm text-center mb-6 max-w-md">
        Start building your album by uploading tracks. Each track needs audio,
        cover art, and metadata.
      </p>
      <button
        onClick={onAddTrack}
        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-lg transition-all duration-200 font-semibold"
      >
        <PlusOutlined />
        Upload Your First Track
      </button>
    </div>
  );

  // Header stats component
  const HeaderStats = () =>
    tracks.length > 0 ? (
      <div className="flex items-center gap-6 text-sm text-white/70">
        <span>
          {tracks.length} track{tracks.length > 1 ? "s" : ""}
        </span>
        {totalDuration > 0 && <span>{formatTotalDuration(totalDuration)}</span>}
        <span className="capitalize">{albumData.type}</span>
      </div>
    ) : null;

  // Footer info component
  const FooterInfo = () =>
    tracks.length > 0 ? (
      <div className="p-4 border-t border-white/10 bg-white/5">
        <div className="flex items-center justify-between text-xs text-white/60">
          <div className="flex items-center gap-4">
            <span>💡 Tip: Drag tracks to change their order</span>
            <span>🎵 Click any track to preview</span>
          </div>
          <div className="flex items-center gap-4">
            <span>{tracks.length} tracks ready</span>
            {totalDuration > 0 && (
              <span>Total: {formatTotalDuration(totalDuration)}</span>
            )}
          </div>
        </div>
      </div>
    ) : null;

  return (
    <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <SoundOutlined />
              Album Tracks
            </h2>
            <p className="text-white/60 text-sm mt-1">
              Drag tracks to reorder • Click to play
            </p>
          </div>
          <button
            onClick={onAddTrack}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500/80 to-emerald-500/80 hover:from-green-500 hover:to-emerald-500 text-white rounded-lg transition-all duration-200 font-medium"
          >
            <PlusOutlined />
            Add Track
          </button>
        </div>

        <HeaderStats />
      </div>

      {/* Main Content */}
      <div className="min-h-[400px]">
        {tracks.length === 0 ? (
          <EmptyState />
        ) : (
          <div
            className="space-y-2 p-4"
            onDragOver={handleContainerDragOver}
            onDrop={(e) => e.preventDefault()}
          >
            <AnimatePresence>
              {tracks.map((track, index) => (
                <motion.div
                  key={track.tempId}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                  data-track-index={index}
                >
                  <AlbumTrackItem
                    track={track}
                    index={index}
                    totalTracks={tracks.length}
                    onPlay={() => handleTrackPlay(track, index)}
                    onRemove={() => onTrackRemove(track.tempId)}
                    onEdit={(updates) => onTrackEdit(track.tempId, updates)}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    isDragging={isDragging}
                    dragOverIndex={dragOverIndex}
                  />
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Drop indicator
            {isDragging && dragOverIndex !== null && (
              <motion.div
                className="h-1 bg-green-400 rounded-full mx-4"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                style={{
                  position: "absolute",
                  top: `${(dragOverIndex + 1) * 80}px`,
                  left: 16,
                  right: 16,
                }}
              />
            )} */}
          </div>
        )}
      </div>

      <FooterInfo />
    </div>
  );
};

export default AlbumTracksList;
