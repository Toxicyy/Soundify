import express from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import {
  addLikedSong,
  getLikedSongs,
  removeLikedSong,
  getUserById,
  getUserLikedArtists,
} from "../controllers/user.controller.js";
import {
  getLikedPlaylists,
  getUserPlaylists,
} from "../controllers/playlist.controller.js";

const router = express.Router();

// User profile routes
router.get("/:userId", authenticate, getUserById);

// User liked songs routes
router.patch("/:userId/like/:songId", authenticate, addLikedSong);
router.patch("/:userId/unlike/:songId", authenticate, removeLikedSong);
router.get("/:userId/liked-songs", authenticate, getLikedSongs);

// User playlists routes
router.get("/:userId/playlists", authenticate, getUserPlaylists);
router.get("/:userId/playlists/liked", authenticate, getLikedPlaylists);

// User liked artists routes
router.get("/:userId/liked-artists", authenticate, getUserLikedArtists);

export default router;
