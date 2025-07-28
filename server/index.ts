const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 5000;

// เปิดใช้งาน CORS
app.use(cors());

// Route หลัก
app.get('/api/movies', (req, res) => {
  res.json({
    message: "Movies endpoint working!",
    movies: [] // ส่ง array ว่างเพื่อทดสอบ
  });
});

// Route สำหรับข้อมูลทดสอบ
app.get('/api/movies/test-data', (req, res) => {
  res.json({
    message: "Test data loaded successfully",
    movies: [
      {
        id: 1,
        title: "ตัวอย่างภาพยนตร์ 1",
        description: "นี่เป็นข้อมูลตัวอย่างสำหรับทดสอบระบบ",
        poster_url: "https://via.placeholder.com/300x450/1a1a1a/ffffff?text=ตัวอย่าง+1"
      },
      {
        id: 2,
        title: "ตัวอย่างภาพยนตร์ 2",
        description: "นี่เป็นข้อมูลตัวอย่างสำหรับทดสอบระบบ",
        poster_url: "https://via.placeholder.com/300x450/1a1a1a/ffffff?text=ตัวอย่าง+2"
      },
      {
        id: 3,
        title: "ตัวอย่างภาพยนตร์ 3",
        poster_url: "https://via.placeholder.com/300x450/1a1a1a/ffffff?text=ตัวอย่าง+3"
      }
    ]
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});