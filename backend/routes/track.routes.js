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

const router = express.Router();

// Публичные маршруты
router.get("/", optionalAuth, getAllTracks);
router.get("/search", searchTracks);
router.get("/:id", getTrackById); // Метаданные трека

// Стриминг маршруты - ВАЖНЫЙ ПОРЯДОК!
router.get("/:id/segment/:segmentName", streamTrack); // Сегменты HLS (должен быть ПЕРВЫМ)
router.get("/:id/playlist.m3u8", streamTrack); // HLS плейлист
router.get("/:id/stream", streamTrack); // Общий стриминг endpoint
router.patch("/:id/listen", incrementListenCount);

// Защищенные маршруты
router.post(
  "/",
  authenticate,
  uploadTrackFiles,
  validateTrackCreation,
  createTrack
);

router.put("/:id", authenticate, updateTrack);
router.delete("/:id", authenticate, deleteTrack);

export default router;
