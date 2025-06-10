import multer from "multer";
import { ApiResponse } from "../utils/responses.js";

export const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  // MongoDB дублирующий ключ
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json(ApiResponse.error(`${field} уже существует`));
  }

  // MongoDB ошибки валидации
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json(ApiResponse.error("Ошибка валидации", errors));
  }

  // JWT ошибки
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json(ApiResponse.error("Недействительный токен"));
  }

  // Multer ошибки
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json(ApiResponse.error("Файл слишком большой"));
    }
    return res.status(400).json(ApiResponse.error("Ошибка загрузки файла"));
  }

  // Кастомные ошибки приложения
  if (err.message) {
    return res.status(400).json(ApiResponse.error(err.message));
  }

  // Общая ошибка сервера
  res.status(500).json(ApiResponse.error("Внутренняя ошибка сервера"));
};
