import { body, validationResult } from "express-validator";
import { ApiResponse } from "../utils/responses.js";
import Artist from "../models/Artist.model.js";
import Album from "../models/Album.model.js";
import User from "../models/User.model.js";

/**
 * Validation Middleware
 * Provides comprehensive validation for all entities (tracks, artists, albums, playlists, users)
 * Includes custom validators for business logic and data integrity
 */

/**
 * Parse JSON objects from FormData
 * Handles conversion of stringified JSON in multipart/form-data requests
 */
const parseFormDataJSON = (req, res, next) => {
  // Parse genres if it's a string
  if (req.body.genres && typeof req.body.genres === "string") {
    try {
      req.body.genres = JSON.parse(req.body.genres);
    } catch (e) {
      return res
        .status(400)
        .json(ApiResponse.error("Invalid format for genres data"));
    }
  }

  // Parse socialLinks if it's a string
  if (req.body.socialLinks && typeof req.body.socialLinks === "string") {
    try {
      req.body.socialLinks = JSON.parse(req.body.socialLinks);
    } catch (e) {
      return res
        .status(400)
        .json(ApiResponse.error("Invalid format for social links data"));
    }
  }

  // Parse tags if it's a string
  if (req.body.tags && typeof req.body.tags === "string") {
    try {
      req.body.tags = JSON.parse(req.body.tags);
    } catch (e) {
      return res
        .status(400)
        .json(ApiResponse.error("Invalid format for tags data"));
    }
  }

  // Parse tracks if it's a string
  if (req.body.tracks && typeof req.body.tracks === "string") {
    try {
      req.body.tracks = JSON.parse(req.body.tracks);
    } catch (e) {
      return res
        .status(400)
        .json(ApiResponse.error("Invalid format for tracks data"));
    }
  }

  // Parse publish boolean
  if (req.body.publish && typeof req.body.publish === "string") {
    req.body.publish = req.body.publish === "true";
  }

  next();
};

export const validateTrackCreation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Track name is required")
    .isLength({ max: 100 })
    .withMessage("Name cannot be longer than 100 characters"),

  body("artist").trim().notEmpty().withMessage("Artist name is required"),

  (req, res, next) => {
    if (!req.files || !req.files.audio || !req.files.audio[0]) {
      return res.status(400).json(ApiResponse.error("Audio file is required"));
    }

    if (!req.files.cover || !req.files.cover[0]) {
      return res.status(400).json(ApiResponse.error("Cover is required"));
    }

    // Check audio file type
    const audioFile = req.files.audio[0];
    const allowedAudioTypes = [
      "audio/mpeg",
      "audio/mp3",
      "audio/wav",
      "audio/ogg",
    ];
    if (!allowedAudioTypes.includes(audioFile.mimetype)) {
      return res
        .status(400)
        .json(ApiResponse.error("Unsupported audio file format"));
    }

    // Check image type
    const coverFile = req.files.cover[0];
    const allowedImageTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];
    if (!allowedImageTypes.includes(coverFile.mimetype)) {
      return res
        .status(400)
        .json(ApiResponse.error("Unsupported image format"));
    }

    next();
  },

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .json(ApiResponse.error("Validation errors", errors.array()));
    }
    next();
  },
];

/**
 * Validation rules for artist creation
 * All fields are required except social links
 */
