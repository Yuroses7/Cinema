import { Request, Response } from 'express';
import mysql from 'mysql2/promise';
import { ResultSetHeader } from 'mysql2';

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'movie_booking'
};

const pool = mysql.createPool({
  ...dbConfig,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

interface Movie {
  id: number;
  title: string;
  description: string;
  poster_url: string;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  movies: T[];
  count: number;
}

const handleError = (res: Response, error: any, message: string) => {
  console.error('❌', message, error);
  let errorMessage = message;
  
  if (error instanceof Error) {
    if (error.message.includes('ECONNREFUSED')) errorMessage = 'ไม่สามารถเชื่อมต่อฐานข้อมูลได้';
    else if (error.message.includes('Access denied')) errorMessage = 'ข้อมูลการเข้าถึงฐานข้อมูลไม่ถูกต้อง';
    else if (error.message.includes('Unknown database')) errorMessage = 'ไม่พบฐานข้อมูลที่ระบุ';
    else errorMessage = error.message;
  }

  res.status(500).json({
    success: false,
    message: errorMessage,
    error: process.env.NODE_ENV === 'development' ? error : undefined
  });
};

export const getMovies = async (req: Request, res: Response): Promise<void> => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute<mysql.RowDataPacket[]>(
      'SELECT id, title, description, poster_url FROM movies ORDER BY id ASC'
    );
    
    if (rows.length === 0) {
      const [tableCheck] = await connection.execute<mysql.RowDataPacket[]>('SHOW TABLES LIKE "movies"');
      if (tableCheck.length === 0) {
        res.status(500).json({ success: false, message: 'ตาราง movies ไม่พบในฐานข้อมูล', movies: [], count: 0 });
        return;
      }
      res.status(200).json({ success: true, message: 'ฐานข้อมูลเชื่อมต่อสำเร็จ แต่ไม่มีข้อมูลภาพยนตร์', movies: [], count: 0 });
      return;
    }

    const movies: Movie[] = rows.map((row: mysql.RowDataPacket) => ({
      id: row.id,
      title: row.title || 'ไม่มีชื่อภาพยนตร์',
      description: row.description || 'ไม่มีคำอธิบาย',
      poster_url: row.poster_url || 'https://via.placeholder.com/300x450/1a1a1a/ffffff?text=ไม่มีภาพ'
    }));

    res.status(200).json({ success: true, message: 'ดึงข้อมูลภาพยนตร์สำเร็จ', movies, count: movies.length });
  } catch (error) {
    handleError(res, error, 'เกิดข้อผิดพลาดในการดึงข้อมูลจากฐานข้อมูล');
  } finally {
    connection.release();
  }
};

export const getMovieById = async (req: Request, res: Response): Promise<void> => {
  const movieId = parseInt(req.params.id);
  if (isNaN(movieId)) {
    res.status(400).json({ success: false, message: 'รหัสภาพยนตร์ไม่ถูกต้อง' });
    return;
  }

  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute<mysql.RowDataPacket[]>(
      'SELECT id, title, description, poster_url FROM movies WHERE id = ?', [movieId]
    );
    
    if (rows.length === 0) {
      res.status(404).json({ success: false, message: 'ไม่พบภาพยนตร์ที่ระบุ' });
      return;
    }

    const movie: Movie = {
      id: rows[0].id,
      title: rows[0].title,
      description: rows[0].description,
      poster_url: rows[0].poster_url
    };

    res.status(200).json({ success: true, message: 'ดึงข้อมูลภาพยนตร์สำเร็จ', data: movie });
  } catch (error) {
    handleError(res, error, 'เกิดข้อผิดพลาดในการดึงข้อมูลภาพยนตร์');
  } finally {
    connection.release();
  }
};

export const getMovieShowtimes = async (req: Request, res: Response): Promise<void> => {
  const movieId = parseInt(req.params.id);
  if (isNaN(movieId)) {
    res.status(400).json({ success: false, message: 'รหัสภาพยนตร์ไม่ถูกต้อง' });
    return;
  }

  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute<mysql.RowDataPacket[]>(
      `SELECT s.id, s.time, m.title as movie_title, m.id as movie_id
       FROM showtimes s JOIN movies m ON s.movie_id = m.id
       WHERE s.movie_id = ? ORDER BY s.time ASC`, [movieId]
    );
    
    res.status(200).json({ success: true, message: 'ดึงข้อมูลรอบฉายสำเร็จ', data: rows, count: rows.length });
  } catch (error) {
    handleError(res, error, 'เกิดข้อผิดพลาดในการดึงรอบฉาย');
  } finally {
    connection.release();
  }
};

export const getSeats = async (req: Request, res: Response): Promise<void> => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute<mysql.RowDataPacket[]>(
      'SELECT id, row_letter, seat_number, seat_type, price FROM seats ORDER BY row_letter, seat_number'
    );
    
    res.status(200).json({ success: true, message: 'ดึงข้อมูลที่นั่งสำเร็จ', data: rows, count: rows.length });
  } catch (error) {
    handleError(res, error, 'เกิดข้อผิดพลาดในการดึงข้อมูลที่นั่ง');
  } finally {
    connection.release();
  }
};

