import { body, validationResult } from "express-validator";
import { ApiResponse } from "../utils/responses.js";

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