export const validateArtistCreation = [
  parseFormDataJSON,

  // Name validation
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Artist name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters")
    .custom(async (value) => {
      // Check for duplicate name
      const existingArtist = await Artist.findOne({
        name: new RegExp(`^${value}$`, "i"),
      });
      if (existingArtist) {
        throw new Error("Artist with this name already exists");
      }
      return true;
    }),

  // Bio validation
  body("bio")
    .trim()
    .notEmpty()
    .withMessage("Biography is required")
    .isLength({ max: 1000 })
    .withMessage("Biography cannot exceed 1000 characters"),

  // Genres validation - works with array
  body("genres")
    .isArray({ min: 1 })
    .withMessage("At least one genre must be selected")
    .custom((value) => {
      if (value && value.length > 10) {
        throw new Error("Maximum of 10 genres allowed");
      }
      return true;
    }),

  body("genres.*")
    .trim()
    .isLength({ min: 2, max: 30 })
    .withMessage("Each genre must be between 2 and 30 characters"),

  // Social links validation - works with object
  body("socialLinks")
    .optional()
    .isObject()
    .withMessage("Social links must be an object"),

  body("socialLinks.spotify")
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^https?:\/\/(open\.)?spotify\.com\/(artist|user)\/[a-zA-Z0-9]+/)
    .withMessage("Invalid Spotify link format"),

  body("socialLinks.instagram")
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^https?:\/\/(www\.)?instagram\.com\/[a-zA-Z0-9_.]+/)
    .withMessage("Invalid Instagram link format"),

  body("socialLinks.twitter")
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^https?:\/\/(www\.)?(twitter|x)\.com\/[a-zA-Z0-9_]+/)
    .withMessage("Invalid Twitter/X link format"),

  // Avatar file validation middleware
  (req, res, next) => {
    // Avatar is required on creation
    if (!req.file) {
      return res.status(400).json(ApiResponse.error("Avatar is required"));
    }

    const allowedImageTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];

    if (!allowedImageTypes.includes(req.file.mimetype)) {
      return res
        .status(400)
        .json(ApiResponse.error("Unsupported image format"));
    }

    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (req.file.size > maxSize) {
      return res
        .status(400)
        .json(ApiResponse.error("Image size must not exceed 5MB"));
    }
    next();
  },

  // Final validation check
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .json(ApiResponse.error("Validation errors", errors.array()));
    }
    next();
  },
];

/**
 * Validation rules for artist updates
 * Same rules as creation, but all fields are optional
 */
export const validateArtistUpdate = [
  parseFormDataJSON,

  // Name validation (optional)
  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Name cannot be empty")
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters")
    .custom(async (value, { req }) => {
      // Check uniqueness, excluding current artist
      const existingArtist = await Artist.findOne({
        name: new RegExp(`^${value}$`, "i"),
        _id: { $ne: req.params.id },
      });
      if (existingArtist) {
        throw new Error("Artist with this name already exists");
      }
      return true;
    }),

  body("bio")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Biography cannot exceed 1000 characters"),

  body("genres")
    .optional()
    .isArray()
    .withMessage("Genres must be an array")
    .custom((value) => {
      if (value && value.length > 10) {
        throw new Error("Maximum of 10 genres allowed");
      }
      return true;
    }),

  body("genres.*")
    .optional()
    .trim()
    .isLength({ min: 2, max: 30 })
    .withMessage("Each genre must be between 2 and 30 characters"),

  body("socialLinks")
    .optional()
    .isObject()
    .withMessage("Social links must be an object"),

  body("socialLinks.spotify")
    .optional({ checkFalsy: true })
    .trim()
    .custom((value) => {
      if (!value || value === "") return true;
      const spotifyRegex =
        /^https?:\/\/(open\.)?spotify\.com\/(artist|user)\/[a-zA-Z0-9]+/;
      if (!spotifyRegex.test(value)) {
        throw new Error("Invalid Spotify link format");
      }
      return true;
    }),

  body("socialLinks.instagram")
    .optional({ checkFalsy: true })
    .trim()
    .custom((value) => {
      if (!value || value === "") return true;
      const instagramRegex =
        /^https?:\/\/(www\.)?instagram\.com\/[a-zA-Z0-9_.]+/;
      if (!instagramRegex.test(value)) {
        throw new Error("Invalid Instagram link format");
      }
      return true;
    }),

  body("socialLinks.twitter")
    .optional({ checkFalsy: true })
    .trim()
    .custom((value) => {
      if (!value || value === "") return true;
      const twitterRegex =
        /^https?:\/\/(www\.)?(twitter|x)\.com\/[a-zA-Z0-9_]+/;
      if (!twitterRegex.test(value)) {
        throw new Error("Invalid Twitter/X link format");
      }
      return true;
    }),

  // Avatar file validation middleware for updates
  (req, res, next) => {
    if (req.file) {
      const allowedImageTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
      ];

      if (!allowedImageTypes.includes(req.file.mimetype)) {
        return res
          .status(400)
          .json(ApiResponse.error("Unsupported image format"));
      }

      const maxSize = 5 * 1024 * 1024; // 5MB
      if (req.file.size > maxSize) {
        return res
          .status(400)
          .json(ApiResponse.error("Image size must not exceed 5MB"));
      }
    }
    next();
  },

  // Final validation check
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .json(ApiResponse.error("Validation errors", errors.array()));
    }
    next();
  },
];

