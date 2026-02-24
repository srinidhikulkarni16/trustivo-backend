import express from 'express';
import { uploadDocument, getUserDocuments } from '../controllers/documentController.js';
import { verifyToken } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/multer.js';

const router = express.Router();

router.post('/upload', verifyToken, upload.single('pdf'), uploadDocument);
router.get('/', verifyToken, getUserDocuments);

export default router;