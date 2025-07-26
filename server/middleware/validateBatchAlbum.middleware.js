import { body, validationResult } from "express-validator";
import { ApiResponse } from "../utils/responses.js";
import Artist from "../models/Artist.model.js";
import Album from "../models/Album.model.js";

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
    .withMessage("Название альбома обязательно")
    .isLength({ min: 1, max: 100 })
    .withMessage("Название альбома должно быть от 1 до 100 символов"),

  body("albumDescription")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Описание альбома не может быть длиннее 1000 символов"),

  body("albumGenre")
    .optional()
    .custom((value) => {
      if (value) {
        const genres = Array.isArray(value) ? value : [value];
        if (genres.length > 10) {
          throw new Error("Максимум 10 жанров для альбома");
        }
        if (
          genres.some(
            (genre) =>
              typeof genre !== "string" ||
              genre.trim().length < 2 ||
              genre.trim().length > 30
          )
        ) {
          throw new Error("Каждый жанр должен быть от 2 до 30 символов");
        }
      }
      return true;
    }),

  body("albumType")
    .optional()
    .isIn(["album", "ep", "single"])
    .withMessage("Тип альбома должен быть: album, ep или single"),

  body("releaseDate")
    .optional()
    .isISO8601()
    .withMessage("Неверный формат даты релиза"),

  // Track validation using indices from uploadBatch middleware
  (req, res, next) => {
    if (!req.batchInfo || !req.batchInfo.trackIndices) {
      return res
        .status(500)
        .json(
          ApiResponse.error(
            "Информация о треках не найдена. Проверьте порядок middleware."
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
          `Название трека ${arrayIndex + 1} (index ${index}) обязательно`
        );
      } else if (trackName.trim().length > 100) {
        errors.push(
          `Название трека ${arrayIndex + 1} не может быть длиннее 100 символов`
        );
      } else {
        const trimmedName = trackName.trim().toLowerCase();
        if (trackNames.has(trimmedName)) {
          errors.push(`Дублирующееся название трека: "${trackName.trim()}"`);
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
          `Жанр трека ${arrayIndex + 1} не может быть длиннее 50 символов`
        );
      }

      // Validate tags (optional)
      if (trackTags) {
        if (!Array.isArray(trackTags)) {
          errors.push(`Теги трека ${arrayIndex + 1} должны быть массивом`);
        } else if (trackTags.length > 20) {
          errors.push(`Максимум 20 тегов для трека ${arrayIndex + 1}`);
        } else {
          trackTags.forEach((tag, tagIndex) => {
            if (typeof tag !== "string" || tag.trim().length === 0) {
              errors.push(
                `Тег ${tagIndex + 1} трека ${
                  arrayIndex + 1
                } не может быть пустым`
              );
            } else if (tag.trim().length > 50) {
              errors.push(
                `Тег ${tagIndex + 1} трека ${
                  arrayIndex + 1
                } не может быть длиннее 50 символов`
              );
            }
          });
        }
      }
    });

    if (errors.length > 0) {
      return res
        .status(400)
        .json(ApiResponse.error("Ошибки валидации треков", errors));
    }

    next();
  },

  // Artist validation and album uniqueness check
  async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return res
          .status(401)
          .json(ApiResponse.error("Пользователь не авторизован"));
      }

      // Find artist by owner field
      const artist = await Artist.findOne({ owner: req.user.id });

      if (!artist) {
        return res
          .status(400)
          .json(
            ApiResponse.error(
              "У пользователя нет профиля артиста. Создайте профиль артиста перед загрузкой альбомов."
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
              "Альбом с таким названием уже существует у данного артиста"
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
      return res.status(500).json(ApiResponse.error("Ошибка проверки данных"));
    }
  },

  // Final validation check
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .json(ApiResponse.error("Ошибки валидации", errors.array()));
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
      .json(ApiResponse.error("Информация о количестве треков не найдена"));
  }

  const { trackCount } = req.batchInfo;

  if (trackCount > 50) {
    return res
      .status(400)
      .json(
        ApiResponse.error("Максимальное количество треков в одном запросе: 50")
      );
  }

  if (trackCount < 2) {
    return res
      .status(400)
      .json(ApiResponse.error("Минимальное количество треков для альбома: 2"));
  }

  // Check estimated processing time
  const estimatedProcessingTime = trackCount * 2; // minutes
  if (estimatedProcessingTime > 100) {
    return res
      .status(400)
      .json(
        ApiResponse.error("Слишком много треков для одновременной обработки")
      );
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
