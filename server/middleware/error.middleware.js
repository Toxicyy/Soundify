/**
 * Global Error Handler Middleware
 * Centralized error handling for the application
 * Handles MongoDB errors, JWT errors, Multer file upload errors, and custom application errors
 */

import multer from "multer";
import { ApiResponse } from "../utils/responses.js";

/**
 * Express error handling middleware
 * @param {Error} err - Error object
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  // MongoDB duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json(ApiResponse.error(`${field} already exists`));
  }

  // MongoDB validation errors
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json(ApiResponse.error("Validation error", errors));
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json(ApiResponse.error("Invalid token"));
  }

  // Multer file upload errors
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json(ApiResponse.error("File is too large"));
    }
    return res.status(400).json(ApiResponse.error("File upload error"));
  }

  // Custom application errors
  if (err.message) {
    return res.status(400).json(ApiResponse.error(err.message));
  }

  // Generic server error
  res.status(500).json(ApiResponse.error("Internal server error"));
};