import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: 'localhost',   // หรือที่อยู่ของฐานข้อมูล
  user: 'root',        // ชื่อผู้ใช้ MySQL
  password: '',        // รหัสผ่าน
  database: 'movie_booking', // ชื่อฐานข้อมูล
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export default pool;
