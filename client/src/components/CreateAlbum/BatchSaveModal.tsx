import React, { useState, useCallback, useEffect, useRef } from "react";
import { Modal } from "antd";
import {
  LoadingOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  CloseOutlined,
  StopOutlined,
} from "@ant-design/icons";
import { motion, AnimatePresence } from "framer-motion";
import { useNotification } from "../../hooks/useNotification";
import {
  createBatchAlbum,
  BatchProgressTracker,
  cancelBatchCreation,
} from "../../shared/batchAlbumApi";
import type { LocalTrack, AlbumData } from "../../types/LocalTrack";

interface BatchSaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  albumData: AlbumData;
  tracks: LocalTrack[];
  onSuccess: () => void;
}

interface TrackProgress {
  tempId: string;
  index: number;
  name: string;
  status: "pending" | "uploading" | "processing" | "completed" | "error";
  progress: number;
  error?: string;
  message?: string;
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
  albumName: string;
  sessionId: string;
  status: "processing" | "completed" | "failed";
}

const BatchSaveModal: React.FC<BatchSaveModalProps> = ({
  isOpen,
  onClose,
  albumData,
  tracks,
  onSuccess,
}) => {
  const { showSuccess, showError } = useNotification();
  const progressTrackerRef = useRef<BatchProgressTracker | null>(null);

  const [progress, setProgress] = useState<SaveProgress>({
    sessionId: "",
    status: "processing",
    phase: "album",
    message: "Initializing...",
    albumName: albumData.name,
    totalTracks: tracks.length,
    currentTrack: 0,
    overallProgress: 0,
    currentTrackProgress: 0,
    tracks: tracks.map((track) => ({
      tempId: track.tempId,
      index: track.index,
      name: track.metadata.name,
      status: "pending",
      progress: 0,
    })),
  });

  const [canCancel, setCanCancel] = useState(true);
  const [saveStarted, setSaveStarted] = useState(false);

  // Start save process with real API
  const startSaveProcess = useCallback(async () => {
    try {
      setProgress((prev) => ({
        ...prev,
        message: "Starting album creation...",
        overallProgress: 5,
      }));

      // Start batch creation
      const response = await createBatchAlbum(albumData, tracks);

      if (!response.success || !response.data) {
        throw new Error(response.error || "Failed to start album creation");
      }

      const { sessionId } = response.data;

      setProgress((prev) => ({
        ...prev,
        sessionId,
        message: "Album creation started. Connecting to progress...",
        overallProgress: 10,
      }));

      // Start progress tracking via SSE
      const tracker = new BatchProgressTracker(
        sessionId,
        handleProgressUpdate,
        handleComplete,
        handleError
      );

      progressTrackerRef.current = tracker;
      tracker.start();
    } catch (error) {
      console.error("Failed to start save process:", error);
      handleError(
        error instanceof Error
          ? error.message
          : "Failed to start album creation"
      );
    }
  }, [albumData, tracks]);

  // Handle progress updates from SSE
  const handleProgressUpdate = useCallback((newProgress: any) => {
    setProgress((prev) => ({
      ...prev,
      sessionId: newProgress.sessionId || prev.sessionId,
      status: newProgress.status || prev.status,
      phase:
        newProgress.phase === "completed"
          ? "completed"
          : newProgress.phase === "tracks"
          ? "tracks"
          : newProgress.phase === "album"
          ? "album"
          : prev.phase,
      message: newProgress.message || prev.message,
      albumName: newProgress.albumName || prev.albumName,
      totalTracks: newProgress.totalTracks || prev.totalTracks,
      currentTrack: newProgress.currentTrack || prev.currentTrack,
      overallProgress: newProgress.overallProgress || prev.overallProgress,
      currentTrackProgress:
        newProgress.currentTrackProgress || prev.currentTrackProgress,
      tracks: newProgress.tracks
        ? newProgress.tracks.map((track: any) => ({
            tempId: track.tempId,
            index: track.index,
            name: track.name,
            status: track.status,
            progress: track.progress || 0,
            message: track.message,
            error: track.error,
          }))
        : prev.tracks,
    }));

    // Disable cancel once we're in completion phase
    if (newProgress.phase === "completed" || newProgress.overallProgress > 90) {
      setCanCancel(false);
    }
  }, []);

  // Handle completion
  const handleComplete = useCallback(
    (success: boolean, message?: string) => {
      setCanCancel(false);

      if (success) {
        setProgress((prev) => ({
          ...prev,
          status: "completed",
          phase: "completed",
          message: message || "Album created successfully!",
          overallProgress: 100,
        }));

        showSuccess("Album created successfully!");

        // Auto-close after 2 seconds
        setTimeout(() => {
          onSuccess();
        }, 2000);
      } else {
        handleError(message || "Album creation failed");
      }
    },
    [showSuccess, onSuccess]
  );

  // Handle errors
  const handleError = useCallback(
    (error: string) => {
      setProgress((prev) => ({
        ...prev,
        status: "failed",
        phase: "error",
        message: error,
        tracks: prev.tracks.map((t) =>
          t.status === "uploading" || t.status === "processing"
            ? { ...t, status: "error", error: "Upload failed" }
            : t
        ),
      }));

      setCanCancel(false);
      showError(error);
    },
    [showError]
  );

  // Handle cancel
  const handleCancel = useCallback(async () => {
    if (!canCancel || !progress.sessionId) return;

    try {
      setProgress((prev) => ({
        ...prev,
        message: "Cancelling album creation...",
      }));

      const cancelled = await cancelBatchCreation(progress.sessionId);

      if (cancelled) {
        setProgress((prev) => ({
          ...prev,
          status: "failed",
          phase: "error",
          message: "Album creation cancelled by user",
        }));

        showSuccess("Album creation cancelled");
      } else {
        showError("Failed to cancel album creation");
      }
    } catch (error) {
      showError("Failed to cancel album creation");
    }

    setCanCancel(false);
  }, [canCancel, progress.sessionId, showSuccess, showError]);

  // Update totalTracks when tracks prop changes
  useEffect(() => {
    setProgress((prev) => ({
      ...prev,
      totalTracks: tracks.length,
      tracks: tracks.map((track) => ({
        tempId: track.tempId,
        index: track.index,
        name: track.metadata.name,
        status: "pending",
        progress: 0,
      })),
    }));
  }, [tracks]);

  // Start save process when modal opens
  useEffect(() => {
    if (isOpen && !saveStarted) {
      setSaveStarted(true);
      setCanCancel(true);
      startSaveProcess();
    }
  }, [isOpen, saveStarted, startSaveProcess]);

  // Cleanup on unmount or modal close
  useEffect(() => {
    return () => {
      if (progressTrackerRef.current) {
        progressTrackerRef.current.stop();
        progressTrackerRef.current = null;
      }
    };
  }, []);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSaveStarted(false);
      setCanCancel(true);

      if (progressTrackerRef.current) {
        progressTrackerRef.current.stop();
        progressTrackerRef.current = null;
      }

      // Reset progress
      setProgress({
        sessionId: "",
        status: "processing",
        phase: "album",
        message: "Initializing...",
        albumName: albumData.name,
        totalTracks: tracks.length,
        currentTrack: 0,
        overallProgress: 0,
        currentTrackProgress: 0,
        tracks: tracks.map((track) => ({
          tempId: track.tempId,
          index: track.index,
          name: track.metadata.name,
          status: "pending",
          progress: 0,
        })),
      });
    }
  }, [isOpen, albumData.name, tracks]);

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
  const getPhaseColor = (phase: SavePhase): string => {
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

          <div className="flex items-center gap-2">
            {progress.status === "processing" && canCancel && (
              <button
                onClick={handleCancel}
                className="flex items-center gap-2 px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-colors border border-red-500/30 text-sm"
              >
                <StopOutlined />
                Cancel
              </button>
            )}

            {(canCancel || isCompleted || hasError) && (
              <CloseOutlined
                className="text-2xl cursor-pointer hover:text-white/70 transition-colors"
                style={{ color: "white" }}
                onClick={handleClose}
              />
            )}
          </div>
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
                    {track.message || track.status}
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
                    status: "processing",
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
