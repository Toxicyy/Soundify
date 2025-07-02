import express from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import {
  addLikedSong,
  getLikedSongs,
  removeLikedSong,
} from "../controllers/user.controller.js";

const router = express.Router();

// User liked songs routes
router.patch("/:userId/like/:songId", authenticate, addLikedSong);
router.patch("/:userId/unlike/:songId", authenticate, removeLikedSong);
router.get("/:userId/liked-songs", authenticate, getLikedSongs);

export default router;
