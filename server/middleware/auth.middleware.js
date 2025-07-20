import jwt from "jsonwebtoken";
import { config } from "../config/config.js";
import User from "../models/User.model.js";
import { ApiResponse } from "../utils/responses.js";

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json(ApiResponse.error("Токен не предоставлен"));
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, config.jwtSecret);

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json(ApiResponse.error("Пользователь не найден"));
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json(ApiResponse.error("Недействительный токен"));
    }
    return res.status(500).json(ApiResponse.error("Ошибка аутентификации"));
  }
};

export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, config.jwtSecret);
      const user = await User.findById(decoded.id);
      req.user = user;
    }

    next();
  } catch (error) {
    // Игнорируем ошибки для опционального auth
    next();
  }
};
