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
  getPlatformDrafts,
  getPlatformPlaylists,
  getPlaylistById,
  getPlaylistsByCategory,
  getPlaylistsByTag,
  getPlaylistStats,
  getPlaylistTracks,
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

// Получить все платформенные плейлисты (включая черновики)
router.get("/admin/platform", authenticate, adminOnly, getPlatformPlaylists);

// Получить только черновики платформенных плейлистов
router.get("/admin/platform/drafts", authenticate, adminOnly, getPlatformDrafts);

// Создать новый платформенный плейлист (как черновик)
router.post(
  "/admin/platform",
  authenticate,
  adminOnly,
  uploadCover,
  validatePlaylistCreation,
  createPlatformPlaylist
);

// Обновить платформенный плейлист
router.put(
  "/admin/platform/:id",
  authenticate,
  adminOnly,
  uploadCover,
  validatePlaylistUpdate,
  updatePlatformPlaylist
);

// Опубликовать платформенный плейлист (убрать статус черновика)
router.post(
  "/admin/platform/:id/publish",
  authenticate,
  adminOnly,
  publishPlatformPlaylist
);

// Удалить платформенный плейлист
router.delete(
  "/admin/platform/:id",
  authenticate,
  adminOnly,
  deletePlatformPlaylist
);

// Статистика платформенных плейлистов (бонус для дашборда)
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