export const validateAlbumCreation = [
  parseFormDataJSON,

  // Album name validation
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Album name is required")
    .isLength({ min: 1, max: 100 })
    .withMessage("Album name must be between 1 and 100 characters")
    .custom(async (value, { req }) => {
      // Check name uniqueness for the same artist
      if (req.body.artist) {
        const existingAlbum = await Album.findOne({
          name: new RegExp(`^${value}$`, "i"),
          artist: req.body.artist,
        });
        if (existingAlbum) {
          throw new Error(
            "Album with this name already exists for this artist"
          );
        }
      }
      return true;
    }),

  // Artist validation
  body("artist")
    .trim()
    .notEmpty()
    .withMessage("Artist is required")
    .isMongoId()
    .withMessage("Invalid artist ID")
    .custom(async (value) => {
      // Check if artist exists
      const artist = await Artist.findById(value);
      if (!artist) {
        throw new Error("Artist not found");
      }
      return true;
    }),

  // Description validation (optional)
  body("description")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Description cannot be longer than 1000 characters"),

  // Genre validation
  body("genre")
    .trim()
    .notEmpty()
    .withMessage("Genre is required")
    .isLength({ min: 2, max: 50 })
    .withMessage("Genre must be between 2 and 50 characters"),

  // Album type validation
  body("type")
    .optional()
    .isIn(["album", "ep", "single"])
    .withMessage("Type must be album, ep, or single"),

  // Release date validation (optional)
  body("releaseDate")
    .optional()
    .isISO8601()
    .withMessage("Invalid release date format"),

  // Tracks validation (optional, for future use)
  body("tracks").optional().isArray().withMessage("Tracks must be an array"),

  body("tracks.*")
    .optional()
    .isMongoId()
    .withMessage("Each track must be a valid MongoDB ID"),

  // Cover file validation middleware
  (req, res, next) => {
    // Cover is required for album creation
    if (!req.file) {
      return res.status(400).json(ApiResponse.error("Album cover is required"));
    }

    const allowedImageTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];

    if (!allowedImageTypes.includes(req.file.mimetype)) {
      return res
        .status(400)
        .json(ApiResponse.error("Unsupported image format"));
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (req.file.size > maxSize) {
      return res
        .status(400)
        .json(ApiResponse.error("Image size must not exceed 10MB"));
    }

    next();
  },

  // Final error checking
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .json(ApiResponse.error("Validation errors", errors.array()));
    }
    next();
  },
];

// Album update validation
export const validateAlbumUpdate = [
  parseFormDataJSON,

  // All fields are optional for updates
  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Album name cannot be empty")
    .isLength({ min: 1, max: 100 })
    .withMessage("Album name must be between 1 and 100 characters")
    .custom(async (value, { req }) => {
      // Check uniqueness excluding current album
      if (req.body.artist) {
        const existingAlbum = await Album.findOne({
          name: new RegExp(`^${value}$`, "i"),
          artist: req.body.artist,
          _id: { $ne: req.params.id },
        });
        if (existingAlbum) {
          throw new Error(
            "Album with this name already exists for this artist"
          );
        }
      }
      return true;
    }),

  body("artist")
    .optional()
    .trim()
    .isMongoId()
    .withMessage("Invalid artist ID")
    .custom(async (value) => {
      const artist = await Artist.findById(value);
      if (!artist) {
        throw new Error("Artist not found");
      }
      return true;
    }),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Description cannot be longer than 1000 characters"),

  body("genre")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Genre must be between 2 and 50 characters"),

  body("type")
    .optional()
    .isIn(["album", "ep", "single"])
    .withMessage("Type must be album, ep, or single"),

  body("releaseDate")
    .optional()
    .isISO8601()
    .withMessage("Invalid release date format"),

  body("tracks").optional().isArray().withMessage("Tracks must be an array"),

  body("tracks.*")
    .optional()
    .isMongoId()
    .withMessage("Each track must be a valid MongoDB ID"),

  // Cover file validation middleware for updates
  (req, res, next) => {
    if (req.file) {
      const allowedImageTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
      ];

      if (!allowedImageTypes.includes(req.file.mimetype)) {
        return res
          .status(400)
          .json(ApiResponse.error("Unsupported image format"));
      }

      const maxSize = 10 * 1024 * 1024; // 10MB
      if (req.file.size > maxSize) {
        return res
          .status(400)
          .json(ApiResponse.error("Image size must not exceed 10MB"));
      }
    }
    next();
  },

  // Final error checking
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .json(ApiResponse.error("Validation errors", errors.array()));
    }
    next();
  },
];

