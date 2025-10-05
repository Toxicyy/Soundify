import multer from "multer";
import { UPLOAD_LIMITS } from "../config/constants.js";

/**
 * File Upload Middleware
 * Configures multer for handling audio and image uploads
 * Validates file types and sizes according to system limits
 */

const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: UPLOAD_LIMITS.fileSize,
  },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === "audio") {
      if (UPLOAD_LIMITS.audioFormats.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error("Unsupported audio file format"), false);
      }
    } else if (file.fieldname === "cover" || file.fieldname === "avatar") {
      if (UPLOAD_LIMITS.imageFormats.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error("Unsupported image format"), false);
      }
    } else {
      cb(new Error("Unknown file field"), false);
    }
  },
});

// Export specific middleware functions
export const uploadAvatar = upload.single("avatar");
export const uploadCover = upload.single("cover");
export const uploadTrackFiles = upload.fields([
  { name: "audio", maxCount: 1 },
  { name: "cover", maxCount: 1 },
]);