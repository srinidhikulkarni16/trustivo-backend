import express from "express";
import {
  uploadDocument,
  getUserDocuments,
  addSigner,
  saveSignaturePosition,
  generatePublicSignToken,
  generateSignedPdf,
} from "../controllers/documentController.js";

import { verifyToken } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/multer.js";

const router = express.Router();

// Upload PDF (with JWT auth)
router.post("/upload", verifyToken, upload.single("pdf"), uploadDocument);

// Other protected routes
router.get("/", verifyToken, getUserDocuments);
router.post("/:documentId/signer", verifyToken, addSigner);
router.post("/:documentId/:signerId/signature", verifyToken, saveSignaturePosition);
router.post("/:documentId/:signerId/token", verifyToken, generatePublicSignToken);
router.post("/:documentId/sign", verifyToken, generateSignedPdf);

export default router;