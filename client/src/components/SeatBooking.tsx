import React, { useState, useEffect, useCallback, useMemo } from 'react';

interface Seat {
  id: number;
  row_letter: string;
  seat_number: number;
  seat_type: 'regular' | 'premium' | 'vip';
  price: number;
  isBooked?: boolean;
  is_booked?: boolean;
}

interface Movie {
  id: number;
  title: string;
  poster_url: string;
}

interface Showtime {
  id: number;
  movie_id: number;
  time: string;
}

const SeatBookingPage: React.FC = () => {
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([]);
  const [loading, setLoading] = useState(true);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [showtimes, setShowtimes] = useState<Showtime[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<number | null>(null);
  const [selectedShowtime, setSelectedShowtime] = useState<number | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [isBooking, setIsBooking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const API_BASE = 'http://localhost:5000/api';

  const fetchData = async (endpoint: string) => {
    const response = await fetch(`${API_BASE}${endpoint}`);
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return response.json();
  };

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setError(null);
        const [movieData, showtimeData] = await Promise.all([
          fetchData('/movies'),
          fetchData('/showtimes')
        ]);
        
        setMovies(Array.isArray(movieData.movies || movieData) ? (movieData.movies || movieData) : []);
        setShowtimes(Array.isArray(showtimeData.showtimes || showtimeData) ? (showtimeData.showtimes || showtimeData) : []);
        setLoading(false);
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to load data');
        setLoading(false);
      }
    };
    loadInitialData();
  }, []);

 useEffect(() => {
  const loadSeats = async () => {
    if (!selectedShowtime) {
      setSeats([]);
      setSelectedSeats([]);
      return;
    }

    try {
      setError(null);
      const data = await fetchData(`/showtimes/${selectedShowtime}/seats`);
      const seatsData = Array.isArray(data.data || data.seats || data) ? (data.data || data.seats || data) : [];

      const processedSeats = seatsData.map((seat: any) => ({
        id: seat.id || 0,
        row_letter: seat.row_letter || '',
        seat_number: seat.seat_number || 0,
        seat_type: seat.seat_type || 'regular',
        price: Number(seat.price) || 0,
        isBooked: seat.is_booked || seat.isBooked || false
      }));

      setSeats(processedSeats);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load seats');
      setSeats([]);
    }
  };

  loadSeats();
}, [selectedShowtime]);


  const toggleSeatSelection = useCallback((seat: Seat) => {
    if (seat.isBooked || seat.is_booked) return;
    setSelectedSeats(prev => {
      const isSelected = prev.find(s => s.id === seat.id);
      return isSelected ? prev.filter(s => s.id !== seat.id) : [...prev, seat];
    });
  }, []);

  const getSeatColor = useCallback((seat: Seat) => {
    const isBooked = seat.isBooked || seat.is_booked;
    if (isBooked) return 'bg-red-500 cursor-not-allowed';
    if (selectedSeats.find(s => s.id === seat.id)) return 'bg-green-500';
    
    const colors = {
      vip: 'bg-amber-500 hover:bg-amber-400',
      premium: 'bg-blue-500 hover:bg-blue-400',
      regular: 'bg-gray-500 hover:bg-gray-400'
    };
    return colors[seat.seat_type];
  }, [selectedSeats]);

  const totalPrice = useMemo(() => 
    selectedSeats.reduce((total, seat) => total + (seat.price || 0), 0), 
    [selectedSeats]
  );

  const groupedSeats = useMemo(() => {
    return seats.reduce((groups, seat) => {
      const row = seat.row_letter;
      if (!groups[row]) groups[row] = [];
      groups[row].push(seat);
      return groups;
    }, {} as Record<string, Seat[]>);
  }, [seats]);

  const handleBooking = async () => {
    if (!selectedShowtime || selectedSeats.length === 0 || !customerName || !customerEmail) {
      alert('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    setIsBooking(true);
    try {
      const response = await fetch(`${API_BASE}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          showtimeId: selectedShowtime,
          customerName,
          customerEmail,
          seatIds: selectedSeats.map(seat => seat.id)
        })
      });

      const result = await response.json();
      if (result.success) {
        alert(`จองตั๋วสำเร็จ! รหัสการจอง: ${result.data.booking_id}`);
        setSelectedSeats([]);
        setCustomerName('');
        setCustomerEmail('');
        // Reload seats
        const data = await fetchData(`/showtimes/${selectedShowtime}/seats`);
        const seatsData = Array.isArray(data.data || data.seats || data) ? (data.data || data.seats || data) : [];
        setSeats(seatsData.map((seat: any) => ({
          id: seat.id || 0,
          row_letter: seat.row_letter || '',
          seat_number: seat.seat_number || 0,
          seat_type: seat.seat_type || 'regular',
          price: typeof seat.price === 'number' ? seat.price : 0,
          isBooked: seat.is_booked || seat.isBooked || false
        })));
      } else {
        alert(`เกิดข้อผิดพลาด: ${result.message}`);
      }
    } catch (error) {
      alert('เกิดข้อผิดพลาดในการจอง');
    } finally {
      setIsBooking(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-amber-500 mx-auto mb-4"></div>
          <h2 className="text-white text-xl">กำลังโหลดข้อมูล...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-white text-xl mb-2">เกิดข้อผิดพลาด</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-amber-500 hover:bg-amber-400 text-black font-bold py-2 px-4 rounded"
          >
            ลองใหม่
          </button>
        </div>
      </div>
    );
  }

  const selectedMovieData = movies.find(m => m.id === selectedMovie);
  const selectedShowtimeData = showtimes.find(s => s.id === selectedShowtime);
  const filteredShowtimes = showtimes.filter(s => s.movie_id === selectedMovie);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gray-900/80 backdrop-blur-md border-b border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center">
              <span className="text-xl">🎬</span>
            </div>
            <h1 className="text-2xl font-bold text-white">AF Cineplex - เลือกที่นั่ง</h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {/* Movie Selection */}
            <div className="bg-gray-800 rounded-xl p-6 mb-6 border border-gray-700">
              <h2 className="text-xl font-bold text-white mb-4">เลือกภาพยนตร์</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {movies.map(movie => (
                  <div 
                    key={movie.id}
                    className={`cursor-pointer border-2 rounded-lg p-3 transition-all ${
                      selectedMovie === movie.id ? 'border-amber-500 bg-amber-500/10' : 'border-gray-600 hover:border-gray-500'
                    }`}
                    onClick={() => {
                      setSelectedMovie(movie.id);
                      setSelectedShowtime(null);
                      setSelectedSeats([]);
                      setSeats([]);
                    }}
                  >
                    <img 
                      src={movie.poster_url} 
                      alt={movie.title}
                      className="w-full h-32 object-cover rounded mb-2"
                      onError={(e) => e.currentTarget.src = 'https://via.placeholder.com/300x450/1a1a1a/ffffff?text=ไม่มีภาพ'}
                    />
                    <h3 className="text-white font-medium text-sm">{movie.title}</h3>
                  </div>
                ))}
              </div>
            </div>

            {/* Showtime Selection */}
            {selectedMovie && (
              <div className="bg-gray-800 rounded-xl p-6 mb-6 border border-gray-700">
                <h2 className="text-xl font-bold text-white mb-4">เลือกรอบฉาย</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {filteredShowtimes.map(showtime => (
                    <button
                      key={showtime.id}
                      className={`p-3 rounded-lg transition-all ${
                        selectedShowtime === showtime.id
                          ? 'bg-amber-500 text-black font-medium'
                          : 'bg-gray-700 text-white hover:bg-gray-600'
                      }`}
                      onClick={() => {
                        setSelectedShowtime(showtime.id);
                        setSelectedSeats([]);
                      }}
                    >
                      {showtime.time?.slice(0, 5) || 'N/A'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Seat Map */}
            {selectedShowtime && (
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h2 className="text-xl font-bold text-white mb-4">เลือกที่นั่ง</h2>
                
                {seats.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-amber-500 mx-auto mb-4"></div>
                    <p className="text-gray-400">กำลังโหลดข้อมูลที่นั่ง...</p>
                  </div>
                ) : (
                  <>
                    {/* Screen */}
                    <div className="mb-8">
                      <div className="w-full h-2 bg-gradient-to-r from-transparent via-amber-500 to-transparent rounded-full mb-2"></div>
                      <p className="text-center text-gray-400 text-sm">จอภาพยนตร์</p>
                    </div>

                    {/* Legend */}
                    <div className="flex flex-wrap justify-center gap-4 mb-6">
                      {[
                        { color: 'bg-amber-500', label: 'VIP (฿350)' },
                        { color: 'bg-blue-500', label: 'Premium (฿280)' },
                        { color: 'bg-gray-500', label: 'Regular (฿220)' },
                        { color: 'bg-green-500', label: 'เลือกแล้ว' },
                        { color: 'bg-red-500', label: 'จองแล้ว' }
                      ].map(item => (
                        <div key={item.label} className="flex items-center space-x-2">
                          <div className={`w-4 h-4 ${item.color} rounded`}></div>
                          <span className="text-white text-sm">{item.label}</span>
                        </div>
                      ))}
                    </div>

                    {/* Seats */}
                    <div className="space-y-3">
                      {Object.keys(groupedSeats).sort().map(row => (
                        <div key={row} className="flex items-center justify-center space-x-2">
                          <span className="text-white font-bold w-6 text-center">{row}</span>
                          <div className="flex space-x-1">
                            {groupedSeats[row]
                              .sort((a, b) => a.seat_number - b.seat_number)
                              .map(seat => (
                                <button
                                  key={seat.id}
                                  className={`w-8 h-8 rounded text-xs font-bold transition-all ${getSeatColor(seat)} ${
                                    (seat.isBooked || seat.is_booked) ? '' : 'hover:scale-110'
                                  }`}
                                  onClick={() => toggleSeatSelection(seat)}
                                  disabled={seat.isBooked || seat.is_booked}
                                  title={`${seat.row_letter}${seat.seat_number} - ${seat.seat_type} (฿${seat.price})`}
                                >
                                  {seat.seat_number}
                                </button>
                              ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Booking Summary */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 sticky top-24">
              <h2 className="text-xl font-bold text-white mb-4">สรุปการจอง</h2>
              
              {selectedMovieData && (
                <div className="mb-4">
                  <img 
                    src={selectedMovieData.poster_url} 
                    alt={selectedMovieData.title}
                    className="w-full h-48 object-cover rounded-lg mb-3"
                    onError={(e) => e.currentTarget.src = 'https://via.placeholder.com/300x450/1a1a1a/ffffff?text=ไม่มีภาพ'}
                  />
                  <h3 className="text-white font-medium">{selectedMovieData.title}</h3>
                  {selectedShowtimeData && (
                    <p className="text-gray-400 text-sm">รอบ {selectedShowtimeData.time?.slice(0, 5)}</p>
                  )}
                </div>
              )}

              {selectedSeats.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-white font-medium mb-2">ที่นั่งที่เลือก:</h4>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {selectedSeats.map(seat => (
                      <span key={seat.id} className="bg-green-500 text-black px-2 py-1 rounded text-sm font-medium">
                        {seat.row_letter}{seat.seat_number}
                      </span>
                    ))}
                  </div>
                  <div className="text-right">
                    <span className="text-amber-400 text-xl font-bold">฿{totalPrice.toFixed(2)}</span>
                  </div>
                </div>
              )}

              {/* Customer Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-white text-sm font-medium mb-1">ชื่อ-นามสกุล</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-amber-500"
                    placeholder="กรอกชื่อ-นามสกุล"
                  />
                </div>
                <div>
                  <label className="block text-white text-sm font-medium mb-1">อีเมล</label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-amber-500"
                    placeholder="กรอกอีเมล"
                  />
                </div>
              </div>

              <button
                onClick={handleBooking}
                disabled={!selectedShowtime || selectedSeats.length === 0 || !customerName || !customerEmail || isBooking}
                className="w-full mt-6 bg-amber-500 hover:bg-amber-400 disabled:bg-gray-600 disabled:cursor-not-allowed text-black font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
              >
                {isBooking ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black mr-2"></div>
                    กำลังจอง...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 100 4v2a2 2 0 01-2 2H4a2 2 0 01-2-2v-2a2 2 0 100-4V6z" />
                    </svg>
                    จองตั๋ว (฿{totalPrice.toFixed(2)})
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default SeatBookingPage;