import express from "express";
import { adminOnly } from "../middleware/admin.middleware.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { getDashboardStats, getStreamsStats, getUsersStats } from "../controllers/analytics.controller.js";

const router = express.Router();

router.use(authenticate, adminOnly);

router.get("/dashboard", getDashboardStats);
router.get("/users", getUsersStats);
router.get("/streams", getStreamsStats);

export default router