import express from "express";
import {
  createTrack,
  getAllTracks,
  searchTracks,
  getTrackById,
  streamTrack,
  incrementListenCount,
  deleteTrack,
  updateTrack,
} from "../controllers/track.controller.js";
import { authenticate, optionalAuth } from "../middleware/auth.middleware.js";
import { validateTrackCreation } from "../middleware/validation.middleware.js";
import { uploadTrackFiles } from "../middleware/upload.middleware.js";

/**
 * Track routes configuration
 * Handles all track-related HTTP endpoints with proper ordering for streaming
 */

const router = express.Router();

// Streaming routes - CRITICAL: Order matters for proper route matching
// These must be defined before generic /:id routes to avoid conflicts
router.get("/:id/segment/:segmentName", streamTrack);  // HLS segment streaming (highest priority)
router.get("/:id/playlist.m3u8", streamTrack);         // HLS playlist endpoint
router.get("/:id/stream", streamTrack);                // General streaming endpoint

// Public routes - no authentication required
router.get("/", optionalAuth, getAllTracks);           // Get all tracks with optional user context
router.get("/search", searchTracks);                   // Search tracks by query
router.get("/:id", getTrackById);                      // Get track metadata by ID

// Interaction routes
router.patch("/:id/listen", incrementListenCount);     // Manual listen count increment

// Protected routes - require authentication
router.post(
  "/",
  authenticate,                    // Verify user authentication
  uploadTrackFiles,               // Handle multipart file upload
  validateTrackCreation,          // Validate track data
  createTrack                     // Create track with HLS processing
);

router.put("/:id", authenticate, updateTrack);         // Update track metadata
router.delete("/:id", authenticate, deleteTrack);      // Delete track

export default router;