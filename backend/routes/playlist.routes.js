import express from "express";
import {
  createPlaylist,
  getUserPlaylists,
} from "../controllers/playlist.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();

// Все маршруты плейлистов требуют авторизации
router.post("/", authenticate, createPlaylist);
router.get("/user/:userId", authenticate, getUserPlaylists);

export default router;
