import express from "express";
import { verifyToken } from "../middleware/auth.middleware.js";
import {
  saveSignature,
  getSignatures,
  updateSignatureStatus,
  generatePublicLink,
  verifyPublicToken,
  submitPublicSignature,
  getAuditLog,
} from "../controllers/signatureController.js";

const router = express.Router();

// Public routes FIRST (no auth)
router.get("/public/:token", verifyPublicToken);
router.post("/public/:token/sign", submitPublicSignature);

// Specific routes BEFORE wildcard routes
router.get("/audit/:documentId", verifyToken, getAuditLog);
router.post("/", verifyToken, saveSignature);
router.patch("/:id/status", verifyToken, updateSignatureStatus);
router.post("/:documentId/send-link", verifyToken, generatePublicLink);

// Wildcard LAST
router.get("/:documentId", verifyToken, getSignatures);

export default router;