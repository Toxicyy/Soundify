import jwt from "jsonwebtoken";
import { config } from "../config/config.js";
import User from "../models/User.model.js";
import { ApiResponse } from "../utils/responses.js";

/**
 * Authentication Middleware
 * Verifies JWT tokens and attaches user to request object
 * Provides both required and optional authentication modes
 */

/**
 * Required authentication middleware
 * Validates JWT token and loads user data
 * Rejects requests without valid authentication
 */
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json(ApiResponse.error("Token not provided"));
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, config.jwtSecret);

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json(ApiResponse.error("User not found"));
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json(ApiResponse.error("Invalid token"));
    }
    return res.status(500).json(ApiResponse.error("Authentication error"));
  }
};

/**
 * Optional authentication middleware
 * Attempts to validate JWT token if present
 * Continues execution even if authentication fails
 * Useful for endpoints that work for both authenticated and anonymous users
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, config.jwtSecret);
      const user = await User.findById(decoded.id);
      req.user = user;
    }

    next();
  } catch (error) {
    // Ignore errors for optional auth
    next();
  }
};