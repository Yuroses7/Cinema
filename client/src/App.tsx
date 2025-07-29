import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface Movie {
  id: number;
  title: string;
  description: string;
  poster_url: string;
}

const App: React.FC = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchMovies = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:5000/api/movies', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // รองรับทั้งรูปแบบ { movies: [...] } และ [...]
      const movieList = data.movies || data;
      
      if (Array.isArray(movieList) && movieList.length > 0) {
        const validMovies = movieList.map((movie: any) => ({
          id: movie.id || Date.now() + Math.random(),
          title: movie.title || 'ไม่มีชื่อภาพยนตร์',
          description: movie.description || 'ไม่มีคำอธิบาย',
          poster_url: movie.poster_url || 'https://via.placeholder.com/300x450/1a1a1a/ffffff?text=ไม่มีภาพ'
        }));

        setMovies(validMovies);
      } else {
        throw new Error('ไม่มีข้อมูลภาพยนตร์ในระบบ');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการโหลดข้อมูล';
      setError(errorMessage);
      console.error('Error fetching movies:', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovies();
  }, []);

  const handleBooking = (movie: Movie) => {
    // นำทางไปหน้าจองตั๋วพร้อม query parameters
    navigate(`/booking?movieId=${movie.id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-amber-500 mx-auto mb-4"></div>
          <h2 className="text-white text-xl font-medium">กำลังโหลดข้อมูล...</h2>
          <p className="text-gray-400 mt-2">กรุณารอสักครู่</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
      {/* ส่วนหัวเว็บ */}
      <header className="sticky top-0 z-50 bg-gray-900/80 backdrop-blur-md border-b border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center">
                <span className="text-xl">🎬</span>
              </div>
              <h1 className="text-2xl font-bold text-white">AF Cineplex</h1>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/booking')}
                className="px-4 py-2 bg-amber-500 text-black rounded-lg hover:bg-amber-400 transition-colors flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 100 4v2a2 2 0 01-2 2H4a2 2 0 01-2-2v-2a2 2 0 100-4V6z" />
                </svg>
                จองตั๋ว
              </button>
              <button
                onClick={fetchMovies}
                className="px-4 py-2 bg-amber-500/20 text-amber-300 rounded-lg hover:bg-amber-500/30 transition-colors flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
                โหลดใหม่
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* แสดงข้อผิดพลาด (ถ้ามี) */}
      {error && (
        <div className="container mx-auto px-4 pt-6">
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-400 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <h3 className="text-red-300 font-medium">เกิดข้อผิดพลาด</h3>
              <p className="text-red-200 text-sm mt-1">{error}</p>
              <button
                onClick={fetchMovies}
                className="mt-2 text-red-300 hover:text-red-200 text-sm underline"
              >
                ลองใหม่อีกครั้ง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ส่วน Hero */}
      <section className="text-center py-16 px-4">
        <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500 mb-6">
          ภาพยนตร์ยอดนิยม
        </h1>
        <p className="text-lg text-gray-300 mb-4">ค้นหาภาพยนตร์โปรดของคุณและจองตั๋วได้ทันที</p>
        <div className="max-w-md mx-auto bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <p className="text-gray-400 text-sm">
            {movies.length > 0
              ? `พบภาพยนตร์ทั้งหมด ${movies.length} เรื่อง`
              : 'กำลังเตรียมภาพยนตร์ใหม่สำหรับคุณ'}
          </p>
        </div>
      </section>

      {/* ส่วนรายการภาพยนตร์ */}
      <main className="container mx-auto px-4 pb-20">
        {movies.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-block bg-gray-800 p-6 rounded-full mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">ไม่พบภาพยนตร์</h2>
            <p className="text-gray-400 mb-6">ไม่สามารถโหลดข้อมูลภาพยนตร์ได้</p>
            <button
              onClick={fetchMovies}
              className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-black font-medium rounded-lg transition-colors inline-flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
              </svg>
              ลองอีกครั้ง
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {movies.map((movie) => (
              <article
                key={movie.id}
                className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 hover:border-amber-400 transition-all hover:shadow-lg hover:shadow-amber-400/10 group"
              >
                <div className="relative aspect-[2/3] overflow-hidden">
                  <img
                    src={movie.poster_url}
                    alt={`Poster ${movie.title}`}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => {
                      e.currentTarget.src = 'https://via.placeholder.com/300x450/1a1a1a/ffffff?text=ไม่มีภาพ';
                      e.currentTarget.className = 'w-full h-full object-contain bg-gray-900 p-4';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                    <span className="text-xs text-gray-300">รหัส: {movie.id}</span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-white font-bold text-lg truncate mb-1">{movie.title}</h3>
                  <p className="text-gray-400 text-sm line-clamp-2 h-12 mb-4">{movie.description}</p>
                  <button
                    onClick={() => handleBooking(movie)}
                    className="w-full bg-amber-500 hover:bg-amber-400 text-black font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 100 4v2a2 2 0 01-2 2H4a2 2 0 01-2-2v-2a2 2 0 100-4V6z" />
                    </svg>
                    จองตั๋ว
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      {/* ส่วนท้ายเว็บ */}
      <footer className="bg-gray-900/50 border-t border-gray-800 py-8">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <p className="text-gray-400">
              © {new Date().getFullYear()} AF Cineplex - ระบบจองตั๋วภาพยนตร์ออนไลน์
            </p>
            <p className="text-gray-500 text-sm mt-2">
              พัฒนาด้วย React, TypeScript และ Tailwind CSS
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;