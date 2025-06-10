import multer from 'multer';
import { UPLOAD_LIMITS } from '../config/constants.js';

const storage = multer.memoryStorage();

export const uploadMiddleware = multer({
  storage: storage,
  limits: {
    fileSize: UPLOAD_LIMITS.fileSize,
  },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'audio') {
      if (UPLOAD_LIMITS.audioFormats.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Неподдерживаемый формат аудио файла'), false);
      }
    } else if (file.fieldname === 'cover') {
      if (UPLOAD_LIMITS.imageFormats.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Неподдерживаемый формат изображения'), false);
      }
    } else {
      cb(new Error('Неизвестное поле файла'), false);
    }
  }
});