import express from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { uploadCover } from "../middleware/upload.middleware.js";
import {
  validatePlaylistCreation,
  validatePlaylistUpdate,
} from "../middleware/validation.middleware.js";
import {
  addTrackToPlaylist,
  createPlaylist,
  createQuickPlaylist,
  deletePlaylist,
  getAllPlaylists,
  getFeaturedPlaylists,
  getPlaylistById,
  getPlaylistsByCategory,
  getPlaylistsByTag,
  getPlaylistStats,
  getPlaylistTracks,
  likePlaylist,
  publishPlaylist,
  removeTrackFromPlaylist,
  searchPlaylists,
  unlikePlaylist,
  updatePlaylist,
  updateTrackOrder,
} from "../controllers/playlist.controller.js";

const router = express.Router();

router.get("/", getAllPlaylists);
router.get("/search", searchPlaylists);
router.get("/featured", getFeaturedPlaylists);
router.get("/category/:category", getPlaylistsByCategory);
router.get("/tag/:tag", getPlaylistsByTag);
router.get("/:id", authenticate, getPlaylistById);
router.get("/:id/tracks", authenticate, getPlaylistTracks);
router.get("/:id/statistics", getPlaylistStats);

router.post(
  "/",
  authenticate,
  uploadCover,
  validatePlaylistCreation,
  createPlaylist
);
router.post("/quick", authenticate, createQuickPlaylist);
router.post("/:id/publish", authenticate, publishPlaylist);
router.put(
  "/:id",
  authenticate,
  uploadCover,
  validatePlaylistUpdate,
  updatePlaylist
);
router.delete("/:id", authenticate, deletePlaylist);
router.post("/:playlistId/tracks/:trackId", authenticate, addTrackToPlaylist);
router.delete("/:id/tracks/:trackId", authenticate, removeTrackFromPlaylist);
router.put("/:playlistId/tracks/order", authenticate, updateTrackOrder);
router.post("/:id/like", authenticate, likePlaylist);
router.delete("/:id/like", authenticate, unlikePlaylist);

export default router;
