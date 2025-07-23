import React, { useState, useEffect, useCallback } from "react";
import {
  PlusOutlined,
  SaveOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import { motion } from "framer-motion";
import AlbumHeaderForm from "../components/CreateAlbum/AlbumHeaderForm";
import AlbumTracksList from "../components/CreateAlbum/AlbumTracksList";
import UploadTrackToAlbumModal from "../components/CreateAlbum/UploadTrackToAlbumModal";
import BatchSaveModal from "../components/CreateAlbum/BatchSaveModal";
import { useNotification } from "../hooks/useNotification";

interface LocalTrack {
  tempId: string;
  file: File;
  metadata: {
    name: string;
    genre: string;
    tags: string[];
  };
  coverFile: File;
  audioUrl: string; // blob URL for preview
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

const CreateAlbumPage: React.FC = () => {
  const { showSuccess, showError, showWarning } = useNotification();

  // Album data state
  const [albumData, setAlbumData] = useState<AlbumData>({
    name: "",
    description: "",
    releaseDate: null,
    type: "album",
    coverFile: null,
    coverPreview: null,
  });

  // Tracks state
  const [tracks, setTracks] = useState<LocalTrack[]>([]);

  // Modal states
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isBatchSaveModalOpen, setIsBatchSaveModalOpen] = useState(false);

  // UI states
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Auto-determine album genre based on track genres
  const determineAlbumGenre = useCallback(() => {
    if (tracks.length === 0) return "";

    const genreCounts = tracks.reduce((acc, track) => {
      const genre = track.metadata.genre;
      acc[genre] = (acc[genre] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return (
      Object.entries(genreCounts).sort(([, a], [, b]) => b - a)[0]?.[0] || ""
    );
  }, [tracks]);

  // Auto-determine album type based on track count
  const determineAlbumType = useCallback(() => {
    if (tracks.length === 1) return "single";
    if (tracks.length <= 6) return "ep";
    return "album";
  }, [tracks.length]);

  // Update album type automatically
  useEffect(() => {
    if (tracks.length > 0) {
      const newType = determineAlbumType();
      setAlbumData((prev) => ({ ...prev, type: newType }));
    }
  }, [tracks.length, determineAlbumType]);

  // Track unsaved changes
  useEffect(() => {
    const hasAlbumData = Boolean(
      albumData.name.trim() ||
        albumData.description.trim() ||
        albumData.coverFile
    );
    const hasTracksData = tracks.length > 0;
    setHasUnsavedChanges(hasAlbumData || hasTracksData);
  }, [albumData, tracks]);

  // Browser close warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Handle album data updates
  const handleAlbumDataChange = useCallback((updates: Partial<AlbumData>) => {
    setAlbumData((prev) => ({ ...prev, ...updates }));
  }, []);

  // Handle track upload
  const handleTrackUpload = useCallback(
    (newTrack: LocalTrack) => {
      // Check for duplicates (by file name and size)
      const isDuplicate = tracks.some(
        (track) =>
          track.file.name === newTrack.file.name &&
          track.file.size === newTrack.file.size
      );

      if (isDuplicate) {
        showWarning(`Track "${newTrack.file.name}" is already in the album`);
        return;
      }

      setTracks((prev) => [...prev, newTrack]);
      showSuccess(`Track "${newTrack.metadata.name}" added to album`);
    },
    [tracks, showWarning, showSuccess]
  );

  // Handle track removal
  const handleTrackRemove = useCallback((tempId: string) => {
    setTracks((prev) => {
      const trackToRemove = prev.find((t) => t.tempId === tempId);
      if (trackToRemove) {
        // Clean up blob URL
        URL.revokeObjectURL(trackToRemove.audioUrl);
      }
      return prev.filter((t) => t.tempId !== tempId);
    });
  }, []);

  // Handle track reordering
  const handleTrackReorder = useCallback(
    (fromIndex: number, toIndex: number) => {
      setTracks((prev) => {
        const newTracks = [...prev];
        const [movedTrack] = newTracks.splice(fromIndex, 1);
        newTracks.splice(toIndex, 0, movedTrack);
        return newTracks;
      });
    },
    []
  );

  // Handle track metadata edit
  const handleTrackEdit = useCallback(
    (tempId: string, updates: Partial<LocalTrack["metadata"]>) => {
      setTracks((prev) =>
        prev.map((track) =>
          track.tempId === tempId
            ? { ...track, metadata: { ...track.metadata, ...updates } }
            : track
        )
      );
    },
    []
  );

  // Validation
  const canSave = useCallback(() => {
    if (!albumData.name.trim())
      return { valid: false, message: "Album name is required" };
    if (!albumData.coverFile)
      return { valid: false, message: "Album cover is required" };
    if (tracks.length < 2)
      return {
        valid: false,
        message: "At least 2 tracks are required for an album",
      };

    return { valid: true, message: "" };
  }, [albumData, tracks]);

  // Handle save
  const handleSave = useCallback(() => {
    const validation = canSave();
    if (!validation.valid) {
      showError(validation.message);
      return;
    }

    setIsBatchSaveModalOpen(true);
  }, [canSave, showError]);

  // Handle back navigation
  const handleBack = useCallback(() => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm(
        "You have unsaved changes. Are you sure you want to leave?"
      );
      if (!confirmed) return;
    }

    // Clean up blob URLs
    tracks.forEach((track) => {
      URL.revokeObjectURL(track.audioUrl);
    });

    if (albumData.coverPreview) {
      URL.revokeObjectURL(albumData.coverPreview);
    }

    // Navigate back to artist studio (implement your navigation logic)
    console.log("Navigate back to artist studio");
  }, [hasUnsavedChanges, tracks, albumData.coverPreview]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      tracks.forEach((track) => {
        URL.revokeObjectURL(track.audioUrl);
      });
      if (albumData.coverPreview) {
        URL.revokeObjectURL(albumData.coverPreview);
      }
    };
  }, []);

  const validation = canSave();

  return (
    <div className="min-h-screen pl-[21vw]">
      <div className="p-8">
        {/* Header */}
        <motion.div
          className="flex items-center justify-between mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-4">
            <button
              onClick={handleBack}
              className="p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all duration-200"
            >
              <ArrowLeftOutlined className="text-white text-xl" />
            </button>
            <div>
              <h1 className="text-4xl font-bold text-white tracking-tight">
                Create Album
              </h1>
              <p className="text-white/70 mt-1 text-lg">
                Upload tracks and create your album
                {tracks.length > 0 && (
                  <span className="ml-3 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-sm border border-white/20">
                    {tracks.length} track{tracks.length > 1 ? "s" : ""} •{" "}
                    {albumData.type.toUpperCase()}
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="flex items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 text-white rounded-2xl transition-all duration-200 font-medium"
            >
              <PlusOutlined />
              Add Track
            </button>

            <button
              onClick={handleSave}
              disabled={!validation.valid}
              className={`flex items-center gap-2 px-8 py-3 rounded-2xl font-semibold transition-all duration-200 ${
                validation.valid
                  ? "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg"
                  : "bg-white/10 text-white/50 cursor-not-allowed backdrop-blur-md border border-white/20"
              }`}
            >
              <SaveOutlined />
              Create Album
            </button>
          </div>
        </motion.div>

        {/* Unsaved changes indicator */}
        {hasUnsavedChanges && (
          <motion.div
            className="mb-6 p-4 bg-yellow-500/10 backdrop-blur-md border border-yellow-500/20 rounded-2xl"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
              <span className="text-yellow-300 font-medium">
                Unsaved Changes
              </span>
              <span className="text-white/60 ml-auto">
                Don't forget to create your album
              </span>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Album Form */}
          <motion.div
            className="xl:col-span-1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <AlbumHeaderForm
              albumData={albumData}
              onChange={handleAlbumDataChange}
              suggestedGenre={determineAlbumGenre()}
              tracksCount={tracks.length}
            />
          </motion.div>

          {/* Tracks List */}
          <motion.div
            className="xl:col-span-2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <AlbumTracksList
              tracks={tracks}
              albumData={albumData}
              onTrackRemove={handleTrackRemove}
              onTrackReorder={handleTrackReorder}
              onTrackEdit={handleTrackEdit}
              onAddTrack={() => setIsUploadModalOpen(true)}
            />
          </motion.div>
        </div>

        {/* Validation message */}
        {!validation.valid && (hasUnsavedChanges || tracks.length > 0) && (
          <motion.div
            className="fixed bottom-6 right-6 p-4 bg-red-500/20 backdrop-blur-md border border-red-500/30 rounded-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="text-red-300 font-medium">{validation.message}</p>
          </motion.div>
        )}
      </div>

      {/* Modals */}
      <UploadTrackToAlbumModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onTrackUpload={handleTrackUpload}
        existingTracks={tracks}
      />

      <BatchSaveModal
        isOpen={isBatchSaveModalOpen}
        onClose={() => setIsBatchSaveModalOpen(false)}
        albumData={albumData}
        tracks={tracks}
        onSuccess={() => {
          setHasUnsavedChanges(false);
          // Navigate back to artist studio (implement your navigation logic)
          console.log("Navigate back to artist studio after success");
        }}
      />
    </div>
  );
};

export default CreateAlbumPage;
