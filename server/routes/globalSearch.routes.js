import express from "express";
import {
  clearSearchHistory,
  getPopularContent,
  getSearchHistory,
  getSearchSuggestions,
  globalSearch,
  searchByCategory,
  searchWithPriority,
} from "../controllers/globalSearch.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

/**
 * Routes for global search functionality
 * Provides endpoints for searching across all content types (tracks, artists, albums, playlists)
 */
const router = express.Router();

// Main global search
// GET /api/search?q=query&limit=10&categories=tracks,artists,albums,playlists&includePrivate=false
router.get("/", globalSearch);

// Search with priority by content type
// GET /api/search/priority?q=query&type=tracks&limit=10&secondaryLimit=5
router.get("/priority", searchWithPriority);

// Get popular content (for empty search)
// GET /api/search/popular?limit=10
router.get("/popular", getPopularContent);

// Autocomplete for search
// GET /api/search/suggestions?q=query&limit=5
router.get("/suggestions", getSearchSuggestions);

// Search only by specific category
// GET /api/search/category/:category?q=query&limit=20&page=1
router.get("/category/:category", searchByCategory);

// Get user's search history (requires authentication)
// GET /api/search/history?limit=10
router.get("/history", authenticate, getSearchHistory);

// Clear user's search history (requires authentication)
// DELETE /api/search/history
router.delete("/history", authenticate, clearSearchHistory);

export default router;
