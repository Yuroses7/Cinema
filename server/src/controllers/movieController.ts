// server/controllers/movieController.ts
import { Request, Response } from 'express';
import mysql from 'mysql2/promise';
import { ResultSetHeader } from 'mysql2';
// Database connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'movie_booking'
};

// สร้าง connection pool - ลบ properties ที่ไม่รองรับใน mysql2 v3.6.5
const poolOptions: mysql.PoolOptions = {
  host: dbConfig.host,
  port: dbConfig.port,
  user: dbConfig.user,
  password: dbConfig.password,
  database: dbConfig.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

const pool = mysql.createPool(poolOptions);

// Interface สำหรับ Movie
interface Movie {
  id: number;
  title: string;
  description: string;
  poster_url: string;
}

// Interface สำหรับ API Response
interface ApiResponse<T> {
  success: boolean;
  message: string;
  movies: T[];
  count: number;
}

/**
 * ดึงข้อมูลภาพยนตร์ทั้งหมด
 */
export const getMovies = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('🎬 [Controller] กำลังดึงข้อมูลภาพยนตร์จากฐานข้อมูล...');
    
    // ทดสอบ connection ก่อน
    const connection = await pool.getConnection();
    console.log('✅ [DB] เชื่อมต่อฐานข้อมูลสำเร็จ');
    
    try {
      // Query ข้อมูลภาพยนตร์
      const [rows] = await connection.execute<mysql.RowDataPacket[]>(
        'SELECT id, title, description, poster_url FROM movies ORDER BY id ASC'
      );
      
      console.log('📊 [DB] จำนวนภาพยนตร์ที่พบ:', rows.length);
      
      if (rows.length === 0) {
        console.log('⚠️ [DB] ไม่พบข้อมูลภาพยนตร์ในฐานข้อมูล');
        
        // ตรวจสอบว่าตารางมีอยู่หรือไม่
        const [tableCheck] = await connection.execute<mysql.RowDataPacket[]>(
          'SHOW TABLES LIKE "movies"'
        );
        
        if (tableCheck.length === 0) {
          res.status(500).json({
            success: false,
            message: 'ตาราง movies ไม่พบในฐานข้อมูล',
            movies: [],
            count: 0
          } as ApiResponse<Movie>);
          return;
        }
        
        res.status(200).json({
          success: true,
          message: 'ฐานข้อมูลเชื่อมต่อสำเร็จ แต่ไม่มีข้อมูลภาพยนตร์',
          movies: [],
          count: 0
        } as ApiResponse<Movie>);
        return;
      }

      // แปลงข้อมูลให้เป็น Movie interface
      const movies: Movie[] = rows.map((row: mysql.RowDataPacket) => ({
        id: row.id,
        title: row.title || 'ไม่มีชื่อภาพยนตร์',
        description: row.description || 'ไม่มีคำอธิบาย',
        poster_url: row.poster_url || 'https://via.placeholder.com/300x450/1a1a1a/ffffff?text=ไม่มีภาพ'
      }));

      console.log('✅ [Controller] ส่งข้อมูลภาพยนตร์สำเร็จ:', movies.length, 'เรื่อง');
      console.log('🎭 [Data] ภาพยนตร์:', movies.map(m => `${m.id}: ${m.title}`));

      res.status(200).json({
        success: true,
        message: 'ดึงข้อมูลภาพยนตร์สำเร็จ',
        movies: movies,
        count: movies.length
      } as ApiResponse<Movie>);

    } finally {
      // คืน connection กลับ pool
      connection.release();
    }

  } catch (error) {
    console.error('❌ [Controller] เกิดข้อผิดพลาดในการดึงข้อมูลภาพยนตร์:', error);
    
    // ตรวจสอบประเภทของ error
    let errorMessage = 'เกิดข้อผิดพลาดในการดึงข้อมูลจากฐานข้อมูล';
    
    if (error instanceof Error) {
      if (error.message.includes('ECONNREFUSED')) {
        errorMessage = 'ไม่สามารถเชื่อมต่อฐานข้อมูลได้';
      } else if (error.message.includes('Access denied')) {
        errorMessage = 'ข้อมูลการเข้าถึงฐานข้อมูลไม่ถูกต้อง';
      } else if (error.message.includes('Unknown database')) {
        errorMessage = 'ไม่พบฐานข้อมูลที่ระบุ';
      } else {
        errorMessage = error.message;
      }
    }

    res.status(500).json({
      success: false,
      message: errorMessage,
      movies: [],
      count: 0,
      error: process.env.NODE_ENV === 'development' ? error : undefined
    } as ApiResponse<Movie> & { error?: any });
  }
};

/**
 * ดึงข้อมูลภาพยนตร์เรื่องเดียว
 */
