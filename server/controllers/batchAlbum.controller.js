/**
 * Batch Album Controller
 * Handles HTTP requests for batch album creation with progress tracking
 * Provides endpoints for creating albums with multiple tracks and SSE progress streaming
 */

import BatchAlbumService from "../services/BatchAlbumService.js";
import { ApiResponse } from "../utils/responses.js";
import { catchAsync } from "../utils/helpers.js";

/**
 * Create album with multiple tracks in batch operation
 * Initiates async album creation process with progress tracking
 */
export const createBatchAlbum = catchAsync(async (req, res) => {
  const { sessionId, artistInfo, batchInfo } = req;

  // Validate required data from middleware
  if (!sessionId) {
    return res.status(500).json(ApiResponse.error("Session ID not found"));
  }

  if (!artistInfo || !artistInfo.artistId) {
    return res
      .status(500)
      .json(ApiResponse.error("Artist information not found"));
  }

  if (!batchInfo || !batchInfo.trackIndices) {
    return res
      .status(500)
      .json(ApiResponse.error("Track information not found"));
  }

  const { artistId } = artistInfo;
  const { trackIndices } = batchInfo;

  // Extract album data from request body
  const albumData = {
    name: req.body.albumName,
    description: req.body.albumDescription || "",
    genre: req.body.albumGenre || [],
    type: req.body.albumType || "album",
    releaseDate: req.body.releaseDate,
  };

  // Extract track data using indices from middleware
  const trackData = trackIndices.map((index, position) => {
    const nameField = `tracks[${index}][name]`;
    const genreField = `tracks[${index}][genre]`;
    const tagsField = `tracks[${index}][tags]`;

    const trackName = req.body[nameField];
    const trackGenre = req.body[genreField];
    const trackTags = req.body[tagsField];

    // Validate files exist
    const audioField = `tracks[${index}][audio]`;
    const coverField = `tracks[${index}][cover]`;

    const hasAudio = !!(
      req.files &&
      req.files[audioField] &&
      req.files[audioField][0]
    );
    const hasCover = !!(
      req.files &&
      req.files[coverField] &&
      req.files[coverField][0]
    );

    if (!hasAudio) {
      throw new Error(
        `Audio file missing for track ${position + 1}: ${trackName}`
      );
    }

    if (!hasCover) {
      throw new Error(
        `Cover file missing for track ${position + 1}: ${trackName}`
      );
    }

    return {
      index,
      name: trackName || `Track ${position + 1}`,
      genre: trackGenre || "",
      tags: Array.isArray(trackTags) ? trackTags : trackTags ? [trackTags] : [],
    };
  });

  // Final validation of extracted data
  for (let i = 0; i < trackData.length; i++) {
    const track = trackData[i];

    if (
      !track.name ||
      track.name.trim() === "" ||
      track.name === `Track ${i + 1}`
    ) {
      return res
        .status(400)
        .json(ApiResponse.error(`Track name ${i + 1} is required`));
    }
  }

  // Validate album cover
  if (!req.files || !req.files.albumCover || !req.files.albumCover[0]) {
    return res
      .status(400)
      .json(ApiResponse.error("Album cover is required"));
  }

  try {
    // Start batch creation process (runs asynchronously)
    BatchAlbumService.createBatchAlbum(
      albumData,
      req.files,
      trackData,
      sessionId,
      req.user.id,
      artistId
    ).catch((error) => {
      console.error(`Batch creation failed for session ${sessionId}:`, error);
    });

    // Return immediate response with session ID
    res.status(202).json(
      ApiResponse.success("Album creation started", {
        sessionId,
        message:
          "Album creation process started. Use sessionId to track progress.",
        progressUrl: `/api/albums/batch/progress/${sessionId}`,
        trackCount: trackData.length,
        estimatedTime: `${Math.ceil(trackData.length * 1.5)} minutes`,
        albumName: albumData.name,
        artistName: artistInfo.artistName,
      })
    );
  } catch (error) {
    return res
      .status(500)
      .json(
        ApiResponse.error("Failed to start album creation", error.message)
      );
  }
});

/**
 * Get progress for batch album creation via SSE
 * Streams real-time progress updates to client
 */
