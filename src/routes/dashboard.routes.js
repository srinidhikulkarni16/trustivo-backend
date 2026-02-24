// dashboard.routes.js
import express from "express";
import { getDashboard, getDashboardData } from "../controllers/dashboard.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";
const router = express.Router();

// Protected routes
router.get("/", verifyToken, getDashboard);
router.get("/data", verifyToken, getDashboardData);

export default router;