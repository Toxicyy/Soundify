import { body, validationResult } from "express-validator";
import { ApiResponse } from "../utils/responses.js";
import Artist from "../models/Artist.model.js";
import Album from "../models/Album.model.js";

/**
 * Batch Album Validation Middleware
 * Validates album creation with multiple tracks
 * Ensures data integrity and artist ownership
 */

/**
 * Parse JSON objects from FormData
 * Converts tracks array to individual form fields
 */
const parseFormDataJSON = (req, res, next) => {
  // Handle tracks JSON object from FormData
  if (req.body && req.body.tracks) {
    if (Array.isArray(req.body.tracks)) {
      req.body.tracks.forEach((track, index) => {
        // Convert to FormData fields
        if (track.name) {
          req.body[`tracks[${index}][name]`] = track.name;
        }
        if (track.genre) {
          req.body[`tracks[${index}][genre]`] = track.genre;
        }
        if (track.tags) {
          if (typeof track.tags === "string") {
            req.body[`tracks[${index}][tags]`] = [track.tags];
          } else if (Array.isArray(track.tags)) {
            req.body[`tracks[${index}][tags]`] = track.tags;
          }
        }
      });

      // Remove original JSON object
      delete req.body.tracks;
    }
  }

  // Parse tags for each track
  if (req.body) {
    Object.keys(req.body).forEach((key) => {
      // Parse track tags
      if (
        key.match(/^tracks\[\d+\]\[tags\]$/) &&
        typeof req.body[key] === "string"
      ) {
        try {
          req.body[key] = JSON.parse(req.body[key]);
        } catch (e) {
          req.body[key] = req.body[key]
            .split(",")
            .map((tag) => tag.trim())
            .filter((tag) => tag);
        }
      }

      // Parse albumGenre
      if (key === "albumGenre" && typeof req.body[key] === "string") {
        try {
          req.body[key] = JSON.parse(req.body[key]);
        } catch (e) {
          req.body[key] = req.body[key]
            .split(",")
            .map((g) => g.trim())
            .filter((g) => g);
        }
      }
    });
  }

  next();
};

/**
 * Validate batch album creation data
 */
