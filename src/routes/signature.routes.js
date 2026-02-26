import express from "express";
import { createSignature } from "../controllers/signatureController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware, createSignature);

export default router;