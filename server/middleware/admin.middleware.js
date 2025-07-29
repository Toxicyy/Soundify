import { ApiResponse } from "../utils/responses.js";

/**
 * Middleware to check if user has admin privileges
 * Must be used after authenticate middleware
 */
export const adminOnly = (req, res, next) => {
  // Check if user is authenticated
  if (!req.user) {
    return res.status(401).json(ApiResponse.error("Authentication required"));
  }

  // Check if user has admin status
  if (req.user.status !== "ADMIN") {
    return res.status(403).json(
      ApiResponse.error("Admin access required", {
        userStatus: req.user.status,
        requiredStatus: "ADMIN",
      })
    );
  }

  next();
};

/**
 * Middleware to check if user has admin or premium privileges
 * Useful for features that require elevated permissions
 */
export const elevatedAccess = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json(ApiResponse.error("Authentication required"));
  }

  const allowedStatuses = ["ADMIN", "PREMIUM"];

  if (!allowedStatuses.includes(req.user.status)) {
    return res.status(403).json(
      ApiResponse.error("Elevated access required", {
        userStatus: req.user.status,
        allowedStatuses,
      })
    );
  }

  next();
};
