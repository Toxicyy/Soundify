import express from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import {
  uploadBatchAlbum,
  validateBatchUploadStructure,
} from "../middleware/uploadBatch.middleware.js";
import {
  validateBatchAlbumCreation,
  checkSystemLimits,
  generateSessionId,
} from "../middleware/validateBatchAlbum.middleware.js";
import {
  createBatchAlbum,
  getBatchProgress,
  getBatchProgressRest,
  cancelBatchCreation,
  getActiveSessions,
  cleanupSessions,
} from "../controllers/batchAlbum.controller.js";

const router = express.Router();

/**
 * Batch album creation routes
 * Handles creating albums with multiple tracks and real-time progress tracking
 */

// Main batch creation endpoint - middleware order is critical
router.post(
  "/",
  authenticate,
  uploadBatchAlbum,
  validateBatchUploadStructure,
  validateBatchAlbumCreation,
  checkSystemLimits,
  generateSessionId,
  createBatchAlbum
);

// Progress tracking endpoints
router.get("/progress/:sessionId", getBatchProgress); // SSE real-time progress
router.get("/status/:sessionId", getBatchProgressRest); // REST progress alternative

// Session management
router.delete("/:sessionId", authenticate, cancelBatchCreation); // Cancel batch creation
router.get("/sessions", authenticate, getActiveSessions); // Active sessions (admin)
router.post("/cleanup", authenticate, cleanupSessions); // Manual cleanup (admin)

export default router;
