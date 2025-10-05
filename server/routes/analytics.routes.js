import express from "express";
import { adminOnly } from "../middleware/admin.middleware.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { getDashboardStats, getStreamsStats, getUsersStats } from "../controllers/analytics.controller.js";

/**
 * Routes for analytics and statistics (Admin only)
 * Provides endpoints for platform metrics, user statistics, and streaming data
 */
const router = express.Router();

// All analytics routes require authentication and admin privileges
router.use(authenticate, adminOnly);

// Get dashboard statistics
// GET /api/analytics/dashboard
router.get("/dashboard", getDashboardStats);

// Get user statistics
// GET /api/analytics/users?startDate=2024-01-01&endDate=2024-12-31
router.get("/users", getUsersStats);

// Get streaming statistics
// GET /api/analytics/streams?period=month
router.get("/streams", getStreamsStats);

export default router;