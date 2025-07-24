import { body, validationResult } from "express-validator";
import { ApiResponse } from "../utils/responses.js";
import Artist from "../models/Artist.model.js";
import Album from "../models/Album.model.js";

// Парсинг JSON полей из FormData
const parseFormDataJSON = (req, res, next) => {
  // Парсим теги для каждого трека
  if (req.body) {
    Object.keys(req.body).forEach((key) => {
      // Парсим tags для треков: tracks[0][tags], tracks[1][tags], etc.
      if (
        key.match(/^tracks\[\d+\]\[tags\]$/) &&
        typeof req.body[key] === "string"
      ) {
        try {
          req.body[key] = JSON.parse(req.body[key]);
        } catch (e) {
          // Если не JSON, пробуем разбить по запятым
          req.body[key] = req.body[key]
            .split(",")
            .map((tag) => tag.trim())
            .filter((tag) => tag);
        }
      }

      // Парсим albumGenre если это строка
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

export const validateBatchAlbumCreation = [
  // Добавляем парсинг JSON в начало цепочки middleware
  parseFormDataJSON,

  // Валидация данных альбома
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

  // ИСПРАВЛЕННАЯ проверка треков - ищем все треки в req.body динамически
  (req, res, next) => {
    console.log("=== VALIDATION DEBUG ===");
    console.log("req.body keys:", Object.keys(req.body));
    console.log("req.body.tracks:", req.body.tracks);
    console.log("req.batchInfo:", req.batchInfo);

    if (!req.batchInfo || !req.batchInfo.trackIndices) {
      return res
        .status(400)
        .json(ApiResponse.error("Информация о треках не найдена"));
    }

    const { trackIndices } = req.batchInfo;
    console.log("trackIndices from middleware:", trackIndices);

    const errors = [];
    const trackNames = new Set();

    // ПРОВЕРЯЕМ: если данные пришли как req.body.tracks (JSON), а не как отдельные поля
    if (req.body.tracks && typeof req.body.tracks === "object") {
      console.log("DETECTED: tracks data as JSON object");
      console.log(
        "tracks structure:",
        JSON.stringify(req.body.tracks, null, 2)
      );

      // Обрабатываем как JSON объект
      Object.keys(req.body.tracks).forEach((trackKey, arrayIndex) => {
        const trackData = req.body.tracks[trackKey];
        console.log(`Processing track ${trackKey}:`, trackData);

        if (
          !trackData.name ||
          typeof trackData.name !== "string" ||
          trackData.name.trim().length === 0
        ) {
          errors.push(`Название трека ${arrayIndex + 1} обязательно`);
        } else if (trackData.name.trim().length > 100) {
          errors.push(
            `Название трека ${
              arrayIndex + 1
            } не может быть длиннее 100 символов`
          );
        } else {
          const trimmedName = trackData.name.trim().toLowerCase();
          if (trackNames.has(trimmedName)) {
            errors.push(
              `Дублирующееся название трека: "${trackData.name.trim()}"`
            );
          } else {
            trackNames.add(trimmedName);
            console.log(
              `SUCCESS: Track ${arrayIndex} name validated: "${trackData.name}"`
            );
          }
        }
      });
    } else {
      // Оригинальная логика для FormData полей
      console.log("DETECTED: tracks data as separate FormData fields");

      trackIndices.forEach((index) => {
        const nameKey = `tracks[${index}][name]`;
        const genreKey = `tracks[${index}][genre]`;
        const tagsKey = `tracks[${index}][tags]`;

        console.log(`Checking track ${index}:`, {
          nameKey,
          nameValue: req.body[nameKey],
          genreValue: req.body[genreKey],
          tagsValue: req.body[tagsKey],
        });

        const trackName = req.body[nameKey];
        const trackGenre = req.body[genreKey];
        const trackTags = req.body[tagsKey];

        // Проверка имени трека
        if (
          !trackName ||
          typeof trackName !== "string" ||
          trackName.trim().length === 0
        ) {
          errors.push(
            `Название трека ${index + 1} обязательно (поле: ${nameKey})`
          );
          console.log(`ERROR: Track ${index} name missing or invalid`);
        } else if (trackName.trim().length > 100) {
          errors.push(
            `Название трека ${index + 1} не может быть длиннее 100 символов`
          );
        } else {
          const trimmedName = trackName.trim().toLowerCase();
          if (trackNames.has(trimmedName)) {
            errors.push(`Дублирующееся название трека: "${trackName.trim()}"`);
          } else {
            trackNames.add(trimmedName);
            console.log(
              `SUCCESS: Track ${index} name validated: "${trackName}"`
            );
          }
        }

        // Проверка жанра трека (опционально)
        if (
          trackGenre &&
          (typeof trackGenre !== "string" || trackGenre.trim().length > 50)
        ) {
          errors.push(
            `Жанр трека ${index + 1} не может быть длиннее 50 символов`
          );
        }

        // Проверка тегов трека (опционально)
        if (trackTags) {
          if (!Array.isArray(trackTags)) {
            errors.push(`Теги трека ${index + 1} должны быть массивом`);
          } else if (trackTags.length > 20) {
            errors.push(`Максимум 20 тегов для трека ${index + 1}`);
          } else {
            trackTags.forEach((tag, tagIndex) => {
              if (typeof tag !== "string" || tag.trim().length === 0) {
                errors.push(
                  `Тег ${tagIndex + 1} трека ${index + 1} не может быть пустым`
                );
              } else if (tag.trim().length > 50) {
                errors.push(
                  `Тег ${tagIndex + 1} трека ${
                    index + 1
                  } не может быть длиннее 50 символов`
                );
              }
            });
          }
        }
      });
    }

    console.log("Validation errors:", errors);
    console.log("=== END VALIDATION DEBUG ===");

    if (errors.length > 0) {
      return res
        .status(400)
        .json(ApiResponse.error("Ошибки валидации треков", errors));
    }

    next();
  },

  // Проверка существования артиста и уникальности названия альбома
  async (req, res, next) => {
    try {
      // Проверяем, что у пользователя есть профиль артиста
      if (!req.user || !req.user.artistProfile) {
        return res
          .status(400)
          .json(ApiResponse.error("У пользователя нет профиля артиста"));
      }

      const artistId = req.user.artistProfile;

      // Проверяем существование артиста
      const artist = await Artist.findById(artistId);
      if (!artist) {
        return res
          .status(400)
          .json(ApiResponse.error("Профиль артиста не найден"));
      }

      // Проверяем уникальность названия альбома для данного артиста
      const albumName = req.body.albumName.trim();
      const existingAlbum = await Album.findOne({
        name: new RegExp(`^${albumName}$`, "i"),
        artist: artistId,
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

      // Добавляем информацию об артисте в req
      req.artistInfo = {
        artistId,
        artistName: artist.name,
      };

      next();
    } catch (error) {
      console.error("Validation error:", error);
      return res.status(500).json(ApiResponse.error("Ошибка проверки данных"));
    }
  },

  // Финальная проверка ошибок express-validator
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

// Middleware для проверки лимитов системы
export const checkSystemLimits = (req, res, next) => {
  const { trackCount } = req.batchInfo;

  // Проверяем лимиты
  if (trackCount > 50) {
    return res
      .status(400)
      .json(
        ApiResponse.error("Максимальное количество треков в одном запросе: 50")
      );
  }

  // Проверяем примерное время обработки (2 минуты на трек максимум)
  const estimatedProcessingTime = trackCount * 2; // минуты
  if (estimatedProcessingTime > 100) {
    // 100 минут максимум
    return res
      .status(400)
      .json(
        ApiResponse.error("Слишком много треков для одновременной обработки")
      );
  }

  next();
};

// Middleware для генерации session ID для SSE tracking
export const generateSessionId = (req, res, next) => {
  const sessionId = `batch_${Date.now()}_${Math.random()
    .toString(36)
    .substr(2, 9)}`;
  req.sessionId = sessionId;

  // Добавляем заголовок с session ID для клиента
  res.set("X-Session-ID", sessionId);

  next();
};
