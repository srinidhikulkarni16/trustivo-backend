import express from "express";
import { verifyToken } from "../middleware/auth.middleware.js";
import { checkDocumentOwner } from "../middleware/checkDocumentOwner.js";
import { upload } from "../middleware/upload.middleware.js";

import {
  uploadDocument,
  getUserDocuments,
  addSigner,
  saveSignaturePosition,
  generatePublicSignToken,
  generateSignedPdf
} from "../controllers/documentController.js";

const router = express.Router();

/* Upload */
router.post(
  "/upload",
  verifyToken,
  upload.single("file"),
  uploadDocument
);

/* Dashboard */
router.get(
  "/my-documents",
  verifyToken,
  getUserDocuments
);

/* Signers */
router.post(
  "/:documentId/add-signer",
  verifyToken,
  checkDocumentOwner,
  addSigner
);

/* Signature box */
router.post(
  "/:documentId/:signerId/position",
  verifyToken,
  checkDocumentOwner,
  saveSignaturePosition
);

/* Public token */
router.post(
  "/:documentId/:signerId/token",
  verifyToken,
  checkDocumentOwner,
  generatePublicSignToken
);

/* Generate signed file */
router.post(
  "/:documentId/generate",
  verifyToken,
  checkDocumentOwner,
  generateSignedPdf
);

export default router;