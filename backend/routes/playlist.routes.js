import express from "express";
import {
  createPlaylist,
  getUserPlaylists,
} from "../controllers/playlist.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

/**
 * Playlist routes configuration
 * All playlist operations require user authentication
 */

const router = express.Router();

// Protected routes - all playlist operations require authentication
router.post("/", authenticate, createPlaylist);           // Create new playlist
router.get("/user/:userId", authenticate, getUserPlaylists); // Get user's playlists

export default router;