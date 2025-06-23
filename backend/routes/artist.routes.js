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
  getPopularArtists,
} from "../controllers/artist.controller.js";
import { uploadAvatar } from "../middleware/upload.middleware.js";
import {
  validateArtistCreation,
  validateArtistUpdate,
} from "../middleware/validation.middleware.js";

/**
 * Artist routes configuration
 * Handles artist management, search, and content retrieval
 */

const router = express.Router();

// Public routes - no authentication required
router.get("/", getAllArtists);                    // Get all artists with pagination and filters
router.get("/search", searchArtists);              // Search artists by name/slug
router.get("/popular", getPopularArtists);         // Get popular artists sorted by followers
router.get("/:id", getArtistById);                 // Get artist by ID
router.get("/slug/:slug", getArtistBySlug);        // Get artist by slug (SEO-friendly URLs)
router.get("/:id/tracks", getArtistTracks);        // Get tracks by specific artist
router.get("/:id/albums", getArtistAlbums);        // Get albums by specific artist

// Protected routes - require authentication
router.post(
  "/",
  authenticate,                 // Verify user authentication
  uploadAvatar,                // Handle avatar file upload
  validateArtistCreation,      // Validate artist creation data
  createArtist                 // Create new artist
);

router.put(
  "/:id",
  authenticate,                // Verify user authentication
  uploadAvatar,               // Handle avatar file upload (optional)
  validateArtistUpdate,       // Validate artist update data
  updateArtist                // Update existing artist
);

router.delete("/:id", authenticate, deleteArtist); // Delete artist (with ownership check)

export default router;