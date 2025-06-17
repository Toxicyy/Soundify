import express from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import {
  getAllArtists,
  getArtistById,
  getArtistBySlug,
  getArtistTracks,
  getArtistAlbums,
  createArtist,
  updateArtist,
  deleteArtist,
  searchArtists,
  getPopularArtists, // Добавьте этот импорт
} from "../controllers/artist.controller.js";
import { uploadAvatar } from "../middleware/upload.middleware.js";
import {
  validateArtistCreation,
  validateArtistUpdate,
} from "../middleware/validation.middleware.js";

const router = express.Router();

// Публичные маршруты
router.get("/", getAllArtists);
router.get("/search", searchArtists);
router.get("/popular", getPopularArtists);
router.get("/:id", getArtistById);
router.get("/slug/:slug", getArtistBySlug);
router.get("/:id/tracks", getArtistTracks);
router.get("/:id/albums", getArtistAlbums);

// Защищенные маршруты
router.post(
  "/",
  authenticate,
  uploadAvatar,
  validateArtistCreation,
  createArtist
);

router.put(
  "/:id",
  authenticate,
  uploadAvatar,
  validateArtistUpdate,
  updateArtist
);

router.delete("/:id", authenticate, deleteArtist);

export default router;
