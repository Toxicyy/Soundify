import express from "express";
import { register, login, getUser } from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

/**
 * Authentication routes configuration
 * Handles user registration, login, and profile management
 */

const router = express.Router();

// Public routes - no authentication required
router.post("/register", register);                // User registration with email/password
router.post("/login", login);                      // User login with credentials

// Protected routes - require authentication
router.get("/me", authenticate, getUser);          // Get current user profile data

export default router;