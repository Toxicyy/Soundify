import express from "express";
import recommendationController from "../controllers/recommendation.controller.js";

const router = express.Router();

// GET /api/recommendations?userId=...
router.get("/", recommendationController.getRecommendations);

export default router;
