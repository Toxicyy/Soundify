import express from "express";
import {
  clearSearchHistory,
  getPopularContent,
  getSearchHistory,
  getSearchSuggestions,
  globalSearch,
  searchByCategory,
  searchWithPriority,
} from "../controllers/globalSearch.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();

/**
 * Роуты для глобального поиска
 */

// Основной глобальный поиск
// GET /api/search?q=query&limit=10&categories=tracks,artists,albums,playlists&includePrivate=false
router.get("/", globalSearch);

// Поиск с приоритетом по типу контента
// GET /api/search/priority?q=query&type=tracks&limit=10&secondaryLimit=5
router.get("/priority", searchWithPriority);

// Получение популярного контента (для пустого поиска)
// GET /api/search/popular?limit=10
router.get("/popular", getPopularContent);

// Автодополнение для поиска
// GET /api/search/suggestions?q=query&limit=5
router.get("/suggestions", getSearchSuggestions);

// Поиск только по определенной категории
// GET /api/search/category/:category?q=query&limit=20&page=1
router.get("/category/:category", searchByCategory);

// Получение истории поиска пользователя (требует авторизации)
// GET /api/search/history?limit=10
router.get("/history", authenticate, getSearchHistory);

// Очистка истории поиска пользователя (требует авторизации)
// DELETE /api/search/history
router.delete("/history", authenticate, clearSearchHistory);

export default router;
