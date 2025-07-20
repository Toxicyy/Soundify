import { body, validationResult } from "express-validator";
import { ApiResponse } from "../utils/responses.js";
import Artist from "../models/Artist.model.js";
import Album from "../models/Album.model.js";
import User from "../models/User.model.js";

export const validateTrackCreation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Название трека обязательно")
    .isLength({ max: 100 })
    .withMessage("Название не может быть длиннее 100 символов"),

  body("artist").trim().notEmpty().withMessage("Имя артиста обязательно"),

  (req, res, next) => {
    if (!req.files || !req.files.audio || !req.files.audio[0]) {
      return res.status(400).json(ApiResponse.error("Аудио файл обязателен"));
    }

    if (!req.files.cover || !req.files.cover[0]) {
      return res.status(400).json(ApiResponse.error("Обложка обязательна"));
    }

    // Проверка типа аудио файла
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
        .json(ApiResponse.error("Неподдерживаемый формат аудио файла"));
    }

    // Проверка типа изображения
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
        .json(ApiResponse.error("Неподдерживаемый формат изображения"));
    }

    next();
  },

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

const parseFormDataJSON = (req, res, next) => {
  // Парсим genres если это строка
  if (req.body.genres && typeof req.body.genres === "string") {
    try {
      req.body.genres = JSON.parse(req.body.genres);
    } catch (e) {
      return res
        .status(400)
        .json(ApiResponse.error("Неверный формат данных для жанров"));
    }
  }

  // Парсим socialLinks если это строка
  if (req.body.socialLinks && typeof req.body.socialLinks === "string") {
    try {
      req.body.socialLinks = JSON.parse(req.body.socialLinks);
    } catch (e) {
      return res
        .status(400)
        .json(
          ApiResponse.error("Неверный формат данных для социальных ссылок")
        );
    }
  }

  // 👇 ДОБАВЬ ЭТО ДЛЯ TAGS
  if (req.body.tags && typeof req.body.tags === "string") {
    try {
      req.body.tags = JSON.parse(req.body.tags);
    } catch (e) {
      return res
        .status(400)
        .json(ApiResponse.error("Неверный формат данных для тегов"));
    }
  }

  next();
};

export const validateArtistCreation = [
  // Добавляем парсинг JSON в начало цепочки middleware
  parseFormDataJSON,

  // Валидация имени
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Имя артиста обязательно")
    .isLength({ min: 2, max: 100 })
    .withMessage("Имя должно быть от 2 до 100 символов")
    .custom(async (value) => {
      // Проверка на уникальность имени
      const existingArtist = await Artist.findOne({
        name: new RegExp(`^${value}$`, "i"),
      });
      if (existingArtist) {
        throw new Error("Артист с таким именем уже существует");
      }
      return true;
    }),

  // Валидация биографии
  body("bio")
    .trim()
    .notEmpty()
    .withMessage("Биография обязательна")
    .isLength({ max: 1000 })
    .withMessage("Биография не может быть длиннее 1000 символов"),

  // Валидация жанров - теперь работает с массивом
  body("genres")
    .isArray({ min: 1 })
    .withMessage("Необходимо выбрать хотя бы один жанр")
    .custom((value) => {
      if (value && value.length > 10) {
        throw new Error("Максимум 10 жанров");
      }
      return true;
    }),

  body("genres.*")
    .trim()
    .isLength({ min: 2, max: 30 })
    .withMessage("Каждый жанр должен быть от 2 до 30 символов"),

  // Валидация социальных ссылок - теперь работает с объектом
  body("socialLinks")
    .optional()
    .isObject()
    .withMessage("Социальные ссылки должны быть объектом"),

  body("socialLinks.spotify")
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^https?:\/\/(open\.)?spotify\.com\/(artist|user)\/[a-zA-Z0-9]+/)
    .withMessage("Неверный формат ссылки Spotify"),

  body("socialLinks.instagram")
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^https?:\/\/(www\.)?instagram\.com\/[a-zA-Z0-9_.]+/)
    .withMessage("Неверный формат ссылки Instagram"),

  body("socialLinks.twitter")
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^https?:\/\/(www\.)?(twitter|x)\.com\/[a-zA-Z0-9_]+/)
    .withMessage("Неверный формат ссылки Twitter/X"),

  // Middleware для проверки файла аватара
  (req, res, next) => {
    // Аватар обязателен при создании
    if (!req.file) {
      return res.status(400).json(ApiResponse.error("Аватар обязателен"));
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
        .json(ApiResponse.error("Неподдерживаемый формат изображения"));
    }

    // Проверка размера файла (макс 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (req.file.size > maxSize) {
      return res
        .status(400)
        .json(ApiResponse.error("Размер изображения не должен превышать 5MB"));
    }
    next();
  },

  // Финальная проверка ошибок
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

