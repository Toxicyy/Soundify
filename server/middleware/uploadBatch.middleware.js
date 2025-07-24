import multer from "multer";
import { UPLOAD_LIMITS } from "../config/constants.js";

const storage = multer.memoryStorage();

// Конфигурация для batch загрузки альбома
const batchUpload = multer({
  storage: storage,
  limits: {
    fileSize: UPLOAD_LIMITS.fileSize, // Размер одного файла
    files: 101, // Максимум: 1 обложка альбома + 50 треков * 2 файла (аудио + обложка)
    fieldSize: 10 * 1024 * 1024, // 10MB для текстовых полей
    fieldNameSize: 200, // Длина имени поля
    fields: 500, // Количество не-файловых полей
  },
  fileFilter: (req, file, cb) => {
    const fieldName = file.fieldname;

    // Обложка альбома
    if (fieldName === "albumCover") {
      if (UPLOAD_LIMITS.imageFormats.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error("Неподдерживаемый формат обложки альбома"), false);
      }
      return;
    }

    // Аудио файлы треков: tracks[0][audio], tracks[1][audio], etc.
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

    // Обложки треков: tracks[0][cover], tracks[1][cover], etc.
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

// Middleware для обработки batch загрузки альбома
export const uploadBatchAlbum = (req, res, next) => {
  // Создаем fields array динамически для до 50 треков
  const fields = [{ name: "albumCover", maxCount: 1 }];

  // Добавляем поля для треков (до 50)
  for (let i = 0; i < 50; i++) {
    fields.push(
      { name: `tracks[${i}][audio]`, maxCount: 1 },
      { name: `tracks[${i}][cover]`, maxCount: 1 }
    );
  }

  const uploadMiddleware = batchUpload.fields(fields);

  uploadMiddleware(req, res, (err) => {
    if (err) {
      console.error("Batch upload error:", err);

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

    // Проверяем общий размер запроса (500MB лимит)
    const totalSize = calculateTotalRequestSize(req);
    const maxTotalSize = 500 * 1024 * 1024; // 500MB

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

// Вспомогательная функция для подсчета общего размера запроса
const calculateTotalRequestSize = (req) => {
  let totalSize = 0;

  if (req.files) {
    // Подсчитываем размер всех файлов
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

  // Добавляем примерный размер текстовых полей
  if (req.body) {
    const bodySize = JSON.stringify(req.body).length;
    totalSize += bodySize;
  }

  return totalSize;
};

// Middleware для проверки структуры загруженных файлов
export const validateBatchUploadStructure = (req, res, next) => {
  if (!req.files) {
    return res.status(400).json({
      success: false,
      error: "Файлы не найдены",
    });
  }

  const files = req.files;
  const errors = [];

  // Проверяем обложку альбома
  if (!files.albumCover || !files.albumCover[0]) {
    errors.push("Обложка альбома обязательна");
  }

  // Подсчитываем количество треков
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

  // Проверяем, что у каждого трека есть и аудио, и обложка
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

  // Добавляем информацию о треках в req для последующего использования
  req.batchInfo = {
    trackCount,
    trackIndices: Array.from(trackIndices).sort((a, b) => a - b),
  };

  next();
};
