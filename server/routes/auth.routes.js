import express from "express";
import { register, login, changePassword } from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { validatePasswordChange } from "../middleware/validation.middleware.js";

/**
 * Authentication routes configuration
 * Handles user registration, login, and profile management
 */

const router = express.Router();

// Public routes - no authentication required
router.post("/register", register);                // User registration with email/password
router.post("/login", login);                      // User login with credentials
router.put(
  "/change-password", 
  authenticate, 
  validatePasswordChange,
  changePassword
);

export default router;