import { body, validationResult } from "express-validator";
import { ApiResponse } from "../utils/responses.js";
import Artist from "../models/Artist.model.js";

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