/**
 * Playlist creation validation middleware
 * Validates playlist name, description, tags, category, and cover file
 */
export const validatePlaylistCreation = [
  parseFormDataJSON,

  // Playlist name validation
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Playlist name is required")
    .isLength({ min: 1, max: 100 })
    .withMessage("Playlist name must be between 1 and 100 characters"),

  // Description validation (optional)
  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description cannot be longer than 500 characters"),

  // Tags validation (optional)
  body("tags")
    .optional()
    .isArray()
    .withMessage("Tags must be an array")
    .custom((value) => {
      if (value && value.length > 20) {
        throw new Error("Maximum 20 tags allowed");
      }
      return true;
    }),

  body("tags.*")
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage("Each tag must be between 1 and 50 characters"),

  // Category validation
  body("category")
    .optional()
    .isIn(["user", "featured", "genre", "mood", "activity"])
    .withMessage("Invalid category"),

  // Privacy validation
  body("privacy")
    .optional()
    .isIn(["public", "private", "unlisted"])
    .withMessage("Privacy must be public, private, or unlisted"),

  // Tracks validation (optional)
  body("tracks").optional().isArray().withMessage("Tracks must be an array"),

  body("tracks.*")
    .optional()
    .isMongoId()
    .withMessage("Each track must be a valid MongoDB ID"),

  // Cover file validation middleware (optional for playlist creation)
  (req, res, next) => {
    if (req.file) {
      const allowedImageTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
      ];

      if (!allowedImageTypes.includes(req.file.mimetype)) {
        return res
          .status(400)
          .json(ApiResponse.error("Unsupported image format"));
      }

      // Check file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (req.file.size > maxSize) {
        return res
          .status(400)
          .json(ApiResponse.error("Image size must not exceed 5MB"));
      }
    }
    next();
  },

  // Final error checking
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .json(ApiResponse.error("Validation errors", errors.array()));
    }
    next();
  },
];

export const validatePlaylistUpdate = [
  parseFormDataJSON,

  // All fields are optional for updates
  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Playlist name cannot be empty")
    .isLength({ min: 1, max: 100 })
    .withMessage("Playlist name must be between 1 and 100 characters"),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description cannot be longer than 500 characters"),

  body("tags")
    .optional()
    .isArray()
    .withMessage("Tags must be an array")
    .custom((value) => {
      if (value && value.length > 20) {
        throw new Error("Maximum 20 tags allowed");
      }
      return true;
    }),

  body("tags.*")
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage("Each tag must be between 1 and 50 characters"),

  body("category")
    .optional()
    .isIn(["user", "featured", "genre", "mood", "activity"])
    .withMessage("Invalid category"),

  body("privacy")
    .optional()
    .isIn(["public", "private", "unlisted"])
    .withMessage("Privacy must be public, private, or unlisted"),

  body("tracks").optional().isArray().withMessage("Tracks must be an array"),

  body("tracks.*")
    .optional()
    .isMongoId()
    .withMessage("Each track must be a valid MongoDB ID"),

  // Cover file validation middleware for updates
  (req, res, next) => {
    if (req.file) {
      const allowedImageTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
      ];

      if (!allowedImageTypes.includes(req.file.mimetype)) {
        return res
          .status(400)
          .json(ApiResponse.error("Unsupported image format"));
      }

      const maxSize = 5 * 1024 * 1024; // 5MB
      if (req.file.size > maxSize) {
        return res
          .status(400)
          .json(ApiResponse.error("Image size must not exceed 5MB"));
      }
    }
    next();
  },

  // Final error checking
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .json(ApiResponse.error("Validation errors", errors.array()));
    }
    next();
  },
];

