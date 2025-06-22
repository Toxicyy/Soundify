import express from "express";
import authRoutes from "./auth.routes.js";
import trackRoutes from "./track.routes.js";
import playlistRoutes from "./playlist.routes.js";
import artistRoutes from "./artist.routes.js";

const router = express.Router();

// Основные маршруты API
router.use("/auth", authRoutes);
router.use("/tracks", trackRoutes);
router.use("/playlists", playlistRoutes);
router.use("/artists", artistRoutes);

// Базовый маршрут для проверки API
router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Soundify API working",
    version: "1.0.0",
  });
});

export default router;
