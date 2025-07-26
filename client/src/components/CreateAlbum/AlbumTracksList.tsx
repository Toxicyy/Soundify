import React, { useState, useCallback } from "react";
import { useDispatch } from "react-redux";
import { PlusOutlined, SoundOutlined } from "@ant-design/icons";
import { motion, AnimatePresence } from "framer-motion";
import AlbumTrackItem from "./AlbumTrackItem";
import { playTrackAndQueue } from "../../state/Queue.slice";
import type { AppDispatch } from "../../store";
import type { LocalTrack, AlbumTracksListProps } from "../../types/LocalTrack";

/**
 * Album Tracks List Component
 * Displays and manages tracks in album creation
 * Responsive layout with drag-and-drop reordering
 */
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
      // Create fresh blob URLs for Redux
      const convertedTracks = tracks.map((localTrack) => {
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
          preview: freshAudioUrl,
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
    <div className="flex flex-col items-center justify-center py-12 lg:py-16">
      <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-full bg-white/10 flex items-center justify-center mb-4">
        <SoundOutlined className="text-white/40 text-xl lg:text-2xl" />
      </div>
      <h3 className="text-white/80 font-semibold mb-2 text-lg lg:text-xl">
        No tracks yet
      </h3>
      <p className="text-white/60 text-sm lg:text-base text-center mb-6 max-w-md px-4">
        Start building your album by uploading tracks. Each track needs audio,
        cover art, and metadata.
      </p>
      <button
        onClick={onAddTrack}
        className="flex items-center gap-2 px-4 lg:px-6 py-2 lg:py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-lg transition-all duration-200 font-semibold text-sm lg:text-base"
      >
        <PlusOutlined />
        Upload Your First Track
      </button>
    </div>
  );

  // Header stats component
  const HeaderStats = () =>
    tracks.length > 0 ? (
      <div className="flex flex-wrap items-center gap-3 lg:gap-6 text-sm text-white/70">
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
      <div className="p-3 lg:p-4 border-t border-white/10 bg-white/5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-white/60">
          <div className="flex flex-wrap items-center gap-3 lg:gap-4">
            <span>💡 Tip: Drag tracks to change their order</span>
            <span>🎵 Click any track to preview</span>
          </div>
          <div className="flex items-center gap-3 lg:gap-4">
            <span>{tracks.length} tracks ready</span>
            {totalDuration > 0 && (
              <span>Total: {formatTotalDuration(totalDuration)}</span>
            )}
          </div>
        </div>
      </div>
    ) : null;

  return (
    <div className="bg-white/5 backdrop-blur-md rounded-lg lg:rounded-2xl border border-white/10 overflow-hidden">
      {/* Header - Responsive layout */}
      <div className="p-4 lg:p-6 border-b border-white/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
          <div>
            <h2 className="text-lg lg:text-xl font-semibold text-white flex items-center gap-2">
              <SoundOutlined />
              Album Tracks
            </h2>
            <p className="text-white/60 text-sm mt-1">
              Drag tracks to reorder • Click to play
            </p>
          </div>
          <button
            onClick={onAddTrack}
            className="flex items-center gap-2 px-3 lg:px-4 py-2 bg-gradient-to-r from-green-500/80 to-emerald-500/80 hover:from-green-500 hover:to-emerald-500 text-white rounded-lg transition-all duration-200 font-medium text-sm lg:text-base whitespace-nowrap"
          >
            <PlusOutlined />
            Add Track
          </button>
        </div>

        <HeaderStats />
      </div>

      {/* Main Content */}
      <div className="min-h-[300px] lg:min-h-[400px]">
        {tracks.length === 0 ? (
          <EmptyState />
        ) : (
          <div
            className="space-y-1 lg:space-y-2 p-2 lg:p-4"
            onDragOver={handleContainerDragOver}
            onDrop={(e) => e.preventDefault()}
          >
            <AnimatePresence>
              {tracks.map((track, arrayIndex) => (
                <motion.div
                  key={track.tempId}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                  data-track-index={arrayIndex}
                >
                  <AlbumTrackItem
                    track={track}
                    index={arrayIndex}
                    totalTracks={tracks.length}
                    onPlay={() => handleTrackPlay(track, arrayIndex)}
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
          </div>
        )}
      </div>

      <FooterInfo />
    </div>
  );
};

export default AlbumTracksList;
