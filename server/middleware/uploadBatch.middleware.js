import multer from "multer";
import { UPLOAD_LIMITS } from "../config/constants.js";

/**
 * Batch Upload Middleware
 * Handles multiple file uploads for batch album creation
 * Supports up to 50 tracks with audio and cover files plus album cover
 */

const storage = multer.memoryStorage();

const batchUpload = multer({
  storage: storage,
  limits: {
    fileSize: UPLOAD_LIMITS.fileSize,
    files: 101, // 1 album cover + 50 tracks * 2 files
    fieldSize: 10 * 1024 * 1024,
    fieldNameSize: 200,
    fields: 500,
  },
  fileFilter: (req, file, cb) => {
    const fieldName = file.fieldname;

    // Album cover validation
    if (fieldName === "albumCover") {
      if (UPLOAD_LIMITS.imageFormats.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error("Unsupported album cover format"), false);
      }
      return;
    }

    // Track audio files validation
    if (fieldName.match(/^tracks\[\d+\]\[audio\]$/)) {
      if (UPLOAD_LIMITS.audioFormats.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error(`Unsupported audio file format: ${fieldName}`), false);
      }
      return;
    }

    // Track cover files validation
    if (fieldName.match(/^tracks\[\d+\]\[cover\]$/)) {
      if (UPLOAD_LIMITS.imageFormats.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error(`Unsupported track cover format: ${fieldName}`), false);
      }
      return;
    }

    cb(new Error(`Unknown file field: ${fieldName}`), false);
  },
});

/**
 * Middleware for handling batch album uploads
 * Creates dynamic fields for up to 50 tracks
 */
export const uploadBatchAlbum = (req, res, next) => {
  const fields = [{ name: "albumCover", maxCount: 1 }];

  // Add fields for tracks (up to 50)
  for (let i = 0; i < 50; i++) {
    fields.push(
      { name: `tracks[${i}][audio]`, maxCount: 1 },
      { name: `tracks[${i}][cover]`, maxCount: 1 }
    );
  }

  const uploadMiddleware = batchUpload.fields(fields);

  uploadMiddleware(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        switch (err.code) {
          case "LIMIT_FILE_SIZE":
            return res.status(400).json({
              success: false,
              error: "File size exceeds limit",
              details: `Maximum file size: ${
                UPLOAD_LIMITS.fileSize / (1024 * 1024)
              }MB`,
            });
          case "LIMIT_FILE_COUNT":
            return res.status(400).json({
              success: false,
              error: "File count exceeded",
              details:
                "Maximum 101 files (1 album cover + 50 tracks * 2 files)",
            });
          case "LIMIT_FIELD_COUNT":
            return res.status(400).json({
              success: false,
              error: "Field count exceeded",
            });
          case "LIMIT_UNEXPECTED_FILE":
            return res.status(400).json({
              success: false,
              error: "Unexpected file",
              details: err.field,
            });
          default:
            return res.status(400).json({
              success: false,
              error: "File upload error",
              details: err.message,
            });
        }
      }

      return res.status(400).json({
        success: false,
        error: err.message,
      });
    }

    // Check total request size (500MB limit)
    const totalSize = calculateTotalRequestSize(req);
    const maxTotalSize = 500 * 1024 * 1024;

    if (totalSize > maxTotalSize) {
      return res.status(400).json({
        success: false,
        error: "Total request size exceeds limit",
        details: `Maximum size: 500MB, received: ${Math.round(
          totalSize / (1024 * 1024)
        )}MB`,
      });
    }

    next();
  });
};

/**
 * Calculate total request size including files and body
 * @param {Object} req - Express request object
 * @returns {number} Total size in bytes
 */
const calculateTotalRequestSize = (req) => {
  let totalSize = 0;

  if (req.files) {
    Object.values(req.files).forEach((fileArray) => {
      if (Array.isArray(fileArray)) {
        fileArray.forEach((file) => {
          totalSize += file.size;
        });
      } else {
        totalSize += fileArray.size;
      }
    });
  }

  if (req.body) {
    const bodySize = JSON.stringify(req.body).length;
    totalSize += bodySize;
  }

  return totalSize;
};

/**
 * Validate uploaded file structure and create track indices
 * Ensures all required files are present for each track
 */
export const validateBatchUploadStructure = (req, res, next) => {
  if (!req.files) {
    return res.status(400).json({
      success: false,
      error: "No files found",
    });
  }

  const files = req.files;
  const errors = [];

  // Validate album cover
  if (!files.albumCover || !files.albumCover[0]) {
    errors.push("Album cover is required");
  }

  // Count tracks and validate structure
  const trackIndices = new Set();
  Object.keys(files).forEach((fieldName) => {
    const match = fieldName.match(/^tracks\[(\d+)\]\[(audio|cover)\]$/);
    if (match) {
      trackIndices.add(parseInt(match[1]));
    }
  });

  const trackCount = trackIndices.size;

  if (trackCount === 0) {
    errors.push("At least one track must be uploaded");
  }

  if (trackCount > 50) {
    errors.push("Maximum number of tracks: 50");
  }

  // Validate each track has both audio and cover
  trackIndices.forEach((index) => {
    const audioField = `tracks[${index}][audio]`;
    const coverField = `tracks[${index}][cover]`;

    if (!files[audioField] || !files[audioField][0]) {
      errors.push(`Audio file for track ${index + 1} is missing`);
    }

    if (!files[coverField] || !files[coverField][0]) {
      errors.push(`Cover for track ${index + 1} is missing`);
    }
  });

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: "File structure errors",
      details: errors,
    });
  }

  // Add batch info for subsequent middleware
  req.batchInfo = {
    trackCount,
    trackIndices: Array.from(trackIndices).sort((a, b) => a - b),
  };

  next();
};