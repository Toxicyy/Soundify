import express from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { uploadCover } from "../middleware/upload.middleware.js";
import {
  validatePlaylistCreation,
  validatePlaylistUpdate,
} from "../middleware/validation.middleware.js";
import {
  addTrackToPlaylist,
  createPlatformPlaylist,
  createPlaylist,
  createQuickPlaylist,
  deletePlatformPlaylist,
  deletePlaylist,
  getAllPlaylists,
  getFeaturedPlaylists,
  getLikedPlaylists,
  getPlatformDrafts,
  getPlatformPlaylists,
  getPlaylistById,
  getPlaylistLikeStatus,
  getPlaylistsByCategory,
  getPlaylistsByTag,
  getPlaylistStats,
  getPlaylistTracks,
  getUserPlaylists,
  likePlaylist,
  publishPlatformPlaylist,
  publishPlaylist,
  removeTrackFromPlaylist,
  searchPlaylists,
  unlikePlaylist,
  updatePlatformPlaylist,
  updatePlaylist,
  updateTrackOrder,
} from "../controllers/playlist.controller.js";
import { adminOnly } from "../middleware/admin.middleware.js";
import PlaylistService from "../services/PlaylistService.js";
import { ApiResponse } from "../utils/responses.js";

const router = express.Router();

/**
 * Public routes - no authentication required
 */
router.get("/", getAllPlaylists);
router.get("/search", searchPlaylists);
router.get("/featured", getFeaturedPlaylists);
router.get("/category/:category", getPlaylistsByCategory);
router.get("/tag/:tag", getPlaylistsByTag);

/**
 * Protected routes - authentication required
 */
router.get("/:id", authenticate, getPlaylistById);
router.get("/:id/tracks", authenticate, getPlaylistTracks);
router.get("/:id/statistics", authenticate, getPlaylistStats);
router.get("/:playlistId/like-status", authenticate, getPlaylistLikeStatus);

/**
 * User-specific playlist routes
 */
router.get("/user/:userId", getUserPlaylists);
router.get("/user/liked", authenticate, getLikedPlaylists);

/**
 * Playlist creation and management routes
 */
router.post(
  "/",
  authenticate,
  uploadCover,
  validatePlaylistCreation,
  createPlaylist
);
router.post("/quick", authenticate, createQuickPlaylist);

/**
 * Playlist modification routes with enhanced security
 * These routes now include proper permission checking in controllers
 */
router.put(
  "/:id",
  authenticate,
  uploadCover,
  validatePlaylistUpdate,
  updatePlaylist
);

router.delete("/:id", authenticate, deletePlaylist);
router.post("/:id/publish", authenticate, publishPlaylist);

/**
 * Track management routes with enhanced security
 */
router.post("/:playlistId/tracks/:trackId", authenticate, addTrackToPlaylist);
router.delete(
  "/:playlistId/tracks/:trackId",
  authenticate,
  removeTrackFromPlaylist
);
router.put("/:playlistId/tracks/order", authenticate, updateTrackOrder);

/**
 * Like/Unlike functionality routes
 */
router.post("/:playlistId/like", authenticate, likePlaylist);
router.delete("/:playlistId/like", authenticate, unlikePlaylist);

/**
 * Admin-only platform playlist management routes
 */
router.get("/admin/platform", authenticate, adminOnly, getPlatformPlaylists);
router.get(
  "/admin/platform/drafts",
  authenticate,
  adminOnly,
  getPlatformDrafts
);

router.post(
  "/admin/platform",
  authenticate,
  adminOnly,
  uploadCover,
  validatePlaylistCreation,
  createPlatformPlaylist
);

router.put(
  "/admin/platform/:id",
  authenticate,
  adminOnly,
  uploadCover,
  validatePlaylistUpdate,
  updatePlatformPlaylist
);

router.post(
  "/admin/platform/:id/publish",
  authenticate,
  adminOnly,
  publishPlatformPlaylist
);

router.delete(
  "/admin/platform/:id",
  authenticate,
  adminOnly,
  deletePlatformPlaylist
);

/**
 * Admin statistics route
 */
router.get(
  "/admin/platform/stats",
  authenticate,
  adminOnly,
  async (req, res) => {
    try {
      const stats = await PlaylistService.getPlatformPlaylistStats();
      res.json(ApiResponse.success("Platform playlist stats retrieved", stats));
    } catch (error) {
      res.status(500).json(ApiResponse.error(error.message));
    }
  }
);

export default router;