export const validateBecomeArtist = [
  parseFormDataJSON,

  // Name validation
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Artist name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters")
    .custom(async (value, { req }) => {
      // Check name uniqueness
      const existingArtist = await Artist.findOne({
        name: new RegExp(`^${value}$`, "i"),
      });
      if (existingArtist) {
        throw new Error("Artist with this name already exists");
      }

      // Check that user doesn't already have an artist profile
      const user = await User.findById(req.user.id);
      if (user.artistProfile) {
        throw new Error("You already have an artist profile");
      }

      return true;
    }),

  // Bio validation - OPTIONAL for become artist (unlike admin creation)
  body("bio")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Biography cannot be longer than 1000 characters"),

  // Genres validation - optional
  body("genres")
    .optional()
    .isArray()
    .withMessage("Genres must be an array")
    .custom((value) => {
      if (value && value.length > 10) {
        throw new Error("Maximum 10 genres");
      }
      return true;
    }),

  body("genres.*")
    .optional()
    .trim()
    .isLength({ min: 2, max: 30 })
    .withMessage("Each genre must be between 2 and 30 characters"),

  // Social links validation - optional
  body("socialLinks")
    .optional()
    .isObject()
    .withMessage("Social links must be an object"),

  body("socialLinks.spotify")
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^https?:\/\/(open\.)?spotify\.com\/(artist|user)\/[a-zA-Z0-9]+/)
    .withMessage("Invalid Spotify link format"),

  body("socialLinks.instagram")
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^https?:\/\/(www\.)?instagram\.com\/[a-zA-Z0-9_.]+/)
    .withMessage("Invalid Instagram link format"),

  body("socialLinks.twitter")
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^https?:\/\/(www\.)?(twitter|x)\.com\/[a-zA-Z0-9_]+/)
    .withMessage("Invalid Twitter/X link format"),

  // Avatar file validation middleware - OPTIONAL for become artist
  (req, res, next) => {
    if (req.file) {
      const allowedImageTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
      ];

      if (!allowedImageTypes.includes(req.file.mimetype)) {
        return res
          .status(400)
          .json(ApiResponse.error("Unsupported image format"));
      }

      // Check file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (req.file.size > maxSize) {
        return res
          .status(400)
          .json(ApiResponse.error("Image size must not exceed 5MB"));
      }
    }
    next();
  },

  // Final error checking
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .json(ApiResponse.error("Validation errors", errors.array()));
    }
    next();
  },
];

export const validateUserProfileUpdate = [
  // Name validation (optional)
  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Name cannot be empty")
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters"),

  // Username validation (optional)
  body("username")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Username cannot be empty")
    .isLength({ min: 2, max: 30 })
    .withMessage("Username must be between 2 and 30 characters")
    .matches(/^[a-zA-Z0-9_.-]+$/)
    .withMessage(
      "Username can only contain letters, numbers, dots, hyphens and underscores"
    )
    .custom(async (value, { req }) => {
      // Check username uniqueness excluding current user
      const existingUser = await User.findOne({
        username: value.toLowerCase(),
        _id: { $ne: req.user.id },
      });
      if (existingUser) {
        throw new Error("Username already exists");
      }
      return true;
    }),

  // Email validation (optional)
  body("email")
    .optional()
    .trim()
    .isEmail()
    .withMessage("Invalid email format")
    .normalizeEmail()
    .custom(async (value, { req }) => {
      // Check email uniqueness excluding current user
      const existingUser = await User.findOne({
        email: value,
        _id: { $ne: req.user.id },
      });
      if (existingUser) {
        throw new Error("Email already exists");
      }
      return true;
    }),

  // Avatar file validation middleware
  (req, res, next) => {
    if (req.file) {
      const allowedImageTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
      ];

      if (!allowedImageTypes.includes(req.file.mimetype)) {
        return res
          .status(400)
          .json(ApiResponse.error("Unsupported image format"));
      }

      // Check file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (req.file.size > maxSize) {
        return res
          .status(400)
          .json(ApiResponse.error("Image size must not exceed 5MB"));
      }
    }
    next();
  },

  // Final error checking
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .json(ApiResponse.error("Validation errors", errors.array()));
    }
    next();
  },
];

/**
 * Change password validation middleware
 */
export const validatePasswordChange = [
  body("currentPassword")
    .notEmpty()
    .withMessage("Current password is required"),

  body("newPassword")
    .isLength({ min: 6 })
    .withMessage("New password must be at least 6 characters long")
    .matches(/^(?=.*[a-zA-Z])(?=.*\d)/)
    .withMessage(
      "New password must contain at least one letter and one number"
    ),

  body("confirmPassword").custom((value, { req }) => {
    if (value !== req.body.newPassword) {
      throw new Error("Password confirmation does not match");
    }
    return true;
  }),

  // Final error checking
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .json(ApiResponse.error("Validation errors", errors.array()));
    }
    next();
  },
];
