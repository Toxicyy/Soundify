import express from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { uploadBatchAlbum, validateBatchUploadStructure } from "../middleware/uploadBatch.middleware.js";
import { 
  validateBatchAlbumCreation, 
  checkSystemLimits, 
  generateSessionId 
} from "../middleware/validateBatchAlbum.middleware.js";
import {
  createBatchAlbum,
  getBatchProgress,
  getBatchProgressRest,
  cancelBatchCreation,
  getActiveSessions,
  cleanupSessions
} from "../controllers/batchAlbum.controller.js";

const router = express.Router();

/**
 * Batch album creation endpoint
 * POST /api/albums/batch
 * 
 * Creates an album with multiple tracks in one operation
 * Accepts multipart/form-data with album metadata and track files
 * 
 * Form fields:
 * - albumName: string (required)
 * - albumDescription: string (optional)
 * - albumGenre: string|array (optional)
 * - albumType: enum["album","ep","single"] (optional, default: "album")
 * - releaseDate: ISO date string (optional)
 * - albumCover: file (required) - album cover image
 * - tracks[i][name]: string (required) - track name
 * - tracks[i][genre]: string (optional) - track genre
 * - tracks[i][tags]: string|array (optional) - track tags
 * - tracks[i][audio]: file (required) - track audio file
 * - tracks[i][cover]: file (required) - track cover image
 * 
 * Returns: 202 Accepted with sessionId for progress tracking
 */
router.post(
  "/",
  authenticate, // Verify user authentication and artist profile
  uploadBatchAlbum, // Handle multipart file upload (up to 500MB total)
  validateBatchUploadStructure, // Validate file structure and limits
  validateBatchAlbumCreation, // Validate album and track data
  checkSystemLimits, // Check processing limits and capacity
  generateSessionId, // Generate unique session ID for progress tracking
  createBatchAlbum // Start batch creation process
);

/**
 * SSE Progress tracking endpoint
 * GET /api/albums/batch/progress/:sessionId
 * 
 * Provides real-time progress updates via Server-Sent Events
 * Streams progress data every second until completion or failure
 * 
 * Response format:
 * - Event-stream with JSON data containing progress information
 * - Includes overall progress, individual track progress, and step details
 * - Automatically closes connection when process completes
 */
router.get("/progress/:sessionId", getBatchProgress);

/**
 * REST Progress endpoint (alternative to SSE)
 * GET /api/albums/batch/status/:sessionId
 * 
 * Returns current progress state as JSON response
 * Useful for clients that don't support SSE or for polling-based progress tracking
 */
router.get("/status/:sessionId", getBatchProgressRest);

/**
 * Cancel batch creation
 * DELETE /api/albums/batch/:sessionId
 * 
 * Attempts to cancel ongoing batch creation process
 * Performs cleanup and rollback of any created resources
 * Note: Cannot cancel already completed processes
 */
router.delete(
  "/:sessionId",
  authenticate, // Verify user authentication
  cancelBatchCreation
);

// Admin/Debug endpoints (require authentication)

/**
 * Get active sessions
 * GET /api/albums/batch/sessions
 * 
 * Returns list of currently active batch creation sessions
 * Useful for monitoring and debugging purposes
 * TODO: Add admin role check for production use
 */
router.get(
  "/sessions",
  authenticate,
  getActiveSessions
);

/**
 * Manual session cleanup
 * POST /api/albums/batch/cleanup
 * 
 * Manually triggers cleanup of expired session data
 * Removes progress data older than 2 hours
 * TODO: Add admin role check for production use
 */
router.post(
  "/cleanup",
  authenticate,
  cleanupSessions
);

export default router;