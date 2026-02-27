import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Route Imports
import authRoutes from './src/routes/auth.routes.js';
import dashboardRoutes from './src/routes/dashboard.routes.js';
import documentRoutes from './src/routes/documentRoutes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ✅ 1. FIXED CORS CONFIGURATION
// This allows your frontend (5173) to send credentials (cookies/auth headers) to the backend (5000)
app.use(cors({ 
  origin: 'http://localhost:5173', 
  credentials: true, // Required for 'include' credentials mode
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ✅ 2. ROUTE ALIGNMENT
// Ensure these match exactly what you call in your React 'api.js' service
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/docs', documentRoutes); // Changed to /docs if your Upload.jsx uses '/docs/upload'

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));