export const getMovieById = async (req: Request, res: Response): Promise<void> => {
  try {
    const movieId = parseInt(req.params.id);
    
    if (isNaN(movieId)) {
      res.status(400).json({
        success: false,
        message: 'รหัสภาพยนตร์ไม่ถูกต้อง'
      });
      return;
    }

    console.log('🎬 [Controller] กำลังดึงข้อมูลภาพยนตร์ ID:', movieId);
    
    const connection = await pool.getConnection();
    
    try {
      const [rows] = await connection.execute<mysql.RowDataPacket[]>(
        'SELECT id, title, description, poster_url FROM movies WHERE id = ?',
        [movieId]
      );
      
      if (rows.length === 0) {
        res.status(404).json({
          success: false,
          message: 'ไม่พบภาพยนตร์ที่ระบุ'
        });
        return;
      }

      const movie: Movie = {
        id: rows[0].id,
        title: rows[0].title,
        description: rows[0].description,
        poster_url: rows[0].poster_url
      };

      console.log('✅ [Controller] พบภาพยนตร์:', movie.title);

      res.status(200).json({
        success: true,
        message: 'ดึงข้อมูลภาพยนตร์สำเร็จ',
        data: movie
      });

    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('❌ [Controller] เกิดข้อผิดพลาดในการดึงข้อมูลภาพยนตร์:', error);
    
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลภาพยนตร์',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

/**
 * ดึงรอบฉายของภาพยนตร์
 */
export const getMovieShowtimes = async (req: Request, res: Response): Promise<void> => {
  try {
    const movieId = parseInt(req.params.id);
    
    if (isNaN(movieId)) {
      res.status(400).json({
        success: false,
        message: 'รหัสภาพยนตร์ไม่ถูกต้อง'
      });
      return;
    }

    console.log('🕐 [Controller] กำลังดึงรอบฉายของภาพยนตร์ ID:', movieId);
    
    const connection = await pool.getConnection();
    
    try {
      const query = `
        SELECT 
          s.id,
          s.time,
          m.title as movie_title,
          m.id as movie_id
        FROM showtimes s
        JOIN movies m ON s.movie_id = m.id
        WHERE s.movie_id = ?
        ORDER BY s.time ASC
      `;
      
      const [rows] = await connection.execute<mysql.RowDataPacket[]>(query, [movieId]);
      
      console.log('📊 [DB] จำนวนรอบฉายที่พบ:', rows.length);

      res.status(200).json({
        success: true,
        message: 'ดึงข้อมูลรอบฉายสำเร็จ',
        data: rows,
        count: rows.length
      });

    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('❌ [Controller] เกิดข้อผิดพลาดในการดึงรอบฉาย:', error);
    
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงรอบฉาย',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};
// เพิ่มฟังก์ชันเหล่านี้ใน movieController.ts

/**
 * ดึงข้อมูลที่นั่งทั้งหมด
 */
export const getSeats = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('💺 [Controller] กำลังดึงข้อมูลที่นั่ง...');
    
    const connection = await pool.getConnection();
    
    try {
      const [rows] = await connection.execute<mysql.RowDataPacket[]>(
        'SELECT id, row_letter, seat_number, seat_type, price FROM seats ORDER BY row_letter, seat_number'
      );
      
      console.log('📊 [DB] จำนวนที่นั่งที่พบ:', rows.length);

      res.status(200).json({
        success: true,
        message: 'ดึงข้อมูลที่นั่งสำเร็จ',
        data: rows,
        count: rows.length
      });

    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('❌ [Controller] เกิดข้อผิดพลาดในการดึงข้อมูลที่นั่ง:', error);
    
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลที่นั่ง',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

/**
 * ดึงข้อมูลที่นั่งสำหรับรอบฉายเฉพาะ (แสดงสถานะว่าจองแล้วหรือยัง)
 */
export const getShowtimeSeats = async (req: Request, res: Response): Promise<void> => {
  try {
    const showtimeId = parseInt(req.params.showtimeId);
    
    if (isNaN(showtimeId)) {
      res.status(400).json({
        success: false,
        message: 'รหัสรอบฉายไม่ถูกต้อง'
      });
      return;
    }

    console.log('💺 [Controller] กำลังดึงข้อมูลที่นั่งสำหรับรอบฉาย ID:', showtimeId);
    
    const connection = await pool.getConnection();
    
    try {
      // ดึงข้อมูลที่นั่งพร้อมสถานะการจอง
      const query = `
        SELECT 
          s.id,
          s.row_letter,
          s.seat_number,
          s.seat_type,
          s.price,
          CASE 
            WHEN bd.seat_id IS NOT NULL THEN true 
            ELSE false 
          END as is_booked
        FROM seats s
        LEFT JOIN booking_details bd ON s.id = bd.seat_id AND bd.showtime_id = ?
        ORDER BY s.row_letter, s.seat_number
      `;
      
      const [rows] = await connection.execute<mysql.RowDataPacket[]>(query, [showtimeId]);
      
      console.log('📊 [DB] จำนวนที่นั่งที่พบ:', rows.length);

      res.status(200).json({
        success: true,
        message: 'ดึงข้อมูลที่นั่งสำหรับรอบฉายสำเร็จ',
        data: rows,
        count: rows.length,
        showtimeId: showtimeId
      });

    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('❌ [Controller] เกิดข้อผิดพลาดในการดึงข้อมูลที่นั่งรอบฉาย:', error);
    
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลที่นั่งรอบฉาย',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

/**
 * สร้างการจองใหม่
 */
export const createBooking = async (req: Request, res: Response): Promise<void> => {
  try {
    const { showtimeId, customerName, customerEmail, seatIds } = req.body;

    // Validation
    if (!showtimeId || !customerName || !customerEmail || !seatIds || !Array.isArray(seatIds)) {
      res.status(400).json({
        success: false,
        message: 'ข้อมูลไม่ครบถ้วน กรุณาระบุ showtimeId, customerName, customerEmail และ seatIds'
      });
      return;
    }

    console.log('🎫 [Controller] กำลังสร้างการจอง:', {
      showtimeId,
      customerName,
      customerEmail,
      seatIds
    });
    
    const connection = await pool.getConnection();
    
    try {
      // เริ่ม transaction
      await connection.beginTransaction();

      // ตรวจสอบว่าที่นั่งที่เลือกยังว่างอยู่หรือไม่
      const checkQuery = `
        SELECT seat_id 
        FROM booking_details 
        WHERE showtime_id = ? AND seat_id IN (${seatIds.map(() => '?').join(',')})
      `;
      
      const [bookedSeats] = await connection.execute<mysql.RowDataPacket[]>(
        checkQuery, 
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

      const bookingId = bookingResult.insertId;

      // สร้างรายละเอียดการจอง
      for (const seatId of seatIds) {
        await connection.execute(
          'INSERT INTO booking_details (booking_id, seat_id, showtime_id) VALUES (?, ?, ?)',
          [bookingId, seatId, showtimeId]
        );
      }

      // ดึงข้อมูลการจองที่สร้างขึ้น
      const [bookingInfo] = await connection.execute<mysql.RowDataPacket[]>(`
        SELECT 
          b.id as booking_id,
          b.customer_name,
          b.customer_email,
          b.created_at,
          m.title as movie_title,
          s.time as showtime,
          GROUP_CONCAT(CONCAT(seat.row_letter, seat.seat_number) ORDER BY seat.row_letter, seat.seat_number) as seats,
          SUM(seat.price) as total_price
        FROM bookings b
        JOIN showtimes s ON b.showtime_id = s.id
        JOIN movies m ON s.movie_id = m.id
        JOIN booking_details bd ON b.id = bd.booking_id
        JOIN seats seat ON bd.seat_id = seat.id
        WHERE b.id = ?
        GROUP BY b.id
      `, [bookingId]);

      await connection.commit();

      console.log('✅ [Controller] สร้างการจองสำเร็จ ID:', bookingId);

      res.status(201).json({
        success: true,
        message: 'สร้างการจองสำเร็จ',
        data: bookingInfo[0]
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('❌ [Controller] เกิดข้อผิดพลาดในการสร้างการจอง:', error);
    
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการสร้างการจอง',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

/**
 * ทดสอบการเชื่อมต่อฐานข้อมูล
 */
export const testConnection = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('🔧 [Test] ทดสอบการเชื่อมต่อฐานข้อมูล...');
    
    const connection = await pool.getConnection();
    
    try {
      // ทดสอบ query พื้นฐาน
      await connection.execute('SELECT 1 as test');
      
      // ตรวจสอบตาราง movies
      const [tables] = await connection.execute<mysql.RowDataPacket[]>(
        'SHOW TABLES LIKE "movies"'
      );
      
      // นับจำนวนภาพยนตร์
      const [countResult] = await connection.execute<mysql.RowDataPacket[]>(
        'SELECT COUNT(*) as count FROM movies'
      );
      
      const movieCount = countResult[0]?.count || 0;
      
      console.log('✅ [Test] การเชื่อมต่อฐานข้อมูลสำเร็จ');
      console.log('📊 [Test] จำนวนภาพยนตร์ในฐานข้อมูล:', movieCount);
      
      res.status(200).json({
        success: true,
        message: 'การเชื่อมต่อฐานข้อมูลสำเร็จ',
        database: dbConfig.database,
        host: dbConfig.host,
        port: dbConfig.port,
        moviesTable: tables.length > 0 ? 'พบ' : 'ไม่พบ',
        movieCount: movieCount,
        timestamp: new Date().toISOString()
      });

    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('❌ [Test] การเชื่อมต่อฐานข้อมูลล้มเหลว:', error);
    
    res.status(500).json({
      success: false,
      message: 'การเชื่อมต่อฐานข้อมูลล้มเหลว',
      error: error instanceof Error ? error.message : 'Unknown error',
      config: {
        host: dbConfig.host,
        port: dbConfig.port,
        database: dbConfig.database
      }
    });
  }
};
