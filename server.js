import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import supabase from './src/config/supabase.js';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health Check
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Trustivo API is running 🚀',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Database Connectivity Test
app.get('/test-db', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .limit(5);

    if (error) throw error;

    res.status(200).json({
      success: true,
      count: data.length,
      data
    });
  } catch (err) {
    console.error('Database error:', err.message);

    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack);

  res.status(500).json({
    success: false,
    message: 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});