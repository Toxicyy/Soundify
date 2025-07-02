import express from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { uploadCover } from "../middleware/upload.middleware.js";
import {
  validateAlbumCreation,
  validateAlbumUpdate,
} from "../middleware/validation.middleware.js";
import {
  createAlbum,
  getAllAlbums,
  getAlbumById,
  updateAlbum,
  deleteAlbum,
  getAlbumTracks,
  searchAlbums,
  getAlbumsByGenre,
  getAlbumsByType,
  addTrackToAlbum,
  removeTrackFromAlbum,
  updateTrackOrder,
} from "../controllers/album.controller.js";

const router = express.Router();

// Public routes (no authentication required)
router.get("/", getAllAlbums); // GET /api/albums
router.get("/search", searchAlbums); // GET /api/albums/search
router.get("/genre/:genre", getAlbumsByGenre); // GET /api/albums/genre/rock
router.get("/type/:type", getAlbumsByType); // GET /api/albums/type/album
router.get("/:id", getAlbumById); // GET /api/albums/:id
router.get("/:id/tracks", getAlbumTracks); // GET /api/albums/:id/tracks

// Protected routes with file upload and validation
router.post(
  "/",
  authenticate, // Verify user authentication
  uploadCover, // Handle cover file upload (multer)
  validateAlbumCreation, // Validate album creation data
  createAlbum // Create new album
);

router.put(
  "/:id",
  authenticate, // Verify user authentication
  uploadCover, // Handle cover file upload (optional)
  validateAlbumUpdate, // Validate album update data
  updateAlbum // Update existing album
);

router.delete("/:id", authenticate, deleteAlbum); // DELETE /api/albums/:id

// Track management (authentication required)
router.post("/:albumId/tracks/:trackId", authenticate, addTrackToAlbum); // POST /api/albums/:albumId/tracks/:trackId
router.delete("/:albumId/tracks/:trackId", authenticate, removeTrackFromAlbum); // DELETE /api/albums/:albumId/tracks/:trackId
router.put("/:albumId/tracks/order", authenticate, updateTrackOrder); // PUT /api/albums/:albumId/tracks/order

export default router;
