// server/src/index.ts
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import movieRoutes from './routes/index';

// โหลด environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware สำหรับ logging
app.use((req, res, next) => {
  console.log(`📥 [${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// CORS configuration
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:5173',  // Vite default port
    'http://127.0.0.1:5173'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true
};

app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API Routes
app.use('/api', movieRoutes);

// Root endpoint
app.get('/', (req, res) => {
  console.log('🏠 [Root] Root endpoint accessed');
  res.json({
    success: true,
    message: 'Cinema Booking API Server',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      api: '/api',
      movies: '/api/movies',
      health: '/api/health',
      testDb: '/api/test-db'
    }
  });
});

// Global error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('💥 [Error] Global error handler:', err);
  
  res.status(500).json({
    success: false,
    message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  console.log('❓ [404] Route not found:', req.originalUrl);
  res.status(404).json({
    success: false,
    message: 'ไม่พบหน้าที่ร้องขอ',
    path: req.originalUrl,
    suggestion: 'ลองเข้าถึง /api/movies สำหรับข้อมูลภาพยนตร์'
  });
});

// Start server
app.listen(PORT, () => {
  console.log('🚀 ====================================');
  console.log('🎬 Cinema Booking API Server Started');
  console.log('🚀 ====================================');
  console.log(`📡 Server: http://localhost:${PORT}`);
  console.log(`🎭 Movies API: http://localhost:${PORT}/api/movies`);
  console.log(`❤️ Health Check: http://localhost:${PORT}/api/health`);
  console.log(`🔧 DB Test: http://localhost:${PORT}/api/test-db`);
  console.log('🚀 ====================================');
  
  // ทดสอบการเชื่อมต่อฐานข้อมูลเมื่อเริ่มต้น server
  console.log('🔍 ทดสอบการเชื่อมต่อฐานข้อมูล...');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

export default app;