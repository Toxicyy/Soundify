import express from "express";
import {
  getGlobalChart,
  getCountryChart,
  getTrendingTracks,
  getAvailableCountries,
  getTrackChartHistory,
  getChartStats,
  getChartPerformance,
  getTopMovers,
  triggerChartUpdate,
  triggerCronJob,
  getChartCacheInfo,
  clearChartCache,
  createTestData,
} from "../controllers/chart.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

/**
 * Chart routes configuration
 * Handles chart data retrieval, analytics, and administrative operations
 * Most routes require user authentication
 */

const router = express.Router();

// Rate limiting middleware
const createRateLimit = (maxRequests, windowMs) => {
  const requests = new Map();

  return (req, res, next) => {
    const clientId = req.ip || "unknown";
    const now = Date.now();

    // Clean expired entries
    for (const [id, timestamps] of requests) {
      const valid = timestamps.filter((time) => now - time < windowMs);
      valid.length ? requests.set(id, valid) : requests.delete(id);
    }

    const clientRequests = requests.get(clientId) || [];
    if (clientRequests.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: "Rate limit exceeded",
        retryAfter: Math.ceil(windowMs / 1000),
      });
    }

    clientRequests.push(now);
    requests.set(clientId, clientRequests);
    next();
  };
};

// Cache headers middleware
const setCache = (maxAge) => (req, res, next) => {
  res.set({
    "Cache-Control": `public, max-age=${maxAge}`,
    ETag: `"charts-${Date.now()}"`,
  });
  next();
};

// Apply rate limiting and caching
const publicLimit = createRateLimit(60, 60000); // 60 req/min
const userLimit = createRateLimit(100, 60000); // 100 req/min for authenticated users
const cache15min = setCache(900); // 15 minutes

// Public routes - only API documentation (no auth required)
router.get("/", cache15min, publicLimit, (req, res) => {
  res.json({
    message: "Charts API v1.0",
    note: "Most endpoints require authentication",
    public: ["GET /"],
    authenticated: {
      charts: ["GET /global", "GET /country/:code", "GET /trending"],
      analytics: ["GET /stats", "GET /performance", "GET /movers"],
      tracks: ["GET /track/:id/history"],
      meta: ["GET /countries"],
    },
    admin: ["POST /admin/*", "DELETE /admin/*"],
  });
});

// Chart routes - require user authentication
router.get("/global", authenticate, cache15min, userLimit, getGlobalChart);
router.get(
  "/country/:countryCode",
  authenticate,
  cache15min,
  userLimit,
  getCountryChart
);
router.get("/trending", authenticate, cache15min, userLimit, getTrendingTracks);
router.get(
  "/countries",
  authenticate,
  cache15min,
  userLimit,
  getAvailableCountries
);

// Analytics routes - require user authentication
router.get("/stats", authenticate, cache15min, userLimit, getChartStats);
router.get(
  "/performance",
  authenticate,
  cache15min,
  userLimit,
  getChartPerformance
);
router.get("/movers", authenticate, cache15min, userLimit, getTopMovers);

// Track-specific routes - require user authentication
router.get(
  "/track/:trackId/history",
  authenticate,
  cache15min,
  userLimit,
  getTrackChartHistory
);

// Admin routes - require user authentication (admin check in controller)
router.post("/admin/update", authenticate, userLimit, triggerChartUpdate);
router.post("/admin/cron/:jobName", authenticate, userLimit, triggerCronJob);
router.get("/admin/cache", authenticate, userLimit, getChartCacheInfo);
router.delete("/admin/cache", authenticate, userLimit, clearChartCache);
router.post("/admin/test-data", authenticate, userLimit, createTestData);

export default router;
