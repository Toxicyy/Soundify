import React, { useState, useCallback, useEffect, useRef } from "react";
import { Modal } from "antd";
import { useNavigate } from "react-router-dom";
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

/**
 * Batch album creation modal with real-time progress tracking
 * Features: SSE progress updates, cancellation, error handling
 */
const BatchSaveModal: React.FC<BatchSaveModalProps> = ({
  isOpen,
  onClose,
  albumData,
  tracks,
  onSuccess,
}) => {
  const { showSuccess, showError } = useNotification();
  const navigate = useNavigate();
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
  const [albumCreated, setAlbumCreated] = useState(false);

  const startSaveProcess = useCallback(async () => {
    try {
      setProgress((prev) => ({
        ...prev,
        message: "Starting album creation...",
        overallProgress: 5,
      }));

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

      const tracker = new BatchProgressTracker(
        sessionId,
        handleProgressUpdate,
        handleComplete,
        handleError
      );

      progressTrackerRef.current = tracker;
      tracker.start();
    } catch (error) {
      handleError(
        error instanceof Error
          ? error.message
          : "Failed to start album creation"
      );
    }
  }, [albumData, tracks]);

  const handleProgressUpdate = useCallback((newProgress: any) => {
    setProgress((prev) => ({
      ...prev,
      sessionId: newProgress.sessionId || prev.sessionId,
      status: newProgress.status || prev.status,
      phase:
        newProgress.phase === "completed"
          ? "completed"
          : newProgress.phase || prev.phase,
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

    if (newProgress.phase === "completed" || newProgress.overallProgress > 90) {
      setCanCancel(false);
    }
  }, []);

  const handleComplete = useCallback(
    (success: boolean, message?: string) => {
      setCanCancel(false);

      if (success) {
        setAlbumCreated(true);
        setProgress((prev) => ({
          ...prev,
          status: "completed",
          phase: "completed",
          message: message || "Album created successfully!",
          overallProgress: 100,
        }));

        showSuccess("Album created successfully!");

        setTimeout(() => {
          handleRedirectToStudio();
        }, 3000);
      } else {
        handleError(message || "Album creation failed");
      }
    },
    [showSuccess]
  );

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

  const handleRedirectToStudio = useCallback(() => {
    if (progressTrackerRef.current) {
      progressTrackerRef.current.stop();
      progressTrackerRef.current = null;
    }

    onSuccess();
    onClose();
    navigate("/artist-studio");
  }, [onSuccess, onClose, navigate]);

  const handleClose = useCallback(() => {
    if (albumCreated || progress.phase === "completed") {
      handleRedirectToStudio();
      return;
    }

    if (canCancel || progress.phase === "error") {
      onClose();
    }
  }, [
    albumCreated,
    progress.phase,
    canCancel,
    handleRedirectToStudio,
    onClose,
  ]);

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

  useEffect(() => {
    if (isOpen && !saveStarted) {
      setSaveStarted(true);
      setCanCancel(true);
      setAlbumCreated(false);
      startSaveProcess();
    }
  }, [isOpen, saveStarted, startSaveProcess]);

  useEffect(() => {
    return () => {
      if (progressTrackerRef.current) {
        progressTrackerRef.current.stop();
        progressTrackerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setSaveStarted(false);
      setCanCancel(true);
      setAlbumCreated(false);

      if (progressTrackerRef.current) {
        progressTrackerRef.current.stop();
        progressTrackerRef.current = null;
      }

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
      width="90vw"
      style={{ maxWidth: "600px" }}
      styles={{
        content: {
          backgroundColor: "rgba(40, 40, 40, 0.98)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: "16px",
          maxHeight: "90vh",
          overflow: "hidden",
        },
        header: { display: "none" },
        body: {
          padding: "16px",
          maxHeight: "calc(90vh - 32px)",
          overflow: "auto",
        },
      }}
      footer={null}
      maskClosable={false}
    >
      <div className="space-y-4 lg:space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h2 className="text-xl lg:text-2xl font-semibold text-white">
              {isCompleted
                ? "Album Created!"
                : hasError
                ? "Creation Failed"
                : "Creating Album"}
            </h2>
            <p className="text-white/60 mt-1 text-sm lg:text-base">
              {isCompleted
                ? "Redirecting to Artist Studio..."
                : hasError
                ? "Something went wrong"
                : "This may take a few minutes..."}
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
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
                className="text-xl lg:text-2xl cursor-pointer hover:text-white/70 transition-colors"
                style={{ color: "white" }}
                onClick={handleClose}
              />
            )}
          </div>
        </div>

        <div className="space-y-2 lg:space-y-3">
          <div className="flex justify-between items-center">
            <span
              className={`font-medium text-sm lg:text-base ${getPhaseColor(
                progress.phase
              )}`}
            >
              {progress.message}
            </span>
            <span className="text-white/60 text-sm lg:text-base">
              {Math.round(progress.overallProgress)}%
            </span>
          </div>

          <div className="w-full bg-white/10 rounded-full h-2 lg:h-3 overflow-hidden">
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

        <div className="grid grid-cols-2 lg:flex lg:items-center lg:justify-between gap-2 lg:gap-0 text-xs lg:text-sm">
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
              <div
                key={phase.key}
                className="flex items-center lg:flex-1 lg:justify-center"
              >
                <div
                  className={`w-6 h-6 lg:w-8 lg:h-8 rounded-full flex items-center justify-center transition-colors duration-300 ${
                    isActive
                      ? "bg-blue-500 text-white"
                      : isCompleted
                      ? "bg-green-500 text-white"
                      : "bg-white/10 text-white/40"
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircleOutlined className="text-xs lg:text-sm" />
                  ) : isActive ? (
                    <LoadingOutlined className="text-xs lg:text-sm animate-spin" />
                  ) : (
                    <span className="text-xs lg:text-sm">{index + 1}</span>
                  )}
                </div>
                <span
                  className={`ml-2 text-xs lg:text-sm ${
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
                    className={`hidden lg:block w-8 h-0.5 mx-2 ${
                      isCompleted ? "bg-green-400" : "bg-white/20"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>

        <div className="max-h-40 lg:max-h-60 overflow-y-auto space-y-2 queue-scroll">
          <h4 className="text-white font-medium mb-3 text-sm lg:text-base">
            Track Progress
          </h4>
          {progress.tracks.map((track, index) => (
            <motion.div
              key={track.tempId}
              className="flex items-center justify-between p-2 lg:p-3 bg-white/5 rounded-lg border border-white/10"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="flex items-center gap-2 lg:gap-3 min-w-0 flex-1">
                {getStatusIcon(track.status)}
                <div className="min-w-0 flex-1">
                  <h5 className="text-white font-medium text-sm truncate">
                    {track.name}
                  </h5>
                  <p className="text-white/60 text-xs capitalize">
                    {track.message || track.status}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 lg:gap-3 flex-shrink-0">
                {track.error && (
                  <span className="text-red-400 text-xs hidden sm:block">
                    {track.error}
                  </span>
                )}
                <div className="text-right">
                  <span className="text-white/60 text-sm">
                    {track.progress}%
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <AnimatePresence>
          {isCompleted && (
            <motion.div
              className="flex justify-center gap-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <button
                onClick={handleRedirectToStudio}
                className="px-6 lg:px-8 py-2 lg:py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold rounded-lg transition-all duration-200 text-sm lg:text-base"
              >
                Continue to Studio
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {hasError && (
            <motion.div
              className="flex flex-col sm:flex-row justify-center gap-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <button
                onClick={handleClose}
                className="px-4 lg:px-6 py-2 bg-white/10 text-white border border-white/20 hover:bg-white/20 rounded-lg transition-colors text-sm lg:text-base"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setSaveStarted(false);
                  setAlbumCreated(false);
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
                className="px-6 lg:px-8 py-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold rounded-lg transition-all duration-200 text-sm lg:text-base"
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