export const getBatchProgress = catchAsync(async (req, res) => {
  const { sessionId } = req.params;

  if (!sessionId) {
    return res.status(400).json(ApiResponse.error("Session ID is required"));
  }

  // Set SSE headers
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Cache-Control",
  });

  // Send initial connection confirmation
  res.write(
    `data: ${JSON.stringify({
      type: "connected",
      sessionId,
      timestamp: new Date().toISOString(),
    })}\n\n`
  );

  // Progress polling interval
  const pollInterval = setInterval(() => {
    const progressData = BatchAlbumService.getProgress(sessionId);

    if (!progressData) {
      res.write(
        `data: ${JSON.stringify({
          type: "error",
          message: "Session not found or expired",
          sessionId,
        })}\n\n`
      );
      clearInterval(pollInterval);
      res.end();
      return;
    }

    // Send progress update
    res.write(
      `data: ${JSON.stringify({
        type: "progress",
        sessionId,
        data: progressData,
        timestamp: new Date().toISOString(),
      })}\n\n`
    );

    // Check if process is completed or failed
    if (
      progressData.status === "completed" ||
      progressData.status === "failed"
    ) {
      res.write(
        `data: ${JSON.stringify({
          type: "finished",
          status: progressData.status,
          sessionId,
          message:
            progressData.status === "completed"
              ? "Album created successfully"
              : "Album creation failed",
          timestamp: new Date().toISOString(),
        })}\n\n`
      );

      clearInterval(pollInterval);
      res.end();
    }
  }, 1000); // Update every second

  // Handle client disconnect
  req.on("close", () => {
    clearInterval(pollInterval);
  });

  req.on("end", () => {
    clearInterval(pollInterval);
  });
});

/**
 * Get current progress status (REST endpoint alternative to SSE)
 * Returns current progress state as JSON
 */
export const getBatchProgressRest = catchAsync(async (req, res) => {
  const { sessionId } = req.params;

  if (!sessionId) {
    return res.status(400).json(ApiResponse.error("Session ID is required"));
  }

  const progressData = BatchAlbumService.getProgress(sessionId);

  if (!progressData) {
    return res
      .status(404)
      .json(
        ApiResponse.error(
          "Session not found",
          "Session may be completed or expired"
        )
      );
  }

  res.json(
    ApiResponse.success("Progress retrieved successfully", {
      sessionId,
      progress: progressData,
      isCompleted:
        progressData.status === "completed" || progressData.status === "failed",
    })
  );
});

/**
 * Cancel batch album creation
 * Attempts to stop ongoing creation process
 */
export const cancelBatchCreation = catchAsync(async (req, res) => {
  const { sessionId } = req.params;

  if (!sessionId) {
    return res.status(400).json(ApiResponse.error("Session ID is required"));
  }

  const progressData = BatchAlbumService.getProgress(sessionId);

  if (!progressData) {
    return res
      .status(404)
      .json(
        ApiResponse.error(
          "Session not found",
          "Session may already be completed"
        )
      );
  }

  if (progressData.status === "completed") {
    return res
      .status(400)
      .json(
        ApiResponse.error("Cannot cancel", "Album creation already completed")
      );
  }

  try {
    // Mark session as cancelled
    BatchAlbumService.updateProgress(sessionId, {
      status: "failed",
      message: "Album creation cancelled by user",
    });

    res.json(
      ApiResponse.success("Cancellation request accepted", {
        sessionId,
        message:
          "Cancellation request sent. Process will be stopped and changes will be rolled back.",
        note: "Cancellation may take some time to complete current operations.",
      })
    );
  } catch (error) {
    return res
      .status(500)
      .json(ApiResponse.error("Cancellation error", error.message));
  }
});

/**
 * Get list of active batch sessions (admin/debug endpoint)
 * Returns overview of all ongoing batch operations
 */
export const getActiveSessions = catchAsync(async (req, res) => {
  try {
    const sessions = [];

    for (const [sessionId, data] of BatchAlbumService.progressData.entries()) {
      sessions.push({
        sessionId,
        status: data.status,
        startTime: data.startTime,
        lastUpdate: data.lastUpdate,
        trackCount: data.totalTracks,
        overallProgress: data.overallProgress || 0,
        currentStep: data.phase,
        message: data.message,
        albumName: data.albumName,
      });
    }

    res.json(
      ApiResponse.success("Active sessions retrieved successfully", {
        sessions,
        totalActive: sessions.length,
      })
    );
  } catch (error) {
    return res
      .status(500)
      .json(
        ApiResponse.error("Error retrieving active sessions", error.message)
      );
  }
});

/**
 * Cleanup expired sessions (admin endpoint)
 * Removes old completed or failed sessions from memory
 */
export const cleanupSessions = catchAsync(async (req, res) => {
  try {
    const beforeCount = BatchAlbumService.progressData.size;
    BatchAlbumService.cleanupOldProgress();
    const afterCount = BatchAlbumService.progressData.size;
    const cleanedCount = beforeCount - afterCount;

    res.json(
      ApiResponse.success("Cleanup completed", {
        before: beforeCount,
        after: afterCount,
        cleaned: cleanedCount,
      })
    );
  } catch (error) {
    return res
      .status(500)
      .json(ApiResponse.error("Session cleanup error", error.message));
  }
});