// Валидация для обновления артиста
export const validateArtistUpdate = [
  // Добавляем парсинг JSON
  parseFormDataJSON,

  // Те же правила, но все поля опциональны
  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Имя не может быть пустым")
    .isLength({ min: 2, max: 100 })
    .withMessage("Имя должно быть от 2 до 100 символов")
    .custom(async (value, { req }) => {
      // Проверка уникальности, исключая текущего артиста
      const existingArtist = await Artist.findOne({
        name: new RegExp(`^${value}$`, "i"),
        _id: { $ne: req.params.id },
      });
      if (existingArtist) {
        throw new Error("Артист с таким именем уже существует");
      }
      return true;
    }),

  body("bio")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Биография не может быть длиннее 1000 символов"),

  body("genres")
    .optional()
    .isArray()
    .withMessage("Жанры должны быть массивом")
    .custom((value) => {
      if (value && value.length > 10) {
        throw new Error("Максимум 10 жанров");
      }
      return true;
    }),

  body("genres.*")
    .optional()
    .trim()
    .isLength({ min: 2, max: 30 })
    .withMessage("Каждый жанр должен быть от 2 до 30 символов"),

  body("socialLinks")
    .optional()
    .isObject()
    .withMessage("Социальные ссылки должны быть объектом"),

  body("socialLinks.spotify")
    .optional({ checkFalsy: true })
    .trim()
    .custom((value) => {
      if (!value || value === "") return true;
      const spotifyRegex =
        /^https?:\/\/(open\.)?spotify\.com\/(artist|user)\/[a-zA-Z0-9]+/;
      if (!spotifyRegex.test(value)) {
        throw new Error("Неверный формат ссылки Spotify");
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
        throw new Error("Неверный формат ссылки Instagram");
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
        throw new Error("Неверный формат ссылки Twitter/X");
      }
      return true;
    }),

  // Middleware для проверки файла аватара при обновлении
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
          .json(ApiResponse.error("Неподдерживаемый формат изображения"));
      }

      const maxSize = 5 * 1024 * 1024; // 5MB
      if (req.file.size > maxSize) {
        return res
          .status(400)
          .json(
            ApiResponse.error("Размер изображения не должен превышать 5MB")
          );
      }
    }
    next();
  },

  // Финальная проверка ошибок
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

export const validateAlbumCreation = [
  // Add JSON parsing at the beginning of middleware chain
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
  // Add JSON parsing
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

// Добавить эти функции в validation.middleware.js

/**
 * Playlist creation validation middleware
 * Validates playlist name, description, tags, category, and cover file
 */
export const validatePlaylistCreation = [
  // Add JSON parsing at the beginning
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

/**
 * Playlist update validation middleware
 * All fields are optional for updates
 */
export const validatePlaylistUpdate = [
  // Add JSON parsing
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
  // Добавляем парсинг JSON в начало цепочки middleware
  parseFormDataJSON,

  // Валидация имени
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Имя артиста обязательно")
    .isLength({ min: 2, max: 100 })
    .withMessage("Имя должно быть от 2 до 100 символов")
    .custom(async (value, { req }) => {
      // Проверка на уникальность имени
      const existingArtist = await Artist.findOne({
        name: new RegExp(`^${value}$`, "i"),
      });
      if (existingArtist) {
        throw new Error("Артист с таким именем уже существует");
      }

      // Проверка что у пользователя еще нет артиста
      console.log(req.user.id);
      const user = await User.findById(req.user.id);
      if (user.artistProfile) {
        throw new Error("У вас уже есть профиль артиста");
      }

      return true;
    }),

  // Валидация биографии - ОПЦИОНАЛЬНА для become artist (в отличие от admin создания)
  body("bio")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Биография не может быть длиннее 1000 символов"),

  // Валидация жанров - опциональна
  body("genres")
    .optional()
    .isArray()
    .withMessage("Жанры должны быть массивом")
    .custom((value) => {
      if (value && value.length > 10) {
        throw new Error("Максимум 10 жанров");
      }
      return true;
    }),

  body("genres.*")
    .optional()
    .trim()
    .isLength({ min: 2, max: 30 })
    .withMessage("Каждый жанр должен быть от 2 до 30 символов"),

  // Валидация социальных ссылок - опциональна
  body("socialLinks")
    .optional()
    .isObject()
    .withMessage("Социальные ссылки должны быть объектом"),

  body("socialLinks.spotify")
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^https?:\/\/(open\.)?spotify\.com\/(artist|user)\/[a-zA-Z0-9]+/)
    .withMessage("Неверный формат ссылки Spotify"),

  body("socialLinks.instagram")
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^https?:\/\/(www\.)?instagram\.com\/[a-zA-Z0-9_.]+/)
    .withMessage("Неверный формат ссылки Instagram"),

  body("socialLinks.twitter")
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^https?:\/\/(www\.)?(twitter|x)\.com\/[a-zA-Z0-9_]+/)
    .withMessage("Неверный формат ссылки Twitter/X"),

  // Middleware для проверки файла аватара - ОПЦИОНАЛЕН для become artist
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
          .json(ApiResponse.error("Неподдерживаемый формат изображения"));
      }

      // Проверка размера файла (макс 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (req.file.size > maxSize) {
        return res
          .status(400)
          .json(
            ApiResponse.error("Размер изображения не должен превышать 5MB")
          );
      }
    }
    next();
  },

  // Финальная проверка ошибок
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
