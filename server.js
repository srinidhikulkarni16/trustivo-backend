import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
// import auditRoutes from "./src/routes/audit.routes.js";

/*ROUTES*/
import authRoutes from "./src/routes/auth.routes.js";
// import dashboardRoutes from "./src/routes/dashboard.routes.js";
import documentRoutes from "./src/routes/documentRoutes.js";
import signatureRoutes from "./src/routes/signature.routes.js"; 

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

/*CORS - PRODUCTION READY */
const allowedOrigins = [
  process.env.FRONTEND_URL, // only deployed frontend
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, Postman)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`⚠️  Blocked CORS request from: ${origin}`);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

/*  BODY PARSER  */
/* MUST COME BEFORE ROUTES */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* REQUEST LOGGING (helpful for debugging in production) */
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

/*  STATIC FILES  */
app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"))
);

/*  API ROUTES  */
app.use("/api/auth", authRoutes);
// app.use("/api/dashboard", dashboardRoutes);
app.use("/api/docs", documentRoutes);

/* SIGNATURE ROUTE (MISSING BEFORE) */
app.use("/api/signatures", signatureRoutes);
// app.use("/api/audit", auditRoutes);

/*  HEALTH CHECK  */
app.get("/", (req, res) => {
  res.send("API running ✅");
});

app.get("/api/health", (req, res) => {
  res.json({ 
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    message: "Trustivo API is healthy 🚀"
  });
});

/*  ERROR HANDLER  */
app.use((err, req, res, next) => {
  console.error("SERVER ERROR:", err.stack);

  res.status(500).json({
    message: "Something went wrong!",
  });
});

/*  SERVER START  */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`
    🚀 Trustivo API Server Running      
    📍 Port: ${PORT}                        
    🌍 Environment: ${process.env.NODE_ENV || "development"}           ║
    🔗 Health: http://localhost:${PORT}/api/health
    🎯 CORS: ${allowedOrigins.length} origin(s) allowed  
  `);
});