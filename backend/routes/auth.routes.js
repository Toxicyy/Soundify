import express from "express";
import { register, login, getUser } from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();

// Публичные маршруты
router.post("/register", register);
router.post("/login", login);

// Защищенные маршруты
router.get("/me", authenticate, getUser);

export default router;
