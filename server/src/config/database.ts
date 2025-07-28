import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// สร้าง pool options
const poolConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'movie_booking',
  port: parseInt(process.env.DB_PORT || '3306'),
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '10'),
  queueLimit: parseInt(process.env.DB_QUEUE_LIMIT || '0')
};

export const pool = mysql.createPool(poolConfig);

export const testConnection = async (): Promise<void> => {
  try {
    const connection = await pool.getConnection();
    console.log('📊 Database connection successful!');
    
    // Test query
    const [rows] = await connection.execute('SELECT 1 as test');
    console.log('✅ Database test query successful');
    
    connection.release();
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
};