// server/src/routes/index.ts
import { Router } from 'express';
import { 
  getMovies, 
  getMovieById, 
  getMovieShowtimes, 
  testConnection,
  getSeats,
  getShowtimeSeats,
  createBooking
} from '../controllers/movieController';

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
  console.log('❤️ [Health] Health check requested');
  res.json({
    success: true,
    message: 'API is healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0'
  });
});

// Database test endpoint
router.get('/test-db', testConnection);

// Movie endpoints
router.get('/movies', getMovies);

// Movie by ID endpoint - ใช้ pattern ธรรมดา
router.get('/movies/:id', getMovieById);

// Movie showtimes endpoint - ใช้ pattern ธรรมดา  
router.get('/movies/:id/showtimes', getMovieShowtimes);

// Seat endpoints
router.get('/seats', getSeats);
router.get('/showtimes/:showtimeId/seats', getShowtimeSeats);

// Booking endpoints
router.post('/bookings', createBooking);

// API info endpoint
router.get('/', (req, res) => {
  console.log('ℹ️ [API] API info requested');
  res.json({
    success: true,
    message: 'Cinema Booking API',
    version: '1.0.0',
    endpoints: [
      'GET /api/health - Health check',
      'GET /api/test-db - Database connection test',
      'GET /api/movies - Get all movies',
      'GET /api/movies/:id - Get movie by ID',
      'GET /api/movies/:id/showtimes - Get movie showtimes',
      'GET /api/seats - Get all seats',
      'GET /api/showtimes/:showtimeId/seats - Get seats for showtime',
      'POST /api/bookings - Create new booking'
    ],
    timestamp: new Date().toISOString()
  });
});

export default router;