import multer from "multer";
import { UPLOAD_LIMITS } from "../config/constants.js";

const storage = multer.memoryStorage();

/**
 * Multer configuration for batch album uploads
 * Handles up to 50 tracks with audio and cover files plus album cover
 */
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
        cb(new Error("Неподдерживаемый формат обложки альбома"), false);
      }
      return;
    }

    // Track audio files validation
    if (fieldName.match(/^tracks\[\d+\]\[audio\]$/)) {
      if (UPLOAD_LIMITS.audioFormats.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(
          new Error(`Неподдерживаемый формат аудио файла: ${fieldName}`),
          false
        );
      }
      return;
    }

    // Track cover files validation
    if (fieldName.match(/^tracks\[\d+\]\[cover\]$/)) {
      if (UPLOAD_LIMITS.imageFormats.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(
          new Error(`Неподдерживаемый формат обложки трека: ${fieldName}`),
          false
        );
      }
      return;
    }

    cb(new Error(`Неизвестное поле файла: ${fieldName}`), false);
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
              error: "Размер файла превышает лимит",
              details: `Максимальный размер файла: ${
                UPLOAD_LIMITS.fileSize / (1024 * 1024)
              }MB`,
            });
          case "LIMIT_FILE_COUNT":
            return res.status(400).json({
              success: false,
              error: "Превышено количество файлов",
              details:
                "Максимум 101 файл (1 обложка альбома + 50 треков * 2 файла)",
            });
          case "LIMIT_FIELD_COUNT":
            return res.status(400).json({
              success: false,
              error: "Превышено количество полей",
            });
          case "LIMIT_UNEXPECTED_FILE":
            return res.status(400).json({
              success: false,
              error: "Неожиданный файл",
              details: err.field,
            });
          default:
            return res.status(400).json({
              success: false,
              error: "Ошибка загрузки файлов",
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
        error: "Общий размер запроса превышает лимит",
        details: `Максимальный размер: 500MB, получено: ${Math.round(
          totalSize / (1024 * 1024)
        )}MB`,
      });
    }

    next();
  });
};

/**
 * Calculate total request size including files and body
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
 */
export const validateBatchUploadStructure = (req, res, next) => {
  if (!req.files) {
    return res.status(400).json({
      success: false,
      error: "Файлы не найдены",
    });
  }

  const files = req.files;
  const errors = [];

  // Validate album cover
  if (!files.albumCover || !files.albumCover[0]) {
    errors.push("Обложка альбома обязательна");
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
    errors.push("Необходимо загрузить хотя бы один трек");
  }

  if (trackCount > 50) {
    errors.push("Максимальное количество треков: 50");
  }

  // Validate each track has both audio and cover
  trackIndices.forEach((index) => {
    const audioField = `tracks[${index}][audio]`;
    const coverField = `tracks[${index}][cover]`;

    if (!files[audioField] || !files[audioField][0]) {
      errors.push(`Аудио файл для трека ${index + 1} отсутствует`);
    }

    if (!files[coverField] || !files[coverField][0]) {
      errors.push(`Обложка для трека ${index + 1} отсутствует`);
    }
  });

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: "Ошибки структуры файлов",
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
