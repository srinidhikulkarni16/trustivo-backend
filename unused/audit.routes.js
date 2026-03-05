import express from "express";
import { getAuditTrail } from "../controllers/audit.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";

const router = express.Router();

// This makes the URL: /api/audit/:fileId
router.get("/:fileId", verifyToken, getAuditTrail);

export default router;