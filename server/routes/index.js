import express from "express";
import authRoutes from "./auth.routes.js";
import trackRoutes from "./track.routes.js";
import playlistRoutes from "./playlist.routes.js";
import artistRoutes from "./artist.routes.js";
import userRoutes from "./user.routes.js";
import albumRoutes from "./album.routes.js";
import globalSearchRoutes from "./globalSearch.routes.js";
import chartRoutes from "./chart.routes.js";
import batchRoutes from "./batchAlbum.routes.js";
import analyticsRoutes from "./analytics.routes.js";
/**
 * Main API routes configuration
 * Combines all feature-specific route modules
 */

const router = express.Router();

// Feature-specific route modules
router.use("/auth", authRoutes);                   // Authentication & user management
router.use("/tracks", trackRoutes);                // Track management & streaming
router.use("/playlists", playlistRoutes);          // Playlist operations
router.use("/artists", artistRoutes);              // Artist management & discovery
router.use("/users", userRoutes);
router.use("/albums" , albumRoutes);
router.use("/search", globalSearchRoutes);
router.use('/charts', chartRoutes);
router.use("/albums/batch", batchRoutes);
router.use("/analytics", analyticsRoutes);

// API health check endpoint
router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Soundify API working",
    version: "1.0.0",
  });
});

export default router;