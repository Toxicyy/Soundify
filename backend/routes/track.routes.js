import express from "express";
import {
  createTrack,
  getAllTracks,
  searchTracks,
  incrementListenCount,
} from "../controllers/track.controller.js";
import { authenticate, optionalAuth } from "../middleware/auth.middleware.js";
import { validateTrackCreation } from "../middleware/validation.middleware.js";
import { uploadTrackFiles } from "../middleware/upload.middleware.js";

const router = express.Router();

// Публичные маршруты
router.get("/", optionalAuth, getAllTracks);
router.get("/search", searchTracks);
router.patch("/:id/listen", incrementListenCount);

// Защищенные маршруты
router.post(
  "/",
  authenticate,
  uploadTrackFiles,
  validateTrackCreation,
  createTrack
);

export default router;