export const getShowtimeSeats = async (req: Request, res: Response): Promise<void> => {
  const showtimeId = parseInt(req.params.showtimeId);
  if (isNaN(showtimeId)) {
    res.status(400).json({ success: false, message: 'รหัสรอบฉายไม่ถูกต้อง' });
    return;
  }

  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute<mysql.RowDataPacket[]>(
      `SELECT s.id, s.row_letter, s.seat_number, s.seat_type, s.price,
              CASE WHEN bd.seat_id IS NOT NULL THEN true ELSE false END as is_booked
       FROM seats s LEFT JOIN booking_details bd ON s.id = bd.seat_id AND bd.showtime_id = ?
       ORDER BY s.row_letter, s.seat_number`, [showtimeId]
    );
    
    res.status(200).json({ 
      success: true, 
      message: 'ดึงข้อมูลที่นั่งสำหรับรอบฉายสำเร็จ', 
      data: rows, 
      count: rows.length, 
      showtimeId 
    });
  } catch (error) {
    handleError(res, error, 'เกิดข้อผิดพลาดในการดึงข้อมูลที่นั่งรอบฉาย');
  } finally {
    connection.release();
  }
};

export const createBooking = async (req: Request, res: Response): Promise<void> => {
  const { showtimeId, customerName, customerEmail, seatIds } = req.body;

  if (!showtimeId || !customerName || !customerEmail || !seatIds || !Array.isArray(seatIds)) {
    res.status(400).json({ 
      success: false, 
      message: 'ข้อมูลไม่ครบถ้วน กรุณาระบุ showtimeId, customerName, customerEmail และ seatIds' 
    });
    return;
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // ตรวจสอบที่นั่งที่จองแล้ว
    const [bookedSeats] = await connection.execute<mysql.RowDataPacket[]>(
      `SELECT seat_id FROM booking_details WHERE showtime_id = ? AND seat_id IN (${seatIds.map(() => '?').join(',')})`,
      [showtimeId, ...seatIds]
    );

    if (bookedSeats.length > 0) {
      await connection.rollback();
      res.status(400).json({
        success: false,
        message: 'ที่นั่งบางที่ถูกจองไปแล้ว',
        bookedSeatIds: bookedSeats.map(row => row.seat_id)
      });
      return;
    }

    // สร้างการจอง
    const [bookingResult] = await connection.execute<mysql.ResultSetHeader>(
      'INSERT INTO bookings (showtime_id, customer_name, customer_email) VALUES (?, ?, ?)',
      [showtimeId, customerName, customerEmail]
    );

    // สร้างรายละเอียดการจอง
    for (const seatId of seatIds) {
      await connection.execute(
        'INSERT INTO booking_details (booking_id, seat_id, showtime_id) VALUES (?, ?, ?)',
        [bookingResult.insertId, seatId, showtimeId]
      );
    }

    // ดึงข้อมูลการจอง
    const [bookingInfo] = await connection.execute<mysql.RowDataPacket[]>(
      `SELECT b.id as booking_id, b.customer_name, b.customer_email, b.created_at,
              m.title as movie_title, s.time as showtime,
              GROUP_CONCAT(CONCAT(seat.row_letter, seat.seat_number) ORDER BY seat.row_letter, seat.seat_number) as seats,
              SUM(seat.price) as total_price
       FROM bookings b
       JOIN showtimes s ON b.showtime_id = s.id
       JOIN movies m ON s.movie_id = m.id
       JOIN booking_details bd ON b.id = bd.booking_id
       JOIN seats seat ON bd.seat_id = seat.id
       WHERE b.id = ? GROUP BY b.id`, [bookingResult.insertId]
    );

    await connection.commit();
    res.status(201).json({ success: true, message: 'สร้างการจองสำเร็จ', data: bookingInfo[0] });
  } catch (error) {
    await connection.rollback();
    handleError(res, error, 'เกิดข้อผิดพลาดในการสร้างการจอง');
  } finally {
    connection.release();
  }
};

export const getAllShowtimes = async (req: Request, res: Response): Promise<void> => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute<mysql.RowDataPacket[]>(
      `SELECT s.id, s.movie_id, s.time, m.title as movie_title, 
              m.description as movie_description, m.poster_url as movie_poster_url
       FROM showtimes s JOIN movies m ON s.movie_id = m.id
       ORDER BY s.movie_id, s.time ASC`
    );
    
    const showtimes = rows.map((row: mysql.RowDataPacket) => ({
      id: row.id,
      movie_id: row.movie_id,
      time: row.time,
      movie_title: row.movie_title,
      movie_description: row.movie_description,
      movie_poster_url: row.movie_poster_url
    }));

    res.status(200).json({ success: true, message: 'ดึงข้อมูลรอบฉายทั้งหมดสำเร็จ', showtimes, count: showtimes.length });
  } catch (error) {
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการดึงรอบฉายทั้งหมด', showtimes: [], count: 0 });
  } finally {
    connection.release();
  }
};

export const testConnection = async (req: Request, res: Response): Promise<void> => {
  const connection = await pool.getConnection();
  try {
    await connection.execute('SELECT 1 as test');
    const [tables] = await connection.execute<mysql.RowDataPacket[]>('SHOW TABLES LIKE "movies"');
    const [countResult] = await connection.execute<mysql.RowDataPacket[]>('SELECT COUNT(*) as count FROM movies');
    
    res.status(200).json({
      success: true,
      message: 'การเชื่อมต่อฐานข้อมูลสำเร็จ',
      database: dbConfig.database,
      host: dbConfig.host,
      port: dbConfig.port,
      moviesTable: tables.length > 0 ? 'พบ' : 'ไม่พบ',
      movieCount: countResult[0]?.count || 0,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'การเชื่อมต่อฐานข้อมูลล้มเหลว',
      error: error instanceof Error ? error.message : 'Unknown error',
      config: { host: dbConfig.host, port: dbConfig.port, database: dbConfig.database }
    });
  } finally {
    connection.release();
  }
};