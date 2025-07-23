import React, { useState, useCallback, useEffect } from "react";
import { Modal } from "antd";
import {
  LoadingOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import { motion, AnimatePresence } from "framer-motion";
import { useNotification } from "../../hooks/useNotification";

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

interface BatchSaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  albumData: AlbumData;
  tracks: LocalTrack[];
  onSuccess: () => void;
}

interface TrackProgress {
  tempId: string;
  name: string;
  status: "pending" | "uploading" | "processing" | "completed" | "error";
  progress: number;
  error?: string;
}

type SavePhase = "album" | "tracks" | "finalization" | "completed" | "error";

interface SaveProgress {
  phase: SavePhase;
  currentTrack: number;
  totalTracks: number;
  currentTrackProgress: number;
  overallProgress: number;
  message: string;
  tracks: TrackProgress[];
}

const BatchSaveModal: React.FC<BatchSaveModalProps> = ({
  isOpen,
  onClose,
  albumData,
  tracks,
  onSuccess,
}) => {
  const { showSuccess, showError } = useNotification();

  const [progress, setProgress] = useState<SaveProgress>({
    phase: "album",
    currentTrack: 0,
    totalTracks: tracks.length,
    currentTrackProgress: 0,
    overallProgress: 0,
    message: "Initializing...",
    tracks: tracks.map((track) => ({
      tempId: track.tempId,
      name: track.metadata.name,
      status: "pending",
      progress: 0,
    })),
  });

  const [canCancel, setCanCancel] = useState(true);
  const [saveStarted, setSaveStarted] = useState(false);

  // Update totalTracks when tracks prop changes
  useEffect(() => {
    setProgress((prev) => ({
      ...prev,
      totalTracks: tracks.length,
    }));
  }, [tracks.length]);

  // Start save process when modal opens
  useEffect(() => {
    if (isOpen && !saveStarted) {
      setSaveStarted(true);
      startSaveProcess();
    }
  }, [isOpen, saveStarted]);

  // Simulate the save process
  const startSaveProcess = useCallback(async () => {
    try {
      setCanCancel(false);

      // Phase 1: Create album
      setProgress((prev) => ({
        ...prev,
        phase: "album",
        message: "Creating album...",
        overallProgress: 5,
      }));

      await simulateDelay(1000);

      // Determine most common genre for album
      const genreCounts = tracks.reduce((acc, track) => {
        const genre = track.metadata.genre;
        acc[genre] = (acc[genre] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const albumGenre =
        Object.entries(genreCounts).sort(([, a], [, b]) => b - a)[0]?.[0] ||
        "Various";

      console.log("Album genre determined:", albumGenre);

      // Phase 2: Upload tracks
      setProgress((prev) => ({
        ...prev,
        phase: "tracks",
        message: "Uploading tracks...",
        overallProgress: 10,
      }));

      // Process each track
      for (let i = 0; i < tracks.length; i++) {
        const track = tracks[i];

        // Update current track
        setProgress((prev) => ({
          ...prev,
          currentTrack: i + 1,
          message: `Uploading "${track.metadata.name}"...`,
          tracks: prev.tracks.map((t) =>
            t.tempId === track.tempId ? { ...t, status: "uploading" } : t
          ),
        }));

        // Simulate track upload progress
        for (
          let progressVal = 0;
          progressVal <= 70;
          progressVal += Math.random() * 10 + 5
        ) {
          const clampedProgress = Math.min(progressVal, 70);

          setProgress((prev) => ({
            ...prev,
            currentTrackProgress: clampedProgress,
            overallProgress: 10 + (i * 70 + clampedProgress) / tracks.length,
            tracks: prev.tracks.map((t) =>
              t.tempId === track.tempId
                ? { ...t, progress: clampedProgress }
                : t
            ),
          }));

          await simulateDelay(200 + Math.random() * 300);
        }

        // Switch to processing phase
        setProgress((prev) => ({
          ...prev,
          message: `Converting "${track.metadata.name}" to HLS...`,
          tracks: prev.tracks.map((t) =>
            t.tempId === track.tempId ? { ...t, status: "processing" } : t
          ),
        }));

        // Simulate HLS conversion
        for (
          let progressVal = 70;
          progressVal <= 100;
          progressVal += Math.random() * 8 + 2
        ) {
          const clampedProgress = Math.min(progressVal, 100);

          setProgress((prev) => ({
            ...prev,
            currentTrackProgress: clampedProgress,
            overallProgress: 10 + (i * 100 + clampedProgress) / tracks.length,
            tracks: prev.tracks.map((t) =>
              t.tempId === track.tempId
                ? { ...t, progress: clampedProgress }
                : t
            ),
          }));

          await simulateDelay(300 + Math.random() * 500);
        }

        // Mark track as completed
        setProgress((prev) => ({
          ...prev,
          tracks: prev.tracks.map((t) =>
            t.tempId === track.tempId
              ? { ...t, status: "completed", progress: 100 }
              : t
          ),
        }));
      }

      // Phase 3: Finalization
      setProgress((prev) => ({
        ...prev,
        phase: "finalization",
        message: "Finalizing album...",
        overallProgress: 90,
        currentTrackProgress: 0,
      }));

      await simulateDelay(1500);

      // Phase 4: Completed
      setProgress((prev) => ({
        ...prev,
        phase: "completed",
        message: `Album "${albumData.name}" created successfully!`,
        overallProgress: 100,
      }));

      await simulateDelay(1000);

      showSuccess(
        `🎵 Album "${albumData.name}" created with ${tracks.length} tracks!`
      );
      onSuccess();
    } catch (error) {
      console.error("Save process failed:", error);

      setProgress((prev) => ({
        ...prev,
        phase: "error",
        message: "Failed to create album. Please try again.",
        tracks: prev.tracks.map((t) =>
          t.status === "uploading" || t.status === "processing"
            ? { ...t, status: "error", error: "Upload failed" }
            : t
        ),
      }));

      showError("Failed to create album. Please try again.");
      setCanCancel(true);
    }
  }, [albumData, tracks, showSuccess, showError, onSuccess]);

  // Simulate network delay
  const simulateDelay = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  // Handle close
  const handleClose = useCallback(() => {
    if (
      canCancel ||
      progress.phase === "completed" ||
      progress.phase === "error"
    ) {
      onClose();
    }
  }, [canCancel, progress.phase, onClose]);

  // Get phase color
  const getPhaseColor = (phase: SavePhase) => {
    switch (phase) {
      case "completed":
        return "text-green-400";
      case "error":
        return "text-red-400";
      default:
        return "text-blue-400";
    }
  };

  // Get status icon
  const getStatusIcon = (status: TrackProgress["status"]) => {
    switch (status) {
      case "pending":
        return <div className="w-4 h-4 rounded-full bg-white/20" />;
      case "uploading":
      case "processing":
        return <LoadingOutlined className="text-blue-400 animate-spin" />;
      case "completed":
        return <CheckCircleOutlined className="text-green-400" />;
      case "error":
        return <ExclamationCircleOutlined className="text-red-400" />;
    }
  };

  const isCompleted = progress.phase === "completed";
  const hasError = progress.phase === "error";

  return (
    <Modal
      open={isOpen}
      onCancel={handleClose}
      closable={canCancel || isCompleted || hasError}
      width={600}
      styles={{
        content: {
          backgroundColor: "rgba(40, 40, 40, 0.98)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: "16px",
        },
        header: { display: "none" },
      }}
      footer={null}
      maskClosable={false}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-semibold text-white">
              {isCompleted
                ? "Album Created!"
                : hasError
                ? "Creation Failed"
                : "Creating Album"}
            </h2>
            <p className="text-white/60 mt-1">
              {isCompleted
                ? "Your album is ready to stream"
                : hasError
                ? "Something went wrong"
                : "This may take a few minutes..."}
            </p>
          </div>
          {(canCancel || isCompleted || hasError) && (
            <CloseOutlined
              className="text-2xl cursor-pointer hover:text-white/70 transition-colors"
              style={{ color: "white" }}
              onClick={handleClose}
            />
          )}
        </div>

        {/* Overall Progress */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className={`font-medium ${getPhaseColor(progress.phase)}`}>
              {progress.message}
            </span>
            <span className="text-white/60">
              {Math.round(progress.overallProgress)}%
            </span>
          </div>

          <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
            <motion.div
              className={`h-full rounded-full transition-colors duration-500 ${
                isCompleted
                  ? "bg-gradient-to-r from-green-500 to-emerald-500"
                  : hasError
                  ? "bg-gradient-to-r from-red-500 to-red-600"
                  : "bg-gradient-to-r from-blue-500 to-purple-500"
              }`}
              initial={{ width: 0 }}
              animate={{ width: `${progress.overallProgress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Current Track Progress */}
        <AnimatePresence>
          {progress.phase === "tracks" && progress.currentTrack > 0 && (
            <motion.div
              className="space-y-2"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div className="flex justify-between items-center text-sm">
                <span className="text-white/80">
                  Track {progress.currentTrack} of {progress.totalTracks}
                </span>
                <span className="text-white/60">
                  {Math.round(progress.currentTrackProgress)}%
                </span>
              </div>

              <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress.currentTrackProgress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Phase Indicators */}
        <div className="flex items-center justify-between text-sm">
          {[
            { key: "album" as const, label: "Album" },
            { key: "tracks" as const, label: "Tracks" },
            { key: "finalization" as const, label: "Finalize" },
            { key: "completed" as const, label: "Done" },
          ].map((phase, index) => {
            const isActive = progress.phase === phase.key;
            const isCompleted =
              (progress.phase === "tracks" && phase.key === "album") ||
              (progress.phase === "finalization" &&
                ["album", "tracks"].includes(phase.key)) ||
              (progress.phase === "completed" &&
                ["album", "tracks", "finalization"].includes(phase.key));

            return (
              <div key={phase.key} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-300 ${
                    isActive
                      ? "bg-blue-500 text-white"
                      : isCompleted
                      ? "bg-green-500 text-white"
                      : "bg-white/10 text-white/40"
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircleOutlined className="text-sm" />
                  ) : isActive ? (
                    <LoadingOutlined className="text-sm animate-spin" />
                  ) : (
                    index + 1
                  )}
                </div>
                <span
                  className={`ml-2 ${
                    isActive
                      ? "text-blue-400"
                      : isCompleted
                      ? "text-green-400"
                      : "text-white/40"
                  }`}
                >
                  {phase.label}
                </span>
                {index < 3 && (
                  <div
                    className={`w-8 h-0.5 mx-2 ${
                      isCompleted ? "bg-green-400" : "bg-white/20"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Tracks List */}
        <div className="max-h-60 overflow-y-auto space-y-2">
          <h4 className="text-white font-medium mb-3">Track Progress</h4>
          {progress.tracks.map((track, index) => (
            <motion.div
              key={track.tempId}
              className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="flex items-center gap-3">
                {getStatusIcon(track.status)}
                <div>
                  <h5 className="text-white font-medium text-sm">
                    {track.name}
                  </h5>
                  <p className="text-white/60 text-xs capitalize">
                    {track.status}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {track.error && (
                  <span className="text-red-400 text-xs">{track.error}</span>
                )}
                <div className="w-16 text-right">
                  <span className="text-white/60 text-sm">
                    {track.progress}%
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Success Actions */}
        <AnimatePresence>
          {isCompleted && (
            <motion.div
              className="flex justify-center gap-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <button
                onClick={handleClose}
                className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold rounded-lg transition-all duration-200"
              >
                Continue to Studio
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Actions */}
        <AnimatePresence>
          {hasError && (
            <motion.div
              className="flex justify-center gap-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <button
                onClick={handleClose}
                className="px-6 py-2 bg-white/10 text-white border border-white/20 hover:bg-white/20 rounded-lg transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setSaveStarted(false);
                  setProgress((prev) => ({
                    ...prev,
                    phase: "album",
                    overallProgress: 0,
                    currentTrackProgress: 0,
                    message: "Initializing...",
                    tracks: prev.tracks.map((t) => ({
                      ...t,
                      status: "pending",
                      progress: 0,
                      error: undefined,
                    })),
                  }));
                }}
                className="px-8 py-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold rounded-lg transition-all duration-200"
              >
                Try Again
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Modal>
  );
};

export default BatchSaveModal;
