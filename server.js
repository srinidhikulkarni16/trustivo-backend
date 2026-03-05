import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

/*  LOAD ENV FIRST */
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

/*  PRODUCTION-READY CORS */
// Ensure FRONTEND_URL is set in Render backend environment variables
const allowedOrigins = [process.env.FRONTEND_URL].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like Postman or mobile apps)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        console.warn(`⚠️ Blocked CORS request from: ${origin}`);
        return callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

/*  PARSERS */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/*  REQUEST LOGGING */
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

/*  STATIC FILES */
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/*  API ROUTES */
import authRoutes from "./src/routes/auth.routes.js";
import documentRoutes from "./src/routes/documentRoutes.js";
import signatureRoutes from "./src/routes/signature.routes.js";

// IMPORTANT: CORS must run BEFORE routes
app.use("/api/auth", authRoutes);
app.use("/api/docs", documentRoutes);
app.use("/api/signatures", signatureRoutes);

/*  HEALTH CHECK */
app.get("/", (req, res) => res.send("API running ✅"));
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    message: "Trustivo API is healthy 🚀",
  });
});

/*  ERROR HANDLER */
app.use((err, req, res, next) => {
  console.error("SERVER ERROR:", err.stack);

  // Handle CORS errors gracefully
  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({ message: err.message });
  }

  res.status(500).json({ message: "Something went wrong!" });
});

/*  START SERVER */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`
    🚀 Trustivo API Server Running      
    📍 Port: ${PORT}                        
    🌍 Environment: ${process.env.NODE_ENV || "development"}           
    🔗 Health: http://localhost:${PORT}/api/health
    🎯 CORS: ${allowedOrigins.length} origin(s) allowed  
  `);
});