export const validateBatchAlbumCreation = [
  parseFormDataJSON,

  // Album validation
  body("albumName")
    .trim()
    .notEmpty()
    .withMessage("Album name is required")
    .isLength({ min: 1, max: 100 })
    .withMessage("Album name must be between 1 and 100 characters"),

  body("albumDescription")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Album description cannot be longer than 1000 characters"),

  body("albumGenre")
    .optional()
    .custom((value) => {
      if (value) {
        const genres = Array.isArray(value) ? value : [value];
        if (genres.length > 10) {
          throw new Error("Maximum 10 genres for album");
        }
        if (
          genres.some(
            (genre) =>
              typeof genre !== "string" ||
              genre.trim().length < 2 ||
              genre.trim().length > 30
          )
        ) {
          throw new Error("Each genre must be between 2 and 30 characters");
        }
      }
      return true;
    }),

  body("albumType")
    .optional()
    .isIn(["album", "ep", "single"])
    .withMessage("Album type must be: album, ep, or single"),

  body("releaseDate")
    .optional()
    .isISO8601()
    .withMessage("Invalid release date format"),

  // Track validation using indices from uploadBatch middleware
  (req, res, next) => {
    if (!req.batchInfo || !req.batchInfo.trackIndices) {
      return res
        .status(500)
        .json(
          ApiResponse.error(
            "Track information not found. Check middleware order."
          )
        );
    }

    const { trackIndices } = req.batchInfo;
    const errors = [];
    const trackNames = new Set();

    trackIndices.forEach((index, arrayIndex) => {
      const nameKey = `tracks[${index}][name]`;
      const genreKey = `tracks[${index}][genre]`;
      const tagsKey = `tracks[${index}][tags]`;

      const trackName = req.body[nameKey];
      const trackGenre = req.body[genreKey];
      const trackTags = req.body[tagsKey];

      // Validate track name
      if (
        !trackName ||
        typeof trackName !== "string" ||
        trackName.trim().length === 0
      ) {
        errors.push(
          `Track name is required for track ${arrayIndex + 1} (index ${index})`
        );
      } else if (trackName.trim().length > 100) {
        errors.push(
          `Track name ${arrayIndex + 1} cannot be longer than 100 characters`
        );
      } else {
        const trimmedName = trackName.trim().toLowerCase();
        if (trackNames.has(trimmedName)) {
          errors.push(`Duplicate track name: "${trackName.trim()}"`);
        } else {
          trackNames.add(trimmedName);
        }
      }

      // Validate genre (optional)
      if (
        trackGenre &&
        (typeof trackGenre !== "string" || trackGenre.trim().length > 50)
      ) {
        errors.push(
          `Track ${arrayIndex + 1} genre cannot be longer than 50 characters`
        );
      }

      // Validate tags (optional)
      if (trackTags) {
        if (!Array.isArray(trackTags)) {
          errors.push(`Track ${arrayIndex + 1} tags must be an array`);
        } else if (trackTags.length > 20) {
          errors.push(`Maximum 20 tags for track ${arrayIndex + 1}`);
        } else {
          trackTags.forEach((tag, tagIndex) => {
            if (typeof tag !== "string" || tag.trim().length === 0) {
              errors.push(
                `Tag ${tagIndex + 1} of track ${arrayIndex + 1} cannot be empty`
              );
            } else if (tag.trim().length > 50) {
              errors.push(
                `Tag ${tagIndex + 1} of track ${
                  arrayIndex + 1
                } cannot be longer than 50 characters`
              );
            }
          });
        }
      }
    });

    if (errors.length > 0) {
      return res
        .status(400)
        .json(ApiResponse.error("Track validation errors", errors));
    }

    next();
  },

  // Artist validation and album uniqueness check
  async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return res
          .status(401)
          .json(ApiResponse.error("User not authenticated"));
      }

      // Find artist by owner field
      const artist = await Artist.findOne({ owner: req.user.id });

      if (!artist) {
        return res
          .status(400)
          .json(
            ApiResponse.error(
              "User does not have an artist profile. Create an artist profile before uploading albums."
            )
          );
      }

      // Check album name uniqueness for this artist
      const albumName = req.body.albumName.trim();
      const existingAlbum = await Album.findOne({
        name: new RegExp(`^${albumName}$`, "i"),
        artist: artist._id,
      });

      if (existingAlbum) {
        return res
          .status(400)
          .json(
            ApiResponse.error(
              "An album with this name already exists for this artist"
            )
          );
      }

      // Add artist info to request
      req.artistInfo = {
        artistId: artist._id,
        artistName: artist.name,
      };

      next();
    } catch (error) {
      return res.status(500).json(ApiResponse.error("Data validation error"));
    }
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
 * Check system limits for batch processing
 */
export const checkSystemLimits = (req, res, next) => {
  if (!req.batchInfo || typeof req.batchInfo.trackCount === "undefined") {
    return res
      .status(500)
      .json(ApiResponse.error("Track count information not found"));
  }

  const { trackCount } = req.batchInfo;

  if (trackCount > 50) {
    return res
      .status(400)
      .json(ApiResponse.error("Maximum number of tracks in one request: 50"));
  }

  if (trackCount < 2) {
    return res
      .status(400)
      .json(ApiResponse.error("Minimum number of tracks for album: 2"));
  }

  // Check estimated processing time
  const estimatedProcessingTime = trackCount * 2; // minutes
  if (estimatedProcessingTime > 100) {
    return res
      .status(400)
      .json(ApiResponse.error("Too many tracks for simultaneous processing"));
  }

  next();
};

/**
 * Generate session ID for progress tracking
 */
export const generateSessionId = (req, res, next) => {
  const sessionId = `batch_${Date.now()}_${Math.random()
    .toString(36)
    .substr(2, 9)}`;

  req.sessionId = sessionId;
  res.set("X-Session-ID", sessionId);
  next();
};
