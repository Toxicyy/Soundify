import { body, validationResult } from 'express-validator';
import { ApiResponse } from '../utils/responses.js';

export const validateTrackCreation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Название трека обязательно')
    .isLength({ max: 100 })
    .withMessage('Название не может быть длиннее 100 символов'),
    
  body('artistName')
    .trim()
    .notEmpty()
    .withMessage('Имя артиста обязательно'),
    
  body('audioUrl')
    .isURL()
    .withMessage('URL аудио файла должен быть валидным'),
    
  body('duration')
    .isInt({ min: 1 })
    .withMessage('Длительность должна быть положительным числом'),
    
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(
        ApiResponse.error('Ошибки валидации', errors.array())
      );
    }
    next();
  }
];