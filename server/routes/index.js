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
import recomendationRoutes from "./recommendation.routes.js";
/**
 * Main API routes configuration
 * Combines all feature-specific route modules
 */

const router = express.Router();

// Feature-specific route modules
router.use("/auth", authRoutes);                      // Authentication & user management
router.use("/tracks", trackRoutes);                   // Track management & streaming
router.use("/playlists", playlistRoutes);             // Playlist operations
router.use("/artists", artistRoutes);                 // Artist management & discovery
router.use("/users", userRoutes);                     // User management
router.use("/albums" , albumRoutes);                  // Album management
router.use("/search", globalSearchRoutes);            // Global search
router.use('/charts', chartRoutes);                   // Chart endpoints
router.use("/albums/batch", batchRoutes);             // Batch album creation
router.use("/analytics", analyticsRoutes);            // Analytics
router.use("/recommendations", recomendationRoutes);  // Recommendations

// API health check endpoint
router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Soundify API working",
    version: "1.0.0",
  });
});

export